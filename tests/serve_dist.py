"""The real `nginx.conf` on a real nginx, over a folder, at 127.0.0.1 (blog#21).

    python3 tests/serve_dist.py 4177      # serves dist/ until SIGTERM or Ctrl-C

`NGINX_RIG=1 npm run test:pages` starts this as Playwright's server, so the
browser checks meet the headers production sends, the CSP among them.
`tests/test_nginx.py` serves its stub site with `serve()`. nginx comes from
`tests/nginx_rig.py` (a pinned shared part): no docker, no install.

⚠️ Stop it with SIGTERM or SIGINT, never SIGKILL. nginx runs in its own
session, so a SIGKILL to this process leaves nginx serving. Both signals
unwind the `with`, and nginx_rig stops nginx and waits for it.
"""

from __future__ import annotations

import signal
import sys
import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

import nginx_rig

ROOT = Path(__file__).resolve().parent.parent
CONF = ROOT / "nginx.conf"


@contextmanager
def serve(site: Path, port: int) -> Iterator[str]:
    """`nginx.conf` serving `site` at 127.0.0.1:`port`; yields its URL."""
    with tempfile.TemporaryDirectory() as scratch:
        server = nginx_rig.render(
            CONF.read_text(encoding="utf-8"),
            [
                ("listen 80;", f"listen 127.0.0.1:{port};"),
                ("root /usr/share/nginx/html;", f"root {Path(site).absolute()};"),
            ],
        )
        binary = nginx_rig.fetch()
        conf = nginx_rig.wrap(server, Path(scratch), binary.parents[2])
        with nginx_rig.serve(conf, Path(scratch), binary) as url:
            yield url


def main() -> int:
    port = int(sys.argv[1])
    dist = ROOT / "dist"
    if not (dist / "index.html").exists():
        print(f"no build in {dist}: run `npm run build` first", file=sys.stderr)
        return 1
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))  # unwinds the `with`, which stops nginx
    try:
        with serve(dist, port) as url:
            print(f"serving {dist} at {url}", flush=True)
            while True:
                signal.pause()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
