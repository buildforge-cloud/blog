"""Every `var()` in a set of stylesheets names a token they define, or has a fallback.

A `var()` naming a custom property nobody defines makes its whole declaration
invalid, and nothing warns: no console line, no build error.
profile-homepage's product panel asked for `--spacing-7`, a step its spacing
scale skips, and had 0 px of padding from the day it shipped
(profile-homepage#26). This reads the source, so it needs no browser, and it
sees a rule that no page matches today.

Usage:
    python3 css_tokens.py src/*.css src/components/*.css
    python3 css_tokens.py index.html
    python3 css_tokens.py src/styles/*.css src/components/*.astro
    python3 css_tokens.py src/*.css --defined=--font-inter --defined=--font-mono

The rule, over the files of ONE call, read together as one cascade:

* `/* */` comments are dropped, and the text of a string is not CSS.
* `--name:` or `@property --name` defines a token.
* A `var(--name)` with no fallback and no definition is a finding. One with a
  fallback (`var(--name, 1rem)`) still works, so it is not. In
  `var(--a, var(--b))`, `--b` is checked too.
* `--defined=--NAME` is a token set outside CSS (an Astro font variable, a
  framework's theme), by its exact name, never a prefix. ⚠️ Write it with
  `=`: after a space, argparse reads `--NAME` as an option of its own.

A page (`.html`, `.astro`, `.vue`, `.svelte`) is read for its `<style>`
blocks, its `style` attributes and its `class` values only: never its text,
its `<script>` blocks or its front matter (`---` ... `---` at the top). A
class is read as Tailwind reads it: `p-(--gap)` and `text-(length:--gap)` use
`--gap`, as `p-[var(--gap)]` does, and `[--gap:1rem]` defines it. Any other
file is read whole, as CSS. ⚠️ A page with its own `<style>` is its own call:
its tokens are not another page's. ⚠️ An attribute written as an expression
(`style={...}`, `:style`, `class:list`, `style:padding`) is not read.

Prints `OK: <n> files ...` and exits 0, or one `FAIL: <file> <token>` line
per finding and exits 1. A path that is not a readable file is a FAIL line too.

## A child repo: adopt, move

A shared part, pinned like `cf_access`: a release of buildforge-starter, byte
for byte, never edited in place. A child places it once, beside its tests:

    python3 scripts/shared_checks.py update css_tokens 1.1.0 --into tests

and the lock remembers the folder, so moving is `update css_tokens
<version>`. stdlib only. Its tests live in buildforge-starter
(`parts/tests/test_css_tokens.py`); buildforge-starter#94 says where it came
from.

⚠️ A child that runs vulture's dead-code ratchet over this folder lists
`HTMLParser`'s three callbacks here as known: `handle_starttag`,
`handle_data` and `handle_endtag`. The stdlib calls them, so vulture sees no
caller (ps-db#420).
"""

from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path

__version__ = "1.1.0"

# Whichever starts first: an escape (`\'` in a selector is part of a name, as
# in Tailwind's `.\[font\:\'SF_Mono\'\]`), a comment (to its end, or the
# file's), or a string (to its closing quote, or the end of its line, as CSS
# ends a bad string). Minified CSS is one line, so a quote misread here hides
# the rest of the file.
_ESCAPE_COMMENT_OR_STRING = re.compile(
    r"""\\.|/\*.*?(?:\*/|\Z)|"(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?""", re.DOTALL
)
# Not after a word character or `-`: `.card--open:hover` defines nothing.
_DEFINITION = re.compile(r"(?<![\w-])(--[\w-]+)\s*:|@property\s+(--[\w-]+)")
_USE = re.compile(r"var\(\s*(--[\w-]+)\s*(,)?")
# A file with these suffixes is a page: its CSS is in its markup.
_PAGES = {".html", ".astro", ".vue", ".svelte"}
# `---` ... `---` at the top: an Astro component's script, not markup.
_FRONT_MATTER = re.compile(r"\A---\n.*?^---\n", re.DOTALL | re.MULTILINE)
# Tailwind's `p-(--gap)` and `text-(length:--size)`: a `var()` with no `var(`.
_TAILWIND_VAR = re.compile(r"-\((?:[\w-]+:)?(--[\w-]+)\)")


class _PageCss(HTMLParser):
    """A page's `<style>` blocks, `style` attributes and `class` values: its CSS,
    and nothing else. A class is read as CSS, so `[--gap:1rem]` defines `--gap`
    and `p-[var(--gap)]` uses it, as Tailwind reads them."""

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self._in_style = False

    def handle_starttag(self, tag, attrs):
        self.parts += [value for name, value in attrs if name == "style" and value]
        self.parts += [_TAILWIND_VAR.sub(r" var(\1) ", value) for name, value in attrs if name == "class" and value]
        if tag == "style":
            self._in_style = True
            self.parts.append("")

    def handle_endtag(self, tag):
        if tag == "style":
            self._in_style = False

    def handle_data(self, data):
        if self._in_style:
            self.parts[-1] += data


def _page_css(html: str) -> str:
    page = _PageCss()
    page.feed(_FRONT_MATTER.sub("", html, count=1))
    page.close()
    return "\n".join(page.parts)


def _code(css: str) -> str:
    """The CSS with each escape, comment and string dropped."""
    return _ESCAPE_COMMENT_OR_STRING.sub("", css)


def _read(path: Path) -> tuple[str, str | None]:
    """The file's CSS, or why there is none."""
    if not path.is_file():
        return "", "is not a file"
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as error:
        return "", f"cannot be read: {error}"
    return _code(_page_css(text) if path.suffix in _PAGES else text), None


def failures(paths, defined=()) -> list[str]:
    """The FAIL lines for one cascade: `paths` read together, `defined` set
    outside CSS. None: every `var()` names a defined token or has a fallback."""
    read = [(given, *_read(Path(given))) for given in paths]
    names = set(defined)
    for _, css, _ in read:
        names.update(own or registered for own, registered in _DEFINITION.findall(css))
    lines = []
    for given, css, problem in read:
        if problem:
            lines.append(f"FAIL: {given} {problem}")
        lines += [f"FAIL: {given} {name}" for name, fallback in _USE.findall(css) if not fallback and name not in names]
    return lines


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("paths", nargs="+", metavar="PATH", help="a stylesheet or a page; all of them are one cascade")
    parser.add_argument(
        "--defined", action="append", default=[], metavar="--NAME", help="a token set outside CSS: --defined=--font-inter"
    )
    args = parser.parse_args(argv)
    lines = failures(args.paths, args.defined)
    if lines:
        print("\n".join(lines))
        return 1
    count = len(args.paths)
    print(f"OK: {count} file{'' if count == 1 else 's'}, every var() names a token they define or has a fallback")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
