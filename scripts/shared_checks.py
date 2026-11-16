#!/usr/bin/env python3
"""Pin the checks every project shares to a release of buildforge-starter.

    python3 scripts/shared_checks.py                                  # verify (CI: secrets.yml)
    python3 scripts/shared_checks.py update check_secrets 1.1.0       # a project moves its pin
    python3 scripts/shared_checks.py release scripts/check_secrets.py # the starter pins an edit

Exit 0: every file in `scripts/shared-checks.lock` is byte for byte the
release its pin names, and every workflow job whose tests need gitleaks
fetches it first (since 1.8.0). 1: one is not, or a command refused and
changed nothing.

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
      "repos/buildforge-cloud/buildforge-starter/contents/scripts/shared_checks.py?ref=shared_checks-v1.13.3" \\
      > scripts/shared_checks.py
    python3 scripts/shared_checks.py update shared_checks 1.13.3 \\
      --source https://github.com/buildforge-cloud/buildforge-starter.git
    python3 scripts/shared_checks.py update shell_reader 1.0.0
    python3 scripts/shared_checks.py update fetch_first 1.10.1
    python3 scripts/shared_checks.py update gitleaks_pin 1.3.1
    python3 scripts/shared_checks.py update gitleaks_run 1.0.0
    python3 scripts/shared_checks.py update secret_rules 1.10.0
    python3 scripts/shared_checks.py update check_secrets 2.5.1
    python3 scripts/shared_checks.py update secrets 2.0.1
    python3 scripts/shared_checks.py update pre-commit 1.0.1
    python3 scripts/check_secrets.py --fetch
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

⚠️ **Since check_secrets 2.0.0 the scanner runs gitleaks** (buildforge-starter#307):
`secret_rules` is `scripts/secret_rules.toml`, the rules it hands gitleaks,
a release of its own; `--fetch` caches the pinned gitleaks once per machine
(the hook never fetches, and refuses until it is there); `secrets` 2.0.0
fetches it in CI. A repo moving from 1.x takes all three, in one PR.
Since check_secrets 2.2.0, which gitleaks and its fetch are `gitleaks_pin`,
`scripts/secretslib/gitleaks_pin.py`, a release of its own: a repo takes it
with the scanner, which refuses without it (buildforge-starter#322);
check_secrets 2.3.0 needs gitleaks_pin 1.1.0 (buildforge-starter#331),
and check_secrets 2.4.0 and later need 1.2.0 (buildforge-starter#336).
Since check_secrets 2.5.0 the run of gitleaks on each text is a second
part, `gitleaks_run`, `scripts/secretslib/gitleaks_run.py`, moved out of
the scanner whole: a repo takes both, and 2.5.0 needs it
(buildforge-starter#403).

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
Moving to a new release is one command for each part that moved, all
committed as one PR; the starter's README names every part a scanner
release brings (since 1.7.3, buildforge-starter#309):

    python3 scripts/shared_checks.py update check_secrets 2.5.1

⚠️ **Since 1.8.0 a job whose tests need gitleaks runs the fetch before
them** (buildforge-starter#320, from profile-homepage#72): with check_secrets
2.0.0 or later pinned, this file refuses a job in `.github/workflows/` whose
suite reaches a test naming `.githooks` or `check_secrets` with no `python3
scripts/check_secrets.py --fetch` before it in the job that nothing can skip.
Moving to 1.8.0 can turn the repo's `secrets.yml` red until such a job gets
the step: the refusal names the workflow, the job, the command and the tests.
Since 1.9.0 that check is `fetch_first`, `scripts/secretslib/fetch_first.py`,
a release of its own whose docstring says what a suite reaches. This file
loads it only where the scanner runs gitleaks, runs only the release the
lock pins, and there refuses without it (buildforge-starter#343). Since
fetch_first 1.1.0 a fetch counts only where the shell stops at its
failure and its `if:` is as wide as the tests' step's, and a test that
needs no gitleaks says so on a comment line (buildforge-starter#339); since
fetch_first 1.3.0 in its header, and an `if:` is read in each state of the
run, `!failure()` too (buildforge-starter#362); since fetch_first 1.4.0
a `set -e` only where it surely runs, a `trap` on EXIT or ERR, a step that
moves `HOME` or `XDG_CACHE_HOME`, and `|| exit 1` (buildforge-starter#361);
since fetch_first 1.5.0 a cleanup `trap`, `|| { ...; exit 1; }`, git's
abbreviated options, a docstring above the header's marker, and what a
step writes to `$GITHUB_ENV` (buildforge-starter#374); since fetch_first
1.6.0 a CRLF header in linear time, a run's states in the order it passes
them, and a `$GITHUB_ENV` move mended only by a fetch sure to run (the same issue,
from the review of recall#231); since fetch_first 1.7.0 a rescue group's
bare `exit` only as its first command, and its `exec`, `return`, `.`,
`source` or a step's function, `BASH_ENV` only where it is set, and
python's `-bW` and coverage's `--module` (buildforge-starter#383, from the
review of luna-ios#73); since fetch_first 1.8.0 `builtin eval`, `trap` and
`set`, an `exit` the step defines or `enable -n` turns off, `BASH_ENV` on a
`shell:` line, an ERR trap that sets `+e`, `HOME=` for `printenv`, and no
exit from a group's subshell (buildforge-starter#385, from the reviews of
agent-os#506 and vedlikeholdsloggen#312); since fetch_first 1.9.0 python's
`-XW`, `BASH_FUNC_` on a `shell:` line, and a `BASH_ENV` or `BASH_FUNC_` an
earlier step names, writes by any line to `$GITHUB_ENV`, or an action outside
a few of GitHub's may write (buildforge-starter#388,
from the review of luna-ios#81). Since 1.10.0 this
file runs the very bytes of the part it hashed, registered as an import
would be, refuses it once with one fix, and never places it in another
folder: `--into` is refused, and a placed pin goes back to its path
(buildforge-starter#347). Since 1.11.0 that holds for every part another
pinned file loads by its path: the scanner, its rules, this file, the
hook, the pinned workflows and their parts (buildforge-starter#374), and
since 1.11.3 `runner_tools`, which a target's workflows run
(buildforge-starter#385). Since 1.12.0 the fetch check is two parts, the
second `shell_reader`, `scripts/secretslib/shell_reader.py`, which reads a
step's script as bash would: moved out of fetch_first 1.10.0 whole, with no
change to what is refused. This file hashes and runs each as it did the one,
the reader first, and refuses in one run each part that is missing or not its
release; a repo takes the three together (buildforge-starter#372).

⚠️ **Since 1.13.0 a pinned file names the parts it needs**, on a line of its
own, `__needs__ = "gitleaks_pin 1.2.0, secret_rules 1.9.0"`: each with the
oldest release that serves it. This file refuses a lock that pins such a part
older, or not at all, and names the `update` (buildforge-starter#352): 1.12.1
said OK to a repo that took check_secrets 2.4.0 without gitleaks_pin, and to
one that dropped the part from its lock and edited it. A need marked `if
pinned` binds only a repo whose lock pins the part. The needs are read only
between releases: a file that is not its release is refused as that, once.
`update` names each need its new lock leaves unmet, and still exits 0.
Since then a project `init.py` made pins `status`, `test_init_script` and
`test_secrets` too, which move with the scanner; other repos hold none.
Since 1.13.2 also the `initlib` helpers `status` imports, which take no
`--into`, and a pin with no version is no release (buildforge-starter#415, #416).

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
line in a file that is not Python), release it. A release that needs a newer
release of another part, or a part it did not need, says so on its
`__needs__` line, below its `__version__` (a Python file only, for now).
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
import types

__version__ = "1.13.3"

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


def held(relative: str) -> tuple[bytes | None, bool]:
    """(its bytes, whether it is executable), or (None, False) when it cannot be read."""
    try:
        return (ROOT / relative).read_bytes(), bool((ROOT / relative).stat().st_mode & 0o100)
    except OSError:
        return None, False


def is_release(data: bytes | None, runnable: bool, pin: dict) -> bool:
    """Whether these bytes, of this mode, are the release `pin` names.

    ⚠️ **The version is compared too, not only the hash.** Right bytes under a
    wrong version would make every report repeat the lie, and `update` would
    reason from it. ⚠️ A MISSING file is a mismatch: no scanner at all is the
    worst edit there is. ⚠️ So is a pin marked `executable` whose file is not:
    git skips such a hook, and every commit passes (buildforge-starter#166).
    ⚠️ **And one with no version**: `release` pins none, and 1.13.1 took a
    file that declares none, pinned with none, for the release, then failed
    with a KeyError where it named the version (buildforge-starter#416).
    """
    version = declared_version(data) if data is not None else None
    return version is not None and hashlib.sha256(data).hexdigest() == pin.get("sha256") and (
        version == pin.get("version")) and (runnable or not pin.get("executable"))


def mismatched(lock: dict) -> list[str]:
    """The pinned files that are not the release their pin names."""
    return [relative for relative, pin in sorted(lock["files"].items()) if not is_release(*held(relative), pin)]


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


# ⚠️ **A part the lock does not pin is a part nothing checks**
# (buildforge-starter#352): luna-ios#22 took check_secrets 2.4.0 without the
# gitleaks_pin it needs, and agent-os#502 dropped that part from its lock and
# edited it, and both times this file said OK. So a pinned file names what it
# needs on a line of its own, as it names its version.
NEEDS = re.compile(rb'^__needs__ = "([^"]*)"$', re.MULTILINE)
RELEASE = re.compile(r"\d+\.\d+\.\d+")
NEED = re.compile(rf"([\w.-]+) ({RELEASE.pattern})( if pinned)?")


def declared_needs(data: bytes) -> list[tuple[str, str, bool]] | None:
    """[(a part, the oldest release of it that serves, whether only where the
    lock pins it)] the file declares: [] for none, None when its line cannot
    be read, which is never "none"."""
    found = NEEDS.search(data)
    if found is None:
        return []
    try:
        needs = [NEED.fullmatch(each.strip()) for each in found.group(1).decode("utf-8").split(",")]
    except UnicodeDecodeError:
        return None
    return [(need[1], need[2], bool(need[3])) for need in needs] if all(needs) else None


def unmet_needs(lock: dict) -> list[str]:
    """The refusal of each need of a pinned release that the lock does not meet.

    ⚠️ **Read only between releases** (buildforge-starter#352): a pin's
    version is evidence only while its file is the release it names. A file
    that is not, needer or needed, is refused as that by `mismatched()`, once;
    read as a need, a lock that said 0.0.1 for the scanner's 2.4.2 bytes was
    told to take 2.2.0, a downgrade."""
    unmet = []
    for relative, pin in sorted(lock["files"].items()):
        data, runnable = held(relative)
        if not is_release(data, runnable, pin):
            continue
        needer, needs = f"{pathlib.PurePath(relative).stem} {pin.get('version')}", declared_needs(data)
        if needs is None:
            unmet.append(f"{needer} declares needs this cannot read, so none was checked.\n  It is the release its"
                         " pin names, so taking it again mends nothing: report it to buildforge-starter.")
            continue
        for part, oldest, if_pinned in needs:
            pinned = find(lock, part)
            if pinned is not None and not is_release(*held(pinned), lock["files"][pinned]):
                continue
            have = None if pinned is None else lock["files"][pinned].get("version")
            need = f"{needer} needs {part} {oldest} or later{' where the lock pins it' if if_pinned else ''}"
            take = f"  Take it:  python3 scripts/shared_checks.py update {part} {oldest}"
            if pinned is None:
                if not if_pinned:
                    unmet.append(f"{need}, and the lock pins none.\n{take}")
            elif not (isinstance(have, str) and RELEASE.fullmatch(have)):
                unmet.append(f"{need}, and the lock pins it as {have!r}, which is not a release this can compare.\n"
                             f"{take}")
            elif _release(have) < _release(oldest):
                unmet.append(f"{need}, and the lock pins {have}.\n{take}")
    return unmet


def _release(version: str) -> tuple[int, ...]:
    """A release as numbers, so 1.10.0 is later than 1.2.0."""
    return tuple(int(number) for number in version.split("."))


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


# ⚠️ **Since 1.9.0 the fetch check is a release of its own**, `fetch_first`
# (buildforge-starter#343): moved out whole, so this file stays short.
# ⚠️ **Since 1.12.0 it is two** (buildforge-starter#372): `shell_reader`, how
# bash reads a step's script, moved out of `fetch_first` whole for its size.
# Each is loaded as the one part was, the reader first: `fetch_first` takes it
# from `sys.modules` under its name, never from the import path.
PART = "scripts/secretslib/fetch_first.py"
SHELL_PART = "scripts/secretslib/shell_reader.py"
# ⚠️ **What fails here is the release itself, so taking it again mends
# nothing** (buildforge-starter#347, from the review of ps-db#746): 1.9.3 said
# "Take its release" to a repo that held it.
RELEASE_FAILS = ("It is the release its pin names, so taking it again mends nothing: take shared_checks,\n"
                 "  fetch_first and shell_reader as the set the starter's README names, or report this to\n"
                 "  buildforge-starter.")
# Their own names, with no dot: a dotted one would need its parent registered
# too, as the scanner does for its part (buildforge-starter#336).
MODULE = "_shared_checks_fetch_first"
SHELL_MODULE = "_shared_checks_shell_reader"
# In the order they load: each part, its module, what a refusal says it does,
# and what this file takes from it, with the type it must be (None: any).
PARTS = ((SHELL_PART, SHELL_MODULE, "which reads each step's script for the fetch check", {}),
         (PART, MODULE, "which holds each job to a fetch before tests that need gitleaks",
          {"unfetched_suites": None, "FETCH_COMMAND": str}))
# ⚠️ **A part here is loaded at its release path by the check that runs it**:
# the pin tool loads fetch_first and shell_reader, the scanner gitleaks_pin and gitleaks_run. So `update` never
# places one with `--into` (buildforge-starter#347): 1.9.3 pinned fetch_first
# in the folder named, and then called it missing, and kept the folder.
# ⚠️ **So is every part another pinned file loads by its path**
# (buildforge-starter#374, from the review of iso-pathfinder-buddy#48): the
# scanner its rules, the hook and `secrets.yml` the scanner and this file, git
# the hook, GitHub a workflow, `security-scan.yml` its part, the tests the
# runner switch. 1.10.3 placed the scanner and its rules wherever it was told.
# And a target's workflows, a project's own once `init.py` copies them, run
# `runner_tools` (buildforge-starter#385, from the review of agent-os#506).
# `psi` and `psi_audit` they run too, but a project with an audit of its own
# places them with `--into tools` (docs/SHARED_PARTS.md). And the scanner's
# tests and `status`, which a pinned workflow, pytest and `init.py` find at
# theirs (buildforge-starter#352). And every block of `init.py` that is a part,
# `status` and the helpers it imports (buildforge-starter#415).
LOADED_AT_ITS_PATH = ("scripts/secretslib/", "scripts/check_secrets.py", "scripts/secret_rules.toml",
                      "scripts/shared_checks.py", ".githooks/", ".github/workflows/", "parts/security_scan.py",
                      "tests/_runner_switch.py", "parts/runner_tools.py", "tests/test_secrets.py",
                      "tests/test_init_script.py", "scripts/initlib/")


def _loaded_at_its_path(relative: str) -> bool:
    """Whether another pinned file loads the part at `relative` by that path: a file named, or one in a folder."""
    return any(relative == path or path.endswith("/") and relative.startswith(path) for path in LOADED_AT_ITS_PATH)


def _load_part(lock: dict) -> tuple[object | None, list[tuple[str, str, str]]]:
    """(`fetch_first`, run after the `shell_reader` it takes, or None; each
    part that is not, why not and its fix). ⚠️ **A part that fails leaves
    neither in `sys.modules`** (buildforge-starter#372): nothing was checked.
    ⚠️ **Nothing runs after it, but each part after it is still held to its
    pin** (the review of buildforge-starter#393), so a repo with neither is told both at once."""
    module, failed = None, []
    for relative, name, _, needs in PARTS:
        data, why, fix = _pinned_release(lock, relative)
        if not why and not failed:
            module, why, fix = _load_one(relative, name, needs, data)
        failed += [(relative, why, fix)] if why else []
    if failed:
        for _, loaded, _, _ in PARTS:
            sys.modules.pop(loaded, None)
        return None, failed
    return module, []


def _pinned_release(lock: dict, relative: str) -> tuple[bytes, str, str]:
    """(the part's bytes, when they are the release its pin names; else why not; the fix)."""
    path, pin, stem = ROOT / relative, lock["files"].get(relative), pathlib.PurePath(relative).stem
    fix = f"Take its release:  python3 scripts/shared_checks.py update {stem} <version>" if pin is None else (
        f"Put the release back:  python3 scripts/shared_checks.py update {stem} {pin.get('version', '<version>')}")
    if not path.is_file():
        return b"", "is missing", fix
    if pin is None:
        return b"", "is not pinned in the lock", fix
    data, runnable = held(relative)
    if not is_release(data, runnable, pin):
        return b"", "is not the release its pin names", fix
    return data, "", ""


def _load_one(relative: str, name: str, needs: dict[str, type | None],
              data: bytes) -> tuple[object | None, str, str]:
    """(the pinned bytes of the part at ROOT / relative, run as module `name`, or None; why not; the fix).

    ⚠️ A part that is missing or cannot load -- another release's names, a
    broken edit -- is refused, never a traceback, and never called missing
    when it is there: nothing was checked, and that is never a pass.
    ⚠️ **Only the release the lock pins runs** (code review of #343): the
    check used to live in this pinned file, and a part nobody released, a
    stub that finds nothing, would turn every push green. ⚠️ **And the bytes
    that run are the bytes that were hashed** (buildforge-starter#347, from
    the review of ps-db#746): read once, never read again to run.
    ⚠️ **Compiled from those bytes**, never from a `__pycache__` file, as the
    scanner loads its part (buildforge-starter#331): Python trusts one while
    the source keeps its size and second, and the lock pins the source, never
    that file. So none is read, and none is left in the repo.
    ⚠️ **In `sys.modules` while it runs and after**, as an import puts it:
    outside it, a release using `@dataclass` or pickle could not load."""
    path = ROOT / relative
    try:
        module = sys.modules[name] = types.ModuleType(name)
        module.__file__ = str(path)
        exec(compile(data, str(path), "exec", dont_inherit=True), module.__dict__)  # noqa: S102 -- the pinned release
        for needed, kind in needs.items():
            if not hasattr(module, needed):
                raise ImportError(f"cannot import name {needed!r} from {relative}")
            if kind is not None and not isinstance(getattr(module, needed), kind):
                raise TypeError(f"{needed} is {type(getattr(module, needed)).__name__}, not {kind.__name__}")
    except Exception as error:  # noqa: BLE001 -- any failure: nothing can be checked
        # As Python's own import does: no half-run module is left to be found (code review).
        sys.modules.pop(name, None)
        return None, f"cannot be loaded ({type(error).__name__}: {error})", RELEASE_FAILS
    return module, "", ""


def runs_gitleaks(lock: dict) -> bool:
    """Whether the scanner this repo pins is one that runs gitleaks, 2.0.0 or
    later: an older one has no `--fetch`. A version it cannot read is held."""
    pinned = find(lock, "check_secrets")
    if pinned is None:
        return False
    try:
        return int(str(lock["files"][pinned].get("version")).split(".")[0]) >= 2
    except ValueError:
        return True


def verify() -> int:
    lock = load_lock()
    # Loaded only where its check applies, so `update` and `init.py` never need it.
    part, unloaded = _load_part(lock) if runs_gitleaks(lock) else (None, [])
    try:
        # A list of text here, so an answer of the wrong shape fails here too, never in the loop
        # below; text itself would be a list of characters, each a refusal (code review).
        answer = part.unfetched_suites() if part else []
        unfetched = list(answer)
        if isinstance(answer, str) or not all(isinstance(where, str) for where in unfetched):
            raise TypeError(f"unfetched_suites() answered {type(answer).__name__}, not lines of text")
    except Exception as error:  # noqa: BLE001 -- another release's check: as one that cannot load
        part, unfetched, unloaded = None, [], [(PART, f"cannot run ({type(error).__name__}: {error})", RELEASE_FAILS)]
    for failed, why, fix in unloaded:
        does = next(does for relative, _, does, _ in PARTS if relative == failed)
        print(f"REFUSING: {failed}, {does}, {why}, so no workflow was checked.\n  {fix}", file=sys.stderr)
    refused = {failed for failed, _, _ in unloaded}
    for where in unfetched:
        print(f"REFUSING: {where}.", file=sys.stderr)
    if unfetched:
        print(
            "\nThe hook refuses every commit until the pinned gitleaks is cached, and only the fetch caches\n"
            f"it. Before those tests, in the same job, add a step that runs `{part.FETCH_COMMAND}`\n"
            "alone, with no `continue-on-error`, and no `if:` or one that runs it whenever the tests'\n"
            "step runs: `always()` before an `always()` step (buildforge-starter#320, #339).\n",
            file=sys.stderr,
        )
    renamed = renamed_dependabot_branch()
    for where in renamed:
        print(f"REFUSING: {where} sets {BRANCH_NAME_OPTION}.", file=sys.stderr)
    if renamed:
        print(
            "\nIt renames Dependabot's branch, which the shared jobs' runs-on knows by\n"
            "`dependabot/` and keeps off the home machine. Remove the option (buildforge-starter#134).\n",
            file=sys.stderr,
        )
    unmet = unmet_needs(lock)
    for why in unmet:
        print(f"REFUSING: {why}", file=sys.stderr)
    # ⚠️ **One refusal for the part, with one fix** (buildforge-starter#347):
    # 1.9.3 refused an edited or missing one again here, with another.
    wrong = [relative for relative in mismatched(lock) if relative not in refused]
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
    loose = [relative for relative in unflagged(lock) if relative not in refused]
    for relative in loose:
        print(
            f"REFUSING: {relative} is executable, and its pin does not say so. Take its release again:\n"
            f"  python3 scripts/shared_checks.py update {pathlib.PurePath(relative).stem}"
            f" {lock['files'][relative]['version']}",
            file=sys.stderr,
        )
    if renamed or loose or unfetched or unloaded or unmet:
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
    loaded_at_its_path = _loaded_at_its_path(relative)
    if into is not None and loaded_at_its_path:
        print(f"REFUSING: {relative} is loaded at that path by the check that runs it, so it takes no --into.",
              file=sys.stderr)
        return 1
    # A tag on the wrong commit would pin a lie.
    declared = declared_version(data)
    if declared != version:
        print(f"REFUSING: {relative} at {tag} declares version {declared}, not {version}.", file=sys.stderr)
        return 1
    # ⚠️ **A runtime part lives where the repo's app is built from**, which
    # only the repo knows, so `--into` places it and the pin remembers: a
    # later update that followed the release's path instead would leave the
    # app running an old file nothing pins (buildforge-starter#68).
    # ⚠️ One that 1.9.3 let a repo place goes back to its path, and its old pin
    # is dropped below and named (code review of buildforge-starter#347).
    placed = None if loaded_at_its_path else next(
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
    # ⚠️ **Said now, not on the next run** (code review of buildforge-starter#352):
    # a release that needs a part the lock lacks was "Pinned", and refused only
    # after the commit. Exit 0 still: a repo takes its parts one `update` at a time.
    for why in unmet_needs(lock):
        print(f"Not met yet: {why}")
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
