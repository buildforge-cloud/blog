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
names. A repo with no lock yet adopts with these commands:

    gh api -H "Accept: application/vnd.github.raw" \\
      "repos/buildforge-cloud/buildforge-starter/contents/scripts/shared_checks.py?ref=shared_checks-v1.7.0" \\
      > scripts/shared_checks.py
    python3 scripts/shared_checks.py update shared_checks 1.7.0 \\
      --source https://github.com/buildforge-cloud/buildforge-starter.git
    python3 scripts/shared_checks.py update check_secrets 1.2.0
    python3 scripts/shared_checks.py update secrets 1.2.0
    python3 scripts/shared_checks.py update pre-commit 1.0.1
    git config core.hooksPath .githooks

`secrets` is `.github/workflows/secrets.yml`, which runs the scanner and this
file on every push; `pre-commit` is `.githooks/pre-commit`, which runs the
scanner on each commit of a clone that ran the last line. ⚠️ **Since 1.6.0
both are pinned releases too** (buildforge-starter#166): each repo used to
copy them by hand, and a fix reached it only by one more copy. A file that
cannot hold a Python line declares its version as a comment line,
`# __version__ = "x.y.z"`. `update` gives a file its release's executable
bit, and the pin fails a hook that lost it, which git would skip. A repo that
held a copy takes the release over it, in one PR.

⚠️ The shared jobs' `runs-on` line, which `secrets.yml` now brings and
`docs-checks.yml`'s `docs` job copies by hand:
it puts the job on the home machine in a private repo, where GitHub starts no hosted
job (billing, 2026-10-13), and on GitHub's runner in a public repo and for a
fork's pull request (since 1.2.0, buildforge-starter#123), and for any run
of a Dependabot branch, whose package bump nobody reviewed (since 1.3.0,
buildforge-starter#129). Since 1.4.0 it matches `dependabot/`, Dependabot's
own prefix, so a person's `dependabot-...` branch keeps its checks, and this
file refuses a `.github/dependabot.yml` that sets `pull-request-branch-name`,
which would rename Dependabot's branch past it (buildforge-starter#134).
Since 1.5.0 the line puts a private repo's run on `home-light`, not `home`:
one runner on the same home machine for these jobs of seconds, which waited
10-20 minutes there behind long test jobs (buildforge-starter#153). Copy the
line again into the `docs` job. A repo made from
buildforge-starter also holds the tests that pin the line: apply
buildforge-starter#153's change to `tests/_runner_switch.py` (its new `LIGHT_SWITCH`) and to the tests
that read it, `tests/test_workflow_ceilings.py`, `tests/test_secrets.py`,
`tests/test_claude_rules.py` and a web project's
`backend/tests/test_deploy_workflows.py`, or its `docs` job fails.
Moving to a new release is one command, committed as one PR:

    python3 scripts/shared_checks.py update check_secrets 1.2.0

⚠️ **`update shared_checks` is run by the OLD copy**, which writes the pin
as the old release knew it (buildforge-starter#172): 1.5.0 knew no
`executable`. Since 1.7.0 a copy that replaced itself hands the same command
to the new copy, which writes its own pin. A copy before 1.7.0 cannot, so
after moving from one, run the same `update` once more. And this file
refuses an executable file whose pin does not say so, naming the `update`
that fixes it.

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
   `git tag check_secrets-v<version> <merge sha> && git push origin check_secrets-v<version>`

A new shared check joins the same way: give it a `__version__` (a comment
line in a file that is not Python), release it.
The tag's own lock says where each check lives, so `update` finds a check
the repo has never held, makes its folder, and -- when a release moved a
check -- drops the old pin and names it, so the PR can fix its callers.

Stdlib and git only, like everything a hook or `init.py` imports.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile

__version__ = "1.7.0"

ROOT = pathlib.Path(__file__).resolve().parent.parent
LOCK = ROOT / "scripts" / "shared-checks.lock"
VERSION = re.compile(rb'^__version__ = "([^"]+)"$', re.MULTILINE)
# A workflow (YAML) or a hook (shell) cannot hold that line as a statement, so
# it says it as a comment line of its own. A Python file's own line wins.
COMMENTED_VERSION = re.compile(rb'^# __version__ = "([^"]+)"$', re.MULTILINE)


def git(*args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(["git", *args], capture_output=True, check=False)


def declared_version(data: bytes) -> str | None:
    found = VERSION.search(data) or COMMENTED_VERSION.search(data)
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
    worst edit there is. ⚠️ So is a pin marked `executable` whose file is not:
    git skips such a hook, and every commit passes (buildforge-starter#166).
    """
    wrong = []
    for relative, pin in sorted(lock["files"].items()):
        try:
            data = (ROOT / relative).read_bytes()
            runnable = bool((ROOT / relative).stat().st_mode & 0o100)
        except OSError:
            data, runnable = None, False
        if data is None or hashlib.sha256(data).hexdigest() != pin["sha256"] or (
            declared_version(data) != pin["version"]
        ) or (pin.get("executable") and not runnable):
            wrong.append(relative)
    return wrong


def unflagged(lock: dict) -> list[str]:
    """The pinned files that are executable while their pin does not say so.

    ⚠️ **An older copy of this file wrote the pin, and left the field out**
    (buildforge-starter#172): 1.5.0 knew no `executable`, so its `update`
    pinned an executable check without it, and the pin then guarded nothing.
    `update` gives a file its release's mode, so such a file is either a pin
    an older copy wrote or a mode nobody released, and taking the release
    again fixes both.
    """
    return [
        relative for relative, pin in sorted(lock["files"].items())
        if not pin.get("executable") and (ROOT / relative).is_file() and (ROOT / relative).stat().st_mode & 0o100
    ]


def summary(lock: dict) -> str:
    return ", ".join(
        f"{pathlib.PurePath(relative).stem} {pin['version']}"
        for relative, pin in sorted(lock["files"].items())
    )


# ⚠️ The shared jobs' `runs-on` (see the adopt note) keeps a run off the home machine by
# `dependabot/`, Dependabot's own branch prefix. `pull-request-branch-name`
# renames that branch (`separator`, `prefix`, `template`), and the run would
# install a bump nobody reviewed there (buildforge-starter#134).
DEPENDABOT_CONFIGS = (".github/dependabot.yml", ".github/dependabot.yaml")
BRANCH_NAME_OPTION = "pull-request-branch-name"


def renamed_dependabot_branch() -> list[str]:
    """Where the dependabot.yml GitHub reads sets `pull-request-branch-name`,
    as `path:line`, or `path: cannot read it`. Any setting, the default
    spelled out too, and a line only a full-line comment is skipped. Text, not
    YAML, since this file is stdlib only; a file not UTF-8 is a finding."""
    found = []
    for relative in DEPENDABOT_CONFIGS:
        try:
            text = (ROOT / relative).read_bytes().decode("utf-8")
        except FileNotFoundError:
            continue
        except (OSError, UnicodeDecodeError):
            found.append(f"{relative}: cannot read it")
            continue
        if "\0" in text:
            found.append(f"{relative}: cannot read it")
            continue
        found.extend(
            f"{relative}:{number}"
            for number, line in enumerate(text.splitlines(), 1)
            if BRANCH_NAME_OPTION in line and not line.lstrip().startswith("#")
        )
    return found


def verify() -> int:
    lock = load_lock()
    renamed = renamed_dependabot_branch()
    for where in renamed:
        print(f"REFUSING: {where} sets {BRANCH_NAME_OPTION}.", file=sys.stderr)
    if renamed:
        print(
            "\nIt renames Dependabot's branch, which the shared jobs' runs-on knows by\n"
            "`dependabot/` and keeps off the home machine. Remove the option (buildforge-starter#134).\n",
            file=sys.stderr,
        )
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
    loose = unflagged(lock)
    for relative in loose:
        print(
            f"REFUSING: {relative} is executable, and its pin does not say so. Take its release again:\n"
            f"  python3 scripts/shared_checks.py update {pathlib.PurePath(relative).stem}"
            f" {lock['files'][relative]['version']}",
            file=sys.stderr,
        )
    if renamed or loose:
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
        print(
            f'REFUSING: {relative} declares no `__version__ = "x.y.z"` line'
            ' (`# __version__ = "x.y.z"` in a file that is not Python).',
            file=sys.stderr,
        )
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
    if (ROOT / relative).stat().st_mode & 0o100:
        lock["files"][relative]["executable"] = True
    save_lock(lock)
    print(f"Pinned {relative} {version}. After the merge, tag the merge commit:")
    print(f"  git tag {tag} <merge sha> && git push origin {tag}")
    return 0


def fetch(source: str, tag: str, name: str) -> tuple[str, bytes, bool] | None:
    """(path, bytes, executable) of the check `name` in the release `tag`, or
    None, having said why.

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
        entry = run("ls-tree", f"refs/tags/{tag}", "--", relative)
        return None if data is None or entry is None else (relative, data, entry.startswith(b"100755 "))


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
    relative, data, executable = fetched
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
    replaced_itself = (ROOT / relative).resolve() == pathlib.Path(__file__).resolve() and (
        pathlib.Path(__file__).read_bytes() != data
    )
    (ROOT / relative).write_bytes(data)
    # ⚠️ The release's mode, both ways: a new file gets the umask's, and git
    # skips a hook that is not executable, with only a hint (buildforge-starter#166).
    mode = (ROOT / relative).stat().st_mode
    (ROOT / relative).chmod(mode | 0o111 if executable else mode & ~0o111)
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
    if executable:
        lock["files"][relative]["executable"] = True
    save_lock(lock)
    print(f"Pinned {relative} {version} from {source}. Commit both files as one PR.")
    if replaced_itself:
        # ⚠️ **This copy is the OLD one**, so it wrote the pin as the old
        # release knew it: a field the new one adds was left out
        # (buildforge-starter#172). The new copy takes the same release again
        # and writes its own pin. Its bytes are the release, so it does not
        # hand over again. The source and a placed folder are in the lock
        # just saved. Flushed first: exec drops what is buffered.
        print(f"Handing over to {relative} {version}, to write its pin as it knows it.", flush=True)
        os.execv(sys.executable, [sys.executable, str(ROOT / relative), "update", name, version])
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
