#!/usr/bin/env python3
"""Pin the checks every project shares to a release of buildforge-starter.

    python3 scripts/shared_checks.py                                  # verify (CI: secrets.yml)
    python3 scripts/shared_checks.py update check_secrets 1.1.0       # a project moves its pin
    python3 scripts/shared_checks.py release scripts/check_secrets.py # the starter pins an edit

Exit 0: every file in `scripts/shared-checks.lock` is byte for byte the
release its pin names. 1: one is not, or a command refused and changed nothing.

## Why this exists

⚠️ **A project used to get a COPY of each shared check, and the copy then
lived alone.** A fix reached it only by one hand-filed issue per repo --
buildforge-starter#48 became three issues, three workers and three reviews --
and by then the scanner was three versions in three repos, with two more
repos holding a different scanner altogether. Now a shared check lives ONCE,
here, with a `__version__`; a project pins a release and holds exactly those
bytes; moving is one command and one PR; a hand edit is a red CI check
(buildforge-starter#50).

⚠️ **Still a file in every repo, on purpose.** The pre-commit hook must run
offline, in well under a second, on python3 alone, so the scanner has to be
on disk. Every way to share it without a copy was tried live on 2026-09-28,
and each one reaches CI only: a private repo's reusable workflow is refused
to the other repos (the Actions "Access" setting is `none`); a public repo's
works, but the hook still needs the file; and `pip install` from a git tag
fails with no token and with CI's own, which reads only its own repo. 📖
docs/ENGINEERING_LOG.md, buildforge-starter#50.

## A project: adopt, move

A project made by `scripts/init.py` already holds the lock and the release it
names. A repo with no lock yet adopts with three commands:

    gh api -H "Accept: application/vnd.github.raw" \\
      "repos/buildforge-cloud/buildforge-starter/contents/scripts/shared_checks.py?ref=shared_checks-v1.0.0" \\
      > scripts/shared_checks.py
    python3 scripts/shared_checks.py update shared_checks 1.0.0 \\
      --source https://github.com/buildforge-cloud/buildforge-starter.git
    python3 scripts/shared_checks.py update check_secrets 1.0.0

then runs `python3 scripts/check_secrets.py --staged` from its pre-commit hook
and this file from CI, as buildforge-starter's `.githooks/pre-commit` and
`.github/workflows/secrets.yml` do. Moving to a new release is one command,
committed as one PR:

    python3 scripts/shared_checks.py update check_secrets 1.1.0

⚠️ **A runtime part goes where the app is built from, so the repo names the
folder**: `update cf_access 1.0.0 --into backend/app` (`api/app` in
cycle-monitor). The lock marks the pin `placed`, and every later `update`
keeps that folder; without `--into`, a part lands at the release's own path
(`parts/cf_access.py`), where no image would hold it. Since 1.1.0
(buildforge-starter#68); `parts/cf_access.py` says the rest.

## buildforge-starter: release

1. Change the check and bump its `__version__`.
2. `python3 scripts/shared_checks.py release scripts/check_secrets.py` --
   pins the new bytes in the lock. Refused anywhere but this repo, and
   refused if that version is already tagged: a release never changes.
3. Merge, then tag the merge commit, which is what `update` fetches:
   `git tag check_secrets-v1.1.0 <merge sha> && git push origin check_secrets-v1.1.0`

A new shared check joins the same way: give it a `__version__`, release it.
The tag's own lock says where each check lives, so `update` finds a check
the repo has never held, makes its folder, and -- when a release moved a
check -- drops the old pin and names it, so the PR can fix its callers.

Stdlib and git only, like everything a hook or `init.py` imports.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import re
import subprocess
import sys
import tempfile

__version__ = "1.1.0"

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCK = ROOT / "scripts" / "shared-checks.lock"
VERSION = re.compile(rb'^__version__ = "([^"]+)"$', re.MULTILINE)


def git(*args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(["git", *args], capture_output=True, check=False)


def declared_version(data: bytes) -> str | None:
    found = VERSION.search(data)
    return found.group(1).decode() if found else None


def load_lock() -> dict:
    return json.loads(LOCK.read_text(encoding="utf-8"))


def save_lock(lock: dict) -> None:
    LOCK.write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def find(lock: dict, name: str) -> str | None:
    return next((r for r in lock["files"] if pathlib.PurePath(r).stem == name), None)


def mismatched(lock: dict) -> list[str]:
    """The pinned files that are not the release their pin names.

    ⚠️ **The version is compared too, not only the hash.** Right bytes under a
    wrong version would make every report repeat the lie, and `update` would
    reason from it. ⚠️ A MISSING file is a mismatch: no scanner at all is the
    worst edit there is.
    """
    wrong = []
    for relative, pin in sorted(lock["files"].items()):
        try:
            data = (ROOT / relative).read_bytes()
        except OSError:
            data = None
        if data is None or hashlib.sha256(data).hexdigest() != pin["sha256"] or (
            declared_version(data) != pin["version"]
        ):
            wrong.append(relative)
    return wrong


def summary(lock: dict) -> str:
    return ", ".join(
        f"{pathlib.PurePath(relative).stem} {pin['version']}"
        for relative, pin in sorted(lock["files"].items())
    )


def verify() -> int:
    lock = load_lock()
    wrong = mismatched(lock)
    if wrong:
        for relative in wrong:
            print(f"REFUSING: {relative} is not the release its pin names.", file=sys.stderr)
        print(
            "\nA shared check is changed in buildforge-starter and released, never here.\n"
            "  Put the release back:  python3 scripts/shared_checks.py update <name> <version>\n"
            "  In buildforge-starter: bump __version__, then shared_checks.py release <path>",
            file=sys.stderr,
        )
        return 1
    print(f"OK: {summary(lock)}")
    return 0


def release(path: str) -> int:
    lock = load_lock()
    # ⚠️ **One key per file, whatever the spelling.** `./scripts/x.py` or an
    # absolute path became a SECOND lock entry beside `scripts/x.py`, whose
    # old hash CI then failed on every push (review of buildforge-starter#54).
    try:
        relative = (ROOT / path).resolve().relative_to(ROOT).as_posix()
    except ValueError:
        print(f"REFUSING: {path} is outside this repo.", file=sys.stderr)
        return 1
    # ⚠️ **Only the source releases.** In a project, `release` would re-pin a
    # hand edit -- the one thing the pin exists to catch. An exact compare: an
    # SSH clone of the starter is refused too, and the message names both.
    origin = git("-C", str(ROOT), "config", "--get", "remote.origin.url").stdout.decode().strip()
    if origin != lock["source"]:
        print(
            f"REFUSING: only {lock['source']} releases; this is {origin or 'a repo with no origin'}.",
            file=sys.stderr,
        )
        return 1
    try:
        data = (ROOT / relative).read_bytes()
    except OSError:
        print(f"REFUSING: there is no {relative} to release.", file=sys.stderr)
        return 1
    version = declared_version(data)
    if version is None:
        print(f'REFUSING: {relative} declares no `__version__ = "x.y.z"` line.', file=sys.stderr)
        return 1
    # ⚠️ **The TAG is the release, not the version number.** Until it exists
    # the same number may be re-pinned -- a review fix would otherwise cost a
    # version per round -- and after it never, because a project that pinned
    # it trusts those bytes forever. Could not ask is not "not tagged".
    tag = f"{pathlib.PurePath(relative).stem}-v{version}"
    tagged = git("ls-remote", "--tags", lock["source"], f"refs/tags/{tag}")
    if tagged.returncode != 0:
        print(f"REFUSING: could not ask {lock['source']} whether {tag} is released.", file=sys.stderr)
        return 1
    if tagged.stdout.strip():
        print(f"REFUSING: {tag} is released, and a release never changes.", file=sys.stderr)
        return 1
    lock["files"][relative] = {"version": version, "sha256": hashlib.sha256(data).hexdigest()}
    save_lock(lock)
    print(f"Pinned {relative} {version}. After the merge, tag the merge commit:")
    print(f"  git tag {tag} <merge sha> && git push origin {tag}")
    return 0


def fetch(source: str, tag: str, name: str) -> tuple[str, bytes] | None:
    """(path, bytes) of the check `name` in the release `tag`, or None, having said why.

    ⚠️ **A throwaway bare repo, fetched by git** -- so it works with whatever
    credential git already has (gh's helper here, a token in CI) and with a
    local path in the tests, and it pulls one commit, not the starter's
    history into the project's. The path comes from the release's OWN lock,
    so a check this repo has never held is found too.
    """
    with tempfile.TemporaryDirectory() as scratch:

        def run(*args: str) -> bytes | None:
            done = git("-C", scratch, *args)
            if done.returncode != 0:
                print(f"REFUSING: could not read {tag} from {source}:", file=sys.stderr)
                print("  " + done.stderr.decode("utf-8", "replace").strip(), file=sys.stderr)
                return None
            return done.stdout

        if run("init", "-q", "--bare") is None or run(
            "fetch", "-q", "--depth", "1", source, f"refs/tags/{tag}:refs/tags/{tag}"
        ) is None:
            return None
        manifest = run("show", f"refs/tags/{tag}:{LOCK.relative_to(ROOT).as_posix()}")
        if manifest is None:
            return None
        relative = find(json.loads(manifest), name)
        if relative is None:
            print(f"REFUSING: {tag} pins no check named {name!r}.", file=sys.stderr)
            return None
        data = run("show", f"refs/tags/{tag}:{relative}")
        return None if data is None else (relative, data)


def update(name: str, version: str, source: str | None, into: str | None = None) -> int:
    lock = load_lock() if LOCK.exists() else {"files": {}}
    source = source or lock.get("source")
    if not source:
        print("REFUSING: this repo pins nothing yet, so name the source: --source <git URL>", file=sys.stderr)
        return 1
    if into is not None:
        try:
            into = (ROOT / into).resolve().relative_to(ROOT).as_posix()
        except ValueError:
            print(f"REFUSING: {into} is outside this repo.", file=sys.stderr)
            return 1
    tag = f"{name}-v{version}"
    fetched = fetch(source, tag, name)
    if fetched is None:
        return 1
    relative, data = fetched
    # A tag on the wrong commit would pin a lie.
    declared = declared_version(data)
    if declared != version:
        print(f"REFUSING: {relative} at {tag} declares version {declared}, not {version}.", file=sys.stderr)
        return 1
    # ⚠️ **A runtime part lives where the repo's app is built from**, which
    # only the repo knows, so `--into` places it and the pin remembers: a
    # later update that followed the release's path instead would leave the
    # app running an old file nothing pins (buildforge-starter#68).
    placed = next(
        (old for old, pin in lock["files"].items() if pin.get("placed") and pathlib.PurePath(old).stem == name), None
    )
    if into is not None:
        relative = (pathlib.PurePosixPath(into) / pathlib.PurePath(relative).name).as_posix()
    elif placed is not None:
        relative = placed
    # A check released in a folder this repo lacks crashed here (review of
    # buildforge-starter#54).
    (ROOT / relative).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / relative).write_bytes(data)
    lock["source"] = source
    # ⚠️ **A release that MOVED the check leaves its old pin behind** unless it
    # is dropped here -- and whatever still calls the old path, the hook
    # included, runs a file nothing pins. Named, so the PR fixes the callers.
    moved = [old for old in lock["files"] if old != relative and pathlib.PurePath(old).stem == name]
    for old in moved:
        del lock["files"][old]
        print(f"No longer pinned: {old} (it is {relative} now). Point its callers there.")
    lock["files"][relative] = {"version": version, "sha256": hashlib.sha256(data).hexdigest()}
    if into is not None or placed is not None:
        lock["files"][relative]["placed"] = True
    save_lock(lock)
    print(f"Pinned {relative} {version} from {source}. Commit both files as one PR.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = parser.add_subparsers(dest="command")
    released = sub.add_parser("release", help="buildforge-starter only: pin an edited check at its new __version__")
    released.add_argument("path", help="the check's path, e.g. scripts/check_secrets.py")
    updated = sub.add_parser("update", help="take a tagged release of a check: its file and its pin")
    updated.add_argument("name", help="the check's name, e.g. check_secrets")
    updated.add_argument("version", help="the release, e.g. 1.1.0 (the tag is <name>-v<version>)")
    updated.add_argument("--source", help="git URL of buildforge-starter; only for a repo with no lock yet")
    updated.add_argument(
        "--into", help="a folder of this repo to hold it, e.g. backend/app for a runtime part; the lock remembers it"
    )
    args = parser.parse_args()
    if args.command == "release":
        return release(args.path)
    if args.command == "update":
        return update(args.name, args.version, args.source, args.into)
    return verify()


if __name__ == "__main__":
    raise SystemExit(main())
