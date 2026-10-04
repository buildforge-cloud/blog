"""A real nginx with no docker and no install, to test a project's nginx config before staging.

    binary = nginx_rig.fetch()                      # <cache>/root/usr/sbin/nginx
    port = nginx_rig.free_port()
    server = nginx_rig.render(template, [
        ("listen 80;", f"listen 127.0.0.1:{port};"),
        (":8000", f":{api_port}", 6),               # a hit count other than 1 is named
    ])
    conf = nginx_rig.wrap(server, scratch, binary.parents[2])   # the packages' root
    with nginx_rig.serve(conf, scratch, binary) as url:         # http://127.0.0.1:<port>
        urllib.request.urlopen(url + "/")

    with nginx_rig.serve_dir(template, "dist", port, [("${API_UPSTREAM}", "127.0.0.1")]) as url:
        ...                                         # all four steps above, over a built folder

    python3 nginx_rig.py serve-dir nginx.conf dist --port 4177 [--replace OLD NEW [COUNT]]... [--nginx BINARY]

CI runs no nginx (a web project's e2e suite serves the build with `vite
preview`), and docker is off limits on this host, so an nginx change was
first seen on staging. ps-db#418 ran the real one in a scratchpad instead and
measured its review fixes with it: a dead DNS held the home page 30,006 ms
(68 ms after), and `ssi on` had cost six SPA routes their 304. This is that
rig (buildforge-starter#96).

- `fetch(cache)`: `apt-get download nginx nginx-common` in `cache` (default
  `~/.cache/nginx_rig/`), and `dpkg-deb -x` of both into a folder renamed to
  `cache/root` in one step. Nothing is installed and nothing needs root. An
  extracted cache is reused. Every repo and worker shares the default cache,
  so a fetch holds a lock on it (`flock`), and one that must wait says so.
  Under the lock it removes the temp folder a killed fetch left.
- `render(text, replaces)`: drops every full-line `#` comment, then makes each
  `(old, new)` or `(old, new, count)` replace in order. Each must hit exactly
  its count, 1 when unnamed, or it raises `ValueError`: a template that
  changed under a test fails it, rather than serving something else.
- `wrap(server_conf, scratch, root)`: the whole config around a conf.d-level
  file, which is what every project's template is. The pid, the lock, the
  temp paths and the access log go in `scratch`, because the package's
  compiled-in paths (`/var/lib/nginx`, `/var/log/nginx`) are root's. Errors go
  to stderr at `notice`. `default_type` is the image's. Each path is quoted,
  so a space in it holds.
- `serve(conf, scratch, binary)`: refuses a `listen` not on `127.0.0.1`, and a
  `server` with none, which nginx would give every address (`*:8000` when not
  root, and :8000 on this host is someone else's server). Then `nginx -t`;
  then nginx in the foreground, handed over on its `start worker processes`
  line, never after a sleep. On exit: SIGQUIT and a wait, so no nginx is left.
  A graceful stop waits for each request in flight; past 10 s nginx is killed,
  and that raises only when the `with` body raised nothing of its own.
  However the `with` ends, nginx's stderr pipe is read to its end and closed.
  The pipe's reader starts before nginx, so from nginx's start on, an error
  or a signal's exception stops it. ⚠️ Not one inside `subprocess.Popen`
  itself: CPython's Popen does not stop a child it started when its own
  start is cut short.
- `serve_dir(conf, site, port, replaces=(), binary=None)`: the four above, for
  a project's server config over a built folder. It makes `listen 80;` the
  port on 127.0.0.1 and `root /usr/share/nginx/html;` the folder, quoted,
  then each extra replace, in a scratch folder that is gone after the
  `with`. A replace that misses raises before nginx runs. `binary` defaults
  to `fetch()`'s. ⚠️ nginx reads a `$` in `root` as a variable, quoted or not.
- `serve-dir`, the same from the command line: it prints `serving <site> at
  <url>` once nginx is ready, and serves until SIGTERM or SIGINT. Either one
  stops nginx and waits for it, and from then on both are ignored, so a
  second one cannot cut the stop short. An error is one line on stderr, and
  exit 1. It waits on a wakeup pipe, not `signal.pause()`, which sleeps
  through a signal that lands just before it. Run in-process, `main()` puts
  back the signal handlers and the wakeup fd it found.

⚠️ **Probe a denied folder with a file in it, never the folder alone.** nginx
answers 403 for a folder with no index file, so the folder stays 403 with its
`deny` rule deleted. On profile-homepage, with `^~ /tests/` deleted, `/tests/`
was still 403 and `/tests/page-health.spec.js` was 200 (profile-homepage#28).

⚠️ **This is Ubuntu 24.04's nginx 1.24, not the image's** (`nginx:alpine`,
1.31 on staging). A directive newer than 1.24 fails `nginx -t` here even
where the image takes it: `add_header_inherit` came in 1.29.3. A test of
such a config cannot run on this rig.

## A child repo

A shared part, pinned like `access_stub`: a release of buildforge-starter,
byte for byte, never edited in place. It goes beside the tests that use it:

    python3 scripts/shared_checks.py update nginx_rig 1.1.0 --into <its tests folder>

A browser suite meets the real nginx headers (the CSP among them) with
`serve-dir` as Playwright's server, in `playwright.config`:

    webServer: {
      command: `python3 tests/nginx_rig.py serve-dir nginx.conf dist --port ${port}`,
      url: `http://127.0.0.1:${port}/`,
      gracefulShutdown: { signal: "SIGTERM", timeout: 15_000 },
      reuseExistingServer: false,
    },

⚠️ **Keep `gracefulShutdown`.** Playwright's default stop is a SIGKILL, which
no process can catch. nginx runs in its own session, so it outlives a killed
`serve-dir` and keeps the port. On SIGTERM, `serve-dir` stops nginx and waits
for it. The block is for a run by hand, behind `NGINX_RIG=1` like the test
that downloads nginx: CI has no nginx (blog#22).

stdlib only. ⚠️ A child that runs vulture's dead-code ratchet over a test
with a stub API on `BaseHTTPRequestHandler`, as this part's own test has,
lists its `do_GET` and `log_message` as known: the stdlib calls them, so
vulture sees no caller (ps-db#420). Its own tests live in
buildforge-starter (`parts/tests/`); the one that downloads nginx runs only
with `NGINX_RIG=1`, so CI never does.
"""

from __future__ import annotations

import argparse
import fcntl
import os
import queue
import re
import select
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager, suppress
from pathlib import Path

__version__ = "1.1.0"

BINARY, MIME_TYPES = "usr/sbin/nginx", "etc/nginx/mime.types"
TEMP_PATHS = ("client_body", "proxy", "fastcgi", "uwsgi", "scgi")
READY = "start worker processes"  # nginx's notice once its sockets are open
READY_TIMEOUT = 20.0  # s: a bind nginx cannot make gives up after 2.5 s
STOP_TIMEOUT = 10.0  # s
STOP_SIGNALS = (signal.SIGTERM, signal.SIGINT)  # serve-dir's: Playwright's gracefulShutdown, and Ctrl-C

# A word, a quoted string, a comment, or one of `{`, `}`, `;`.
_TOKEN = re.compile(r""""(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|[{};]|[^\s{};]+""")


def fetch(cache: Path | None = None) -> Path:
    """nginx's binary, extracted from its .deb under `cache`, by one fetch at a time."""
    cache = Path(cache) if cache else Path.home() / ".cache/nginx_rig"
    root = cache / "root"
    cache.mkdir(parents=True, exist_ok=True)
    with open(cache / "fetch.lock", "w") as lock:  # every repo and worker shares the default cache
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(f"nginx_rig: waiting for another fetch into {cache}", file=sys.stderr, flush=True)
            fcntl.flock(lock, fcntl.LOCK_EX)
        for leftover in cache.glob("tmp*"):  # a killed fetch's: none other runs while this holds the lock
            shutil.rmtree(leftover, ignore_errors=True)
        if (root / BINARY).exists() and (root / MIME_TYPES).exists():
            return root / BINARY
        for older in cache.glob("*.deb"):  # an earlier fetch's: its name can sort after this one's
            older.unlink()
        subprocess.run(["apt-get", "download", "nginx", "nginx-common"], cwd=cache, check=True)
        # Extracted aside and renamed in one step, so `root` is whole or absent, even after a kill.
        with tempfile.TemporaryDirectory(dir=cache) as extracted:  # its cleanup skips it once renamed
            for deb in sorted(cache.glob("*.deb")):
                subprocess.run(["dpkg-deb", "-x", str(deb), extracted], check=True)
            shutil.rmtree(root, ignore_errors=True)  # a half one, left by an extract before this
            Path(extracted).rename(root)
    return root / BINARY


def render(text: str, replaces) -> str:
    """`text` without its full-line comments, each replace made exactly as often as it names."""
    text = "".join(line for line in text.splitlines(keepends=True) if not line.lstrip().startswith("#"))
    for old, new, *count in replaces:
        wanted = count[0] if count else 1
        found = text.count(old)
        if found != wanted:
            raise ValueError(f"{old!r} is in the config {found} times, not {wanted}")
        text = text.replace(old, new)
    return text


def _quoted(path: Path) -> str:
    """`path` as one nginx argument: unquoted, a space would make it two."""
    return '"' + str(path).replace("\\", "\\\\").replace('"', '\\"') + '"'


def wrap(server_conf: str, scratch: Path, root: Path) -> str:
    """A whole nginx config around a conf.d-level file, writing only in `scratch`."""
    scratch, root = Path(scratch).absolute(), Path(root).absolute()  # nginx reads a relative one against -p
    temp_paths = "".join(f"    {name}_temp_path {_quoted(scratch / name)};\n" for name in TEMP_PATHS)
    return (
        f"pid {_quoted(scratch / 'nginx.pid')};\n"
        f"lock_file {_quoted(scratch / 'nginx.lock')};\n"
        "error_log stderr notice;\n"
        "events {}\n"
        "http {\n"
        f"    include {_quoted(root / MIME_TYPES)};\n"
        "    default_type application/octet-stream;\n"
        f"    access_log {_quoted(scratch / 'access.log')};\n"
        f"{temp_paths}"
        f"{server_conf}"
        "}\n"
    )


def free_port() -> int:
    """A port nothing listens on at 127.0.0.1, just now."""
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


def _server_listens(conf: str) -> list[list[str]]:
    """Each `server` block's listen addresses, in order."""
    servers: list[list[str]] = []
    blocks: list[str] = []
    words: list[str] = []
    for token in _TOKEN.findall(conf):
        if token.startswith("#"):
            continue
        if token == "{":
            blocks.append(words[0] if words else "")
            if blocks[-1] == "server":
                servers.append([])
            words = []
        elif token == "}":
            blocks = blocks[:-1]
            words = []
        elif token == ";":
            if words[:1] == ["listen"] and blocks[-1:] == ["server"]:
                servers[-1] += words[1:2]
            words = []
        else:
            words.append(token)
    return servers


def _loopback_url(conf: str) -> str:
    """The URL of the first `listen`, once every server listens on 127.0.0.1 only."""
    servers = _server_listens(conf)
    if not servers or not all(servers):
        raise ValueError(
            "refusing a server with no `listen`: nginx would give it every address "
            "(*:8000 when not root). Give it `listen 127.0.0.1:<port>;`."
        )
    for address in (address for listens in servers for address in listens):
        if address.rpartition(":")[0] != "127.0.0.1":
            raise ValueError(f"refusing `listen {address}`: the rig listens on 127.0.0.1:<port> only")
    return f"http://{servers[0][0]}"


@contextmanager
def serve(conf: str, scratch: Path, binary: Path) -> Iterator[str]:
    """nginx running `conf`, for the length of the `with`; yields its URL."""
    url = _loopback_url(conf)
    scratch = Path(scratch).absolute()  # nginx reads a relative -c against -p
    path = scratch / "nginx.conf"
    path.write_text(conf, encoding="utf-8")
    options = ["-p", str(scratch), "-c", str(path), "-e", "stderr"]
    check = subprocess.run([str(binary), "-t", *options], capture_output=True, text=True, check=False)
    if check.returncode:
        raise RuntimeError(f"nginx -t refused {path}:\n{check.stderr}")
    log: list[str] = []
    lines: queue.Queue[str | None] = queue.Queue()
    handed: queue.Queue = queue.Queue()  # nginx's stderr once it runs; None ends a pump that never got it

    def pump():  # drains stderr for as long as nginx runs, or a full pipe stalls it
        for line in handed.get() or ():
            log.append(line)
            lines.put(line)
        lines.put(None)

    reader = threading.Thread(target=pump, daemon=True)
    process = None
    try:  # started before nginx, so no step between nginx's start and its stop's `try` can be cut short
        reader.start()
        process = subprocess.Popen(
            [str(binary), *options, "-g", "daemon off;"],
            stderr=subprocess.PIPE,
            text=True,
            errors="replace",
            start_new_session=True,
        )
        try:
            handed.put(process.stderr)
            _wait_until_ready(lines, log)
            yield url
        except BaseException:
            _stop(process)  # killed or not, the error already on its way is the one to see
            raise
        if not _stop(process):
            raise RuntimeError(f"nginx was still running {STOP_TIMEOUT} s after SIGQUIT, so it was killed")
    finally:  # nginx is gone, so the pump reads its pipe to the end
        handed.put(None)
        with suppress(RuntimeError):  # a signal cut its start short: once running, it takes the None
            reader.join()
        if process is not None:
            process.stderr.close()


@contextmanager
def serve_dir(conf: str, site: Path, port: int, replaces=(), binary: Path | None = None) -> Iterator[str]:
    """A project's server config serving the folder `site` at 127.0.0.1:`port`; yields its URL."""
    site = Path(site).absolute()
    if not site.is_dir():
        raise NotADirectoryError(f"{site} is not a folder")
    server_conf = render(
        conf,
        [("listen 80;", f"listen 127.0.0.1:{port};"), ("root /usr/share/nginx/html;", f"root {_quoted(site)};"), *replaces],
    )
    binary = Path(binary) if binary else fetch()
    with (
        tempfile.TemporaryDirectory(prefix="nginx_rig-") as scratch,
        serve(wrap(server_conf, Path(scratch), binary.parents[2]), Path(scratch), binary) as url,
    ):
        yield url


def _wait_until_ready(lines: queue.Queue, log: list[str]) -> None:
    deadline = time.monotonic() + READY_TIMEOUT
    while True:
        try:
            line = lines.get(timeout=max(0.0, deadline - time.monotonic()))
        except queue.Empty:
            raise RuntimeError(f"nginx was not ready after {READY_TIMEOUT} s:\n{''.join(log)}") from None
        if line is None:
            raise RuntimeError(f"nginx exited before it was ready:\n{''.join(log)}")
        if READY in line:
            return


def _stop(process: subprocess.Popen) -> bool:
    """SIGQUIT, nginx's graceful stop, and a wait; past STOP_TIMEOUT, its whole group is
    killed and this is False. A graceful stop waits for each request still in flight;
    after it, whatever is left of the group is killed."""
    process.send_signal(signal.SIGQUIT)
    try:
        process.wait(timeout=STOP_TIMEOUT)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()
        return False
    try:  # a worker the master left holds its stderr, so the pump would never see the end
        os.killpg(process.pid, signal.SIGKILL)
    except ProcessLookupError:  # none left: the usual case
        pass
    return True


def _stopping(*_) -> None:
    """The first SIGTERM or SIGINT unwinds the `with`; the stop it starts ignores both from then on."""
    for each in STOP_SIGNALS:
        signal.signal(each, signal.SIG_IGN)
    raise SystemExit(0)


def _serve_dir_until_a_signal(args: argparse.Namespace, replaces: list) -> int:
    handlers = {each: signal.getsignal(each) for each in STOP_SIGNALS}
    woken, wake = os.pipe()
    try:
        os.set_blocking(wake, False)
        wakeup = signal.set_wakeup_fd(wake)  # pause() would sleep through a signal that lands just before it
        try:
            for each in STOP_SIGNALS:
                signal.signal(each, _stopping)
            with serve_dir(args.conf.read_text(encoding="utf-8"), args.site, args.port, replaces, args.nginx) as url:
                print(f"serving {args.site} at {url}", flush=True)
                while True:
                    select.select([woken], [], [])
        except (OSError, ValueError, RuntimeError) as error:
            print(f"nginx_rig: {' '.join(str(error).split())}", file=sys.stderr)
            return 1
        finally:  # an in-process caller gets its own back
            signal.set_wakeup_fd(wakeup)
            for each, handler in handlers.items():
                signal.signal(each, handler)
    finally:
        os.close(woken)
        os.close(wake)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("serve-dir", help="serve a built folder on a project's config until SIGTERM or SIGINT")
    command.add_argument("conf", type=Path, help="the project's server config, such as nginx.conf")
    command.add_argument("site", type=Path, help="the folder it serves, such as dist")
    command.add_argument("--port", type=int, required=True)
    command.add_argument(
        "--replace",
        nargs="+",
        action="append",
        default=[],
        metavar="OLD NEW [COUNT]",
        help="one more replace, made after `listen 80;` and the root; repeatable",
    )
    command.add_argument("--nginx", type=Path, help="the nginx binary (default: fetch()'s)")
    args = parser.parse_args(argv)
    replaces = []
    for words in args.replace:
        if len(words) not in (2, 3) or not all(count.isdecimal() for count in words[2:]):  # isdigit() takes "²"
            command.error(f"--replace takes OLD NEW [COUNT], not {words}")
        replaces.append((*words[:2], *map(int, words[2:])))
    return _serve_dir_until_a_signal(args, replaces)


if __name__ == "__main__":
    raise SystemExit(main())
