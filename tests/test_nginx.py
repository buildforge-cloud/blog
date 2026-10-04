"""What `nginx.conf` serves, asked of a real nginx before a deploy (blog#19).

    NGINX_RIG=1 python3 -m unittest discover -s tests -p "test_nginx.py"

Without `NGINX_RIG=1` every test skips, so CI never fetches nginx. With it,
`tests/nginx_rig.py` (buildforge-starter's shared part, pinned in
`scripts/shared-checks.lock`, never edited here) extracts Ubuntu's nginx 1.24
into `~/.cache/nginx_rig/`, with no docker and no install, and serves the real
`nginx.conf` on 127.0.0.1 over a stub site.

Not asserted: the CSP on a page, an `/_astro/` file, a `/pagefind/` file or an
image. Each of those locations sets its own `add_header`, so nginx drops the
server's security headers there (blog#17). Making the CSP reach the pages is
its own change, because the pages carry inline scripts it would block.
"""

from __future__ import annotations

import http.client
import os
import tempfile
import unittest
from pathlib import Path

import nginx_rig

CONF = Path(__file__).resolve().parent.parent / "nginx.conf"

# A stub of the built site: what each test asks for, and a hidden file.
SITE = {
    "index.html": "home",
    "posts/x/index.html": "a post",
    "404.html": "the 404 page",
    "_astro/x.css": "body{}",
    "robots.txt": "User-agent: *",
    ".env": "SECRET=stub",
}


def cache_control(headers: http.client.HTTPMessage) -> str:
    """Every Cache-Control header, joined as a client reads them.

    ⚠️ `/_astro/` gets two: `expires 1y` sends `max-age=31536000`, and its
    `add_header` sends `public, immutable`. `headers["Cache-Control"]` is
    only the first.
    """
    return ", ".join(headers.get_all("Cache-Control") or [])


@unittest.skipUnless(os.environ.get("NGINX_RIG") == "1", "set NGINX_RIG=1 to run a real nginx")
class NginxConf(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        scratch = Path(cls.enterClassContext(tempfile.TemporaryDirectory()))
        site = scratch / "site"
        for name, body in SITE.items():
            (site / name).parent.mkdir(parents=True, exist_ok=True)
            (site / name).write_text(body, encoding="utf-8")
        cls.port = nginx_rig.free_port()
        server = nginx_rig.render(
            CONF.read_text(encoding="utf-8"),
            [
                ("listen 80;", f"listen 127.0.0.1:{cls.port};"),
                ("root /usr/share/nginx/html;", f"root {site};"),
            ],
        )
        binary = nginx_rig.fetch()
        conf = nginx_rig.wrap(server, scratch, binary.parents[2])
        cls.enterClassContext(nginx_rig.serve(conf, scratch, binary))

    def get(self, path: str) -> tuple[int, http.client.HTTPMessage, str]:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, response.headers, response.read().decode("utf-8")
        finally:
            connection.close()

    def test_a_page_is_revalidated_so_a_deploy_shows_at_once(self):
        for path in ("/", "/posts/x/"):
            with self.subTest(path=path):
                status, headers, _ = self.get(path)
                self.assertEqual(status, 200)
                self.assertEqual(cache_control(headers), "no-cache, must-revalidate")

    def test_an_astro_asset_is_cached_for_good(self):
        status, headers, _ = self.get("/_astro/x.css")
        self.assertEqual(status, 200)
        self.assertIn("immutable", cache_control(headers), "/_astro/x.css")

    def test_an_unknown_path_is_a_404_with_the_404_page(self):
        status, _, body = self.get("/no-such-page/")
        self.assertEqual(status, 404)
        self.assertEqual(body, SITE["404.html"])

    def test_a_hidden_file_is_refused(self):
        status, _, body = self.get("/.env")
        self.assertEqual(status, 403)
        self.assertNotIn(SITE[".env"], body)

    def test_robots_txt_carries_the_csp(self):
        status, headers, _ = self.get("/robots.txt")
        self.assertEqual(status, 200)
        self.assertIn("default-src 'self'", headers["Content-Security-Policy"] or "")


if __name__ == "__main__":
    unittest.main()
