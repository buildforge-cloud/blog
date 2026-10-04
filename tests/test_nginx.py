"""What `nginx.conf` serves, asked of a real nginx before a deploy (blog#19).

    NGINX_RIG=1 python3 -m unittest discover -s tests -p "test_nginx.py"

Without `NGINX_RIG=1` every test skips, so CI never fetches nginx. With it,
`tests/nginx_rig.py` (buildforge-starter's shared part, pinned in
`scripts/shared-checks.lock`, never edited here) extracts Ubuntu's nginx 1.24
into `~/.cache/nginx_rig/`, with no docker and no install, and
`tests/serve_dist.py` serves the real `nginx.conf` on 127.0.0.1 over a stub
site.

Every kind of answer carries the security headers: a page, an `/_astro/`
file, a `/pagefind/` file, an image, `robots.txt` and the 404 page. Before
blog#21 every block with its own `add_header` dropped them, so no page had a
CSP. `tests/nginx-headers.test.mjs` checks the same thing in `npm test`
without nginx.
"""

from __future__ import annotations

import http.client
import os
import re
import tempfile
import unittest
from pathlib import Path

import nginx_rig
import serve_dist
from serve_dist import CONF

# A stub of the built site: what each test asks for, and a hidden file.
SITE = {
    "index.html": "home",
    "posts/x/index.html": "a post",
    "404.html": "the 404 page",
    "_astro/x.css": "body{}",
    "pagefind/x.js": "export {}",
    "x.png": "not really a png",
    "robots.txt": "User-agent: *",
    ".env": "SECRET=stub",
}

# One path of each kind of answer the config sends, and what it answers.
EVERY_KIND = {
    "/": 200,
    "/posts/x/": 200,
    "/_astro/x.css": 200,
    "/pagefind/x.js": 200,
    "/x.png": 200,
    "/robots.txt": 200,
    "/no-such-page/": 404,
}


def declared_csp() -> str:
    """The CSP `nginx.conf` declares, so a change to the policy needs no change here."""
    found = re.findall(r'^\s*add_header\s+Content-Security-Policy\s+"([^"]+)"', CONF.read_text(encoding="utf-8"), re.M)
    if len(found) != 1:
        raise ValueError(f"nginx.conf sets the CSP {len(found)} times, not once")
    return found[0]


SECURITY = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": declared_csp(),
}


def cache_control(headers: http.client.HTTPMessage) -> str:
    """Every Cache-Control header, joined as a client reads them.

    ⚠️ `/_astro/` gets two: `expires 1y` sends `max-age=31536000`, and the
    server's `add_header` sends `public, immutable`. `headers["Cache-Control"]`
    is only the first.
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
        cls.enterClassContext(serve_dist.serve(site, cls.port))

    def get(self, path: str) -> tuple[int, http.client.HTTPMessage, str]:
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            connection.request("GET", path)
            response = connection.getresponse()
            return response.status, response.headers, response.read().decode("utf-8")
        finally:
            connection.close()

    def test_every_kind_of_answer_carries_the_security_headers(self):
        for path, expected in EVERY_KIND.items():
            status, headers, _ = self.get(path)
            self.assertEqual(status, expected, path)
            for name, value in SECURITY.items():
                with self.subTest(path=path, header=name):
                    self.assertEqual(headers.get_all(name), [value])

    def test_a_page_is_revalidated_so_a_deploy_shows_at_once(self):
        for path in ("/", "/posts/x/"):
            with self.subTest(path=path):
                status, headers, _ = self.get(path)
                self.assertEqual(status, 200)
                self.assertEqual(cache_control(headers), "no-cache, must-revalidate")
                self.assertEqual(headers["Pragma"], "no-cache")

    def test_an_astro_asset_is_cached_for_good(self):
        status, headers, _ = self.get("/_astro/x.css")
        self.assertEqual(status, 200)
        self.assertEqual(cache_control(headers), "max-age=31536000, public, immutable")

    def test_a_pagefind_file_is_cached_for_a_day(self):
        status, headers, _ = self.get("/pagefind/x.js")
        self.assertEqual(status, 200)
        self.assertEqual(cache_control(headers), "max-age=86400, public")

    def test_an_image_is_cached_for_good(self):
        status, headers, _ = self.get("/x.png")
        self.assertEqual(status, 200)
        self.assertEqual(cache_control(headers), "max-age=31536000, public, immutable")

    def test_robots_txt_gets_no_cache_rule(self):
        status, headers, _ = self.get("/robots.txt")
        self.assertEqual(status, 200)
        self.assertEqual(cache_control(headers), "")

    def test_an_unknown_path_is_a_404_with_the_404_page(self):
        status, _, body = self.get("/no-such-page/")
        self.assertEqual(status, 404)
        self.assertEqual(body, SITE["404.html"])

    def test_a_hidden_file_is_refused(self):
        status, _, body = self.get("/.env")
        self.assertEqual(status, 403)
        self.assertNotIn(SITE[".env"], body)


if __name__ == "__main__":
    unittest.main()
