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
- `render(text, replaces)`: drops every full-line `#` comment, then makes each
  `(old, new)` or `(old, new, count)` replace in order. Each must hit exactly
  its count, 1 when unnamed, or it raises `ValueError`: a template that
  changed under a test fails it, rather than serving something else.
- `wrap(server_conf, scratch, root)`: the whole config around a conf.d-level
  file, which is what every project's template is. The pid, the lock, the
  temp paths and the access log go in `scratch`, because the package's
  compiled-in paths (`/var/lib/nginx`, `/var/log/nginx`) are root's. Errors go
  to stderr at `notice`. `default_type` is the image's.
- `serve(conf, scratch, binary)`: refuses a `listen` not on `127.0.0.1`, and a
  `server` with none, which nginx would give every address (`*:8000` when not
  root, and :8000 on this host is someone else's server). Then `nginx -t`;
  then nginx in the foreground, handed over on its `start worker processes`
  line, never after a sleep. On exit: SIGQUIT and a wait, so no nginx is left.
  A graceful stop waits for each request in flight; past 10 s nginx is killed,
  and that raises only when the `with` body raised nothing of its own.

⚠️ **This is Ubuntu 24.04's nginx 1.24, not the image's** (`nginx:alpine`,
1.31 on staging). A directive newer than 1.24 fails `nginx -t` here even
where the image takes it: `add_header_inherit` came in 1.29.3. A test of
such a config cannot run on this rig.

## A child repo

A shared part, pinned like `access_stub`: a release of buildforge-starter,
byte for byte, never edited in place. It goes beside the tests that use it:

    python3 scripts/shared_checks.py update nginx_rig 1.0.0 --into <its tests folder>

stdlib only. Its own tests live in buildforge-starter (`parts/tests/`); the
one that downloads nginx runs only with `NGINX_RIG=1`, so CI never does.
"""

from __future__ import annotations

import fcntl
import os
import queue
import re
import shutil
import signal
import socket
import subprocess
import sys
import tempfile
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

__version__ = "1.0.0"

BINARY, MIME_TYPES = "usr/sbin/nginx", "etc/nginx/mime.types"
TEMP_PATHS = ("client_body", "proxy", "fastcgi", "uwsgi", "scgi")
READY = "start worker processes"  # nginx's notice once its sockets are open
READY_TIMEOUT = 20.0  # s: a bind nginx cannot make gives up after 2.5 s
STOP_TIMEOUT = 10.0  # s

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


def wrap(server_conf: str, scratch: Path, root: Path) -> str:
    """A whole nginx config around a conf.d-level file, writing only in `scratch`."""
    scratch, root = Path(scratch).absolute(), Path(root).absolute()  # nginx reads a relative one against -p
    temp_paths = "".join(f"    {name}_temp_path {scratch / name};\n" for name in TEMP_PATHS)
    return (
        f"pid {scratch / 'nginx.pid'};\n"
        f"lock_file {scratch / 'nginx.lock'};\n"
        "error_log stderr notice;\n"
        "events {}\n"
        "http {\n"
        f"    include {root / MIME_TYPES};\n"
        "    default_type application/octet-stream;\n"
        f"    access_log {scratch / 'access.log'};\n"
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
    check = subprocess.run([str(binary), "-t", *options], capture_output=True, text=True)
    if check.returncode:
        raise RuntimeError(f"nginx -t refused {path}:\n{check.stderr}")
    process = subprocess.Popen(
        [str(binary), *options, "-g", "daemon off;"],
        stderr=subprocess.PIPE,
        text=True,
        errors="replace",
        start_new_session=True,
    )
    log: list[str] = []
    lines: queue.Queue[str | None] = queue.Queue()

    def pump():  # drains stderr for as long as nginx runs, or a full pipe stalls it
        for line in process.stderr:
            log.append(line)
            lines.put(line)
        lines.put(None)

    reader = threading.Thread(target=pump, daemon=True)
    reader.start()
    try:
        _wait_until_ready(lines, log)
        yield url
    except BaseException:
        _stop(process)  # killed or not, the error already on its way is the one to see
        raise
    if not _stop(process):
        raise RuntimeError(f"nginx was still running {STOP_TIMEOUT} s after SIGQUIT, so it was killed")


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
    killed and this is False. A graceful stop waits for each request still in flight."""
    process.send_signal(signal.SIGQUIT)
    try:
        process.wait(timeout=STOP_TIMEOUT)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGKILL)
        process.wait()
        return False
    return True
