#!/usr/bin/env python3
"""Fail when an nginx block sets its own `add_header` and so drops the ones it would inherit.

    python3 scripts/check_nginx_headers.py     # CI: docs-checks.yml

Exit 0: in every nginx config git tracks, each block that sets an
`add_header` also sets every header it would inherit. 1: one does not, or
a config cannot be read; each finding is one `FAIL:` line, then how to fix
it.

## Why this exists

⚠️ **nginx inherits `add_header` from the enclosing level only when a level
sets none of its own.** So a `server` that sets `X-Frame-Options` and a
`location /` that sets only `Cache-Control` send `index.html` with the
Cache-Control and nothing else. nginx says nothing, `nginx -t` passes, and a
page looks the same. The web template of buildforge-starter had exactly
that shape, so every web project made from it did too: on 2026-09-30
`https://ps-db.cloud/` carried none of its three server headers, while
`/api/ready`, whose location sets none, carried all three. Found in blog#18
(buildforge-starter#72); on that day this check named 23 such blocks in 6
of the org's repos, this one included.

⚠️ **A pinned release, never a local copy**, shipped as the secret scanner
is (buildforge-starter#50): `scripts/shared-checks.lock` holds its version
and sha256, and `scripts/shared_checks.py update check_nginx_headers
<version>` moves a repo to a new one.

## What it reads

- **Every file git tracks whose name ends in `.conf` or `.conf.template`
  and either holds `add_header` or opens an `http`, `server` or `location`
  block** (its headers may all live in snippets), found by git and never
  by a list: ps-db's `frontend/nginx.conf.template`, blog's `nginx.conf`,
  profile-homepage's `nginx/default.conf`. supervisord's INI is neither.
  One that cannot be opened (deleted, a broken link, a folder, no
  permission) is a `FAIL:` line. Outside a git work tree nothing is read,
  and the OK line says so.
- ⚠️ **The top of a file is a level too.** nginx reads a `conf.d` file
  inside `http {}`, so a header there is inherited, and dropped, like a
  server's.
- **An `include` is read from the repo**: the longest tail of its path
  that names a file under the including file's folder, since nginx reads
  it in the image, where the Dockerfile put it. `/etc/nginx/snippets/a.conf`
  finds `snippets/a.conf`, else `a.conf`. A glob takes every file it
  matches, in name order, but not a file already being read: in a repo,
  nginx.conf and its `conf.d/*.conf` can share a folder. One found nowhere
  (`mime.types`, `proxy_params`) is nginx's own and sets no header. An
  include cycle is a `FAIL:` line.
- **`add_header_inherit`** (nginx 1.29.3): `merge` keeps the inherited
  headers, `off` drops them on purpose, and both pass. Like nginx, a block
  takes the setting of the block around it unless it sets its own.
- Header names in any letter case, quoted or not. A comment, an envsubst
  `${VAR}` in a template, and a quoted `"}"` or `''` are read as nginx reads
  them. A snippet read on its own and through its includer is named once.
- ⚠️ **Not checked: `always`.** A header set without it is sent only on
  2xx and 3xx answers, so a 404 goes without it (cvtailor#460).

Stdlib only, like everything a hook or `init.py` imports.
"""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys
from typing import NamedTuple

__version__ = "1.0.0"

ROOT = pathlib.Path(__file__).resolve().parent.parent

SUFFIXES = (".conf", ".conf.template")
# The directives this check reads the first argument of.
NAMED = ("add_header", "add_header_inherit", "include")
GLOB = "*?["
# A line that opens an http, server or location block: supervisord's INI has none.
BLOCK = re.compile(r"^\s*(?:http|server|location)\b[^;{]*\{", re.MULTILINE)


class Dropped(NamedTuple):
    """A block that sets its own add_header, so its answers lose the inherited `headers`."""

    file: str
    line: int
    block: str
    headers: tuple[str, ...]


class Unreadable(ValueError):
    """A config this check cannot read as nginx; the message says where."""


class Block(NamedTuple):
    """One directive: `children` is None when a `;` ends it, else the directives in its braces."""

    name: str
    args: tuple[str, ...]
    file: str
    line: int
    children: list | None


def _tokens(text: str) -> list[tuple[str, str, int]]:
    """(kind, text, line) for each token: kind is `{`, `}` or `;` for syntax, else "word".

    ⚠️ A quoted `"}"` or `''` is a word, never syntax (review of #78).
    """
    found, i, line = [], 0, 1
    while i < len(text):
        ch = text[i]
        if ch == "\n":
            line += 1
            i += 1
        elif ch.isspace():
            i += 1
        elif ch == "#":
            end = text.find("\n", i)
            i = len(text) if end < 0 else end
        elif ch in "{};":
            found.append((ch, ch, line))
            i += 1
        elif ch in "\"'":
            end = text.find(ch, i + 1)
            if end < 0:
                raise Unreadable(f"line {line}: a quote that never closes")
            found.append(("word", text[i + 1 : end], line))
            line += text.count("\n", i, end)
            i = end + 1
        else:
            start = i
            while i < len(text) and not text[i].isspace() and (text[i] not in "{;" or text[i - 1 : i + 1] == "${"):
                i += 1
            found.append(("word", text[start:i], line))
    return found


def _parse(tokens: list[tuple[str, str, int]], file: str) -> list[Block]:
    """Each directive as a Block, nested by braces; a directive ended by `;` has no children."""
    stack: list[list] = [[]]
    words: list[tuple[str, int]] = []
    for kind, token, line in tokens:
        if kind in (";", "{") and not words:
            raise Unreadable(f"line {line}: a `{token}` with no directive before it")
        if kind == ";":
            if words[0][0] in NAMED and len(words) == 1:
                raise Unreadable(f"line {line}: `{words[0][0]}` with nothing after it")
            stack[-1].append(Block(words[0][0], tuple(w for w, _ in words[1:]), file, words[0][1], None))
            words = []
        elif kind == "{":
            block = Block(words[0][0], tuple(w for w, _ in words[1:]), file, words[0][1], [])
            stack[-1].append(block)
            stack.append(block.children)
            words = []
        elif kind == "}":
            if len(stack) == 1:
                raise Unreadable(f"line {line}: a `}}` that closes no block")
            stack.pop()
        else:
            words.append((token, line))
    if len(stack) > 1:
        raise Unreadable("a block that never closes")
    return stack[0]


def _text(path: pathlib.Path) -> str:
    # ⚠️ Never a traceback on a byte that is not UTF-8 (buildforge-starter#48).
    return path.read_text(encoding="utf-8", errors="replace")


def _read(path: pathlib.Path, root: pathlib.Path, reading: tuple[pathlib.Path, ...] = ()) -> list[Block]:
    """The directives of `path`, with its includes read in; `reading` is the chain of files that got here."""
    relative = path.relative_to(root).as_posix()
    here = path.resolve()
    if here in reading:
        raise Unreadable(f"an include cycle through {relative}")
    return _included(_parse(_tokens(_text(path)), relative), path.parent, root, (*reading, here))


def _snippets(name: str, folder: pathlib.Path) -> list[pathlib.Path]:
    """The files an `include` names: the longest tail of its path that names a file under `folder`.

    `/etc/nginx/snippets/a.conf` finds `snippets/a.conf`, else `a.conf`. A
    glob takes every file it matches, in name order, as nginx does.
    """
    parts = [part for part in pathlib.PurePosixPath(name).parts if part != "/"]
    for start in range(len(parts)):
        tail = "/".join(parts[start:])
        if any(ch in tail for ch in GLOB):
            found = sorted(path for path in folder.glob(tail) if path.is_file())
        else:
            found = [folder / tail] if (folder / tail).is_file() else []
        if found:
            return found
    return []


def _included(
    directives: list[Block], folder: pathlib.Path, root: pathlib.Path, reading: tuple[pathlib.Path, ...]
) -> list[Block]:
    """`directives` with each `include` of a file in the repo replaced by what that file holds."""
    out: list[Block] = []
    for directive in directives:
        snippets = _snippets(directive.args[0], folder) if directive.name == "include" else []
        if snippets and any(ch in directive.args[0] for ch in GLOB):
            # nginx.conf's `conf.d/*.conf` can match nginx.conf itself in a
            # repo that keeps both in one folder; the image does not.
            snippets = [snippet for snippet in snippets if snippet.resolve() not in reading]
        if directive.children is None and snippets:
            for snippet in snippets:
                out.extend(_read(snippet, root, reading))
        elif directive.children is not None:
            out.append(directive._replace(children=_included(directive.children, folder, root, reading)))
        else:
            out.append(directive)
    return out


def _own(directives: list[Block]) -> tuple[str, ...]:
    """The headers one level sets itself."""
    return tuple(d.args[0] for d in directives if d.children is None and d.name == "add_header")


def _setting(directives: list[Block], inherited: str) -> str:
    """The level's `add_header_inherit`: its own last one, else the one around it."""
    return next(
        (d.args[0] for d in reversed(directives) if d.children is None and d.name == "add_header_inherit"), inherited
    )


def _walk(children: list[Block], inherited: tuple[str, ...], mode: str, found: list[Dropped]) -> None:
    for child in children:
        if child.children is None:
            continue
        own = _own(child.children)
        here = _setting(child.children, mode)
        if here == "merge":
            keeps = inherited + own
        elif here == "off":
            keeps = own
        elif own:
            lost = tuple(h for h in inherited if h.lower() not in {o.lower() for o in own})
            if lost:
                found.append(Dropped(child.file, child.line, " ".join((child.name, *child.args)), lost))
            keeps = own
        else:
            keeps = inherited
        _walk(child.children, keeps, here, found)


def check(path: pathlib.Path, root: pathlib.Path) -> list[Dropped]:
    # ⚠️ The top of the file is a level too: nginx reads a conf.d file inside
    # `http {}`, so a header there is inherited, and dropped, like a
    # server's (review of #78). Nothing is inherited into it.
    tree = _read(path, root)
    found: list[Dropped] = []
    _walk(tree, _own(tree), _setting(tree, "on"), found)
    return found


def _git(root: pathlib.Path, *args: str) -> str | None:
    try:
        done = subprocess.run(["git", *args], cwd=root, capture_output=True, check=False)
    except OSError:  # no git on this machine
        return None
    return done.stdout.decode("utf-8", "surrogateescape") if done.returncode == 0 else None


def _tracked(root: pathlib.Path) -> list[str] | None:
    """Every file git tracks under `root`, or None outside a git work tree."""
    listed = _git(root, "ls-files", "-z")
    return None if listed is None else [name for name in listed.split("\0") if name]


def _is_nginx(path: pathlib.Path) -> bool:
    """Sets a header, or opens a block that can hold one (its headers may all be in snippets).

    ⚠️ One that cannot be opened counts, so its FAIL line names it (review of #78).
    """
    try:
        text = _text(path)
    except OSError:
        return True
    return "add_header" in text or BLOCK.search(text) is not None


def configs(root: pathlib.Path) -> list[pathlib.Path] | None:
    """Every nginx config git tracks under `root`; None outside a git work tree."""
    tracked = _tracked(root)
    if tracked is None:
        return None
    return [root / name for name in tracked if name.endswith(SUFFIXES) and _is_nginx(root / name)]


def findings(root: pathlib.Path) -> list[str]:
    """What is wrong, one sentence each; empty when every block keeps what it inherits."""
    found = []
    for path in configs(root) or []:
        relative = path.relative_to(root).as_posix()
        try:
            dropped = check(path, root)
        except Unreadable as why:
            found.append(f"{relative}: cannot read it as nginx ({why}), so nothing in it was checked.")
            continue
        except OSError as why:
            found.append(f"{relative}: cannot read it ({why.strerror or why}), so nothing in it was checked.")
            continue
        found.extend(
            f"{drop.file}:{drop.line}: `{drop.block}` sets its own add_header, so its answers"
            f" lose these inherited ones: {', '.join(drop.headers)}."
            for drop in dropped
        )
    # A snippet is read on its own and through each file that includes it.
    return list(dict.fromkeys(found))


HOW_TO_FIX = """
nginx inherits add_header from the enclosing level only when a level sets
none of its own. So a block that sets one must repeat every header it would
inherit (or include one snippet that holds them), or say
`add_header_inherit merge;` to keep them (nginx 1.29.3 or later).
  https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header"""


def main() -> int:
    read = configs(ROOT)
    if read is None:
        print("OK: not a git work tree, so no nginx config was read.")
        return 0
    found = findings(ROOT)
    for finding in found:
        print(f"FAIL: {finding}", file=sys.stderr)
    if found:
        print(HOW_TO_FIX, file=sys.stderr)
        return 1
    if not read:
        print("OK: no nginx config is tracked here.")
        return 0
    names = ", ".join(path.relative_to(ROOT).as_posix() for path in read)
    print(f"OK: every block that sets add_header keeps what it would inherit, in {len(read)} nginx config(s): {names}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
