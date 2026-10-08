"""PageSpeed Insights medians for a public URL: Google runs Lighthouse, not this host.

Read-only. A Lighthouse run on a shared, busy server measures the server: one
site read 28 there and 77 on PageSpeed the same week, with no change between.
Measure here, never with a local Lighthouse or a load test.

Usage:
    python psi.py https://example.com/                          # 3 runs, mobile + desktop
    python psi.py https://example.com/ --runs 3 --strategy mobile
    python psi.py https://example.com/ --save psi-runs          # keep each raw JSON
    python psi.py https://example.com/ --key path/to/service-account.json
    python psi.py https://example.com/ --category accessibility best-practices seo

Prints the median of the runs per strategy: score, LCP, TBT, CLS, FCP, then
one column per other `--category` asked for (its median score, 0-100).
Performance is always asked: the other figures, and a failed run, come from it.

Auth, either of two, billed to the GCP project that owns it, where the
PageSpeed Insights API must be enabled. ⚠️ With neither the API answers 429:
the anonymous quota is 0 queries a day.

- `PSI_API_KEY` in the environment: an API key, best restricted to the
  PageSpeed Insights API, so a leaked one can do nothing else. It goes in the
  query; no token is fetched and `google-auth` is never imported. Spaces and
  newlines around it are dropped (a pasted key often ends in one), and an
  empty value counts as unset, as GitHub Actions passes a missing secret.
  ⚠️ The key, as it is and URL-encoded, is masked as `[PSI_API_KEY]` in
  every answer and network error before anything prints or saves it.
- Otherwise an OAuth token from a service account's key file (`--key`,
  default `~/.gsc/service-account.json`).

`google-auth` is imported inside `token()` only, so a test imports this
without it. A repo that signs in with `--key` installs it in a venv, with its
`requests` extra: `google-auth` alone fails at the token ("The requests
library is not installed"), and this host refuses a system `pip install`:

    python3 -m venv ~/.venvs/psi
    ~/.venvs/psi/bin/pip install "google-auth[requests]"

⚠️ A run Lighthouse could not score (a `runtimeError` such as `NO_FCP`) is a
failed run: one line names it and its error, the medians are of the rest,
and the exit is 1.

⚠️ It measures what Google can reach: a site behind Cloudflare Access, a
staging or a dev server is out of its sight.

⚠️ PSI returns its CACHED result for a URL asked about again within about a
minute: same `fetchTime`, same numbers to the last decimal. `measure` counts a
run only once per `fetchTime` and waits between asks.

## A child repo: adopt, move

A shared part, pinned like `cf_access`: a release of buildforge-starter, byte
for byte, never edited in place. A child places it once:

    python3 scripts/shared_checks.py update psi 1.1.0 --into tools

and the lock remembers the folder, so moving is `update psi <version>`. Its
tests live in buildforge-starter (`parts/tests/test_psi.py`);
buildforge-starter#95 says where it came from.
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

__version__ = "1.1.0"

API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
DEFAULT_KEY_PATH = Path.home() / ".gsc" / "service-account.json"
# Lighthouse's own ids: the API takes them as they are, and answers under them.
CATEGORIES = ("performance", "accessibility", "best-practices", "seo")
KEY_MASK = "[PSI_API_KEY]"
# Measured 2026-10-03: a repeat 24 s after a run was fresh, one ~5 s after was
# the cache. 70 s between asks gave three distinct runs every time.
WAIT_BETWEEN_RUNS_S = 70
WAIT_AFTER_CACHED_S = 30
MAX_CACHED_IN_A_ROW = 10


def token(key_path: Path = DEFAULT_KEY_PATH) -> str:
    import google.auth.transport.requests
    from google.oauth2 import service_account

    creds = service_account.Credentials.from_service_account_file(str(key_path), scopes=["openid"])
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def fetch_with(tok: str | None = None, key: str | None = None, categories=("performance",)):
    """Signs in with the API `key` when there is one, else with the token."""

    def fetch(url: str, strategy: str) -> dict:
        params = [("url", url), ("strategy", strategy), *(("category", c) for c in categories)]
        headers = {}
        if key:
            params.append(("key", key))
        else:
            headers["Authorization"] = f"Bearer {tok}"
        req = urllib.request.Request(f"{API}?{urllib.parse.urlencode(params)}", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                body = r.read().decode()
        except Exception as error:
            if not key:
                raise
            raise RuntimeError(f"{type(error).__name__}: {masked(str(error), key)}") from None
        return json.loads(masked(body, key))

    return fetch


def masked(text: str, key: str | None) -> str:
    """The key as it is and as the query carries it, URL-encoded."""
    if not key:
        return text
    return text.replace(key, KEY_MASK).replace(urllib.parse.quote_plus(key), KEY_MASK)


def metrics(result: dict, categories=("performance",)) -> dict:
    """A run's numbers, or its `failed` reason when Lighthouse could not score it."""
    lr = result["lighthouseResult"]
    audits = lr["audits"]
    scores = {c: lr["categories"].get(c, {}).get("score") for c in categories}
    unscored = [c for c, score in scores.items() if score is None]
    if unscored:
        error = lr.get("runtimeError")
        reason = f"{error['code']}: {error['message']}" if error else f"no {unscored[0]} score"
        return {"fetch_time": lr["fetchTime"], "failed": reason}
    return {
        "fetch_time": lr["fetchTime"],
        "score": round(scores["performance"] * 100),
        "lcp_ms": audits["largest-contentful-paint"]["numericValue"],
        "tbt_ms": audits["total-blocking-time"]["numericValue"],
        "cls": audits["cumulative-layout-shift"]["numericValue"],
        "fcp_ms": audits["first-contentful-paint"]["numericValue"],
        **{c: round(scores[c] * 100) for c in categories if c != "performance"},
    }


def measure(url, strategy, runs, fetch, sleep=time.sleep, on_result=None, categories=("performance",)) -> list[dict]:
    """`runs` DISTINCT PSI runs: a cached repeat is asked again, not counted."""
    seen: set[str] = set()
    rows: list[dict] = []
    cached_in_a_row = 0
    while len(rows) < runs:
        result = fetch(url, strategy)
        row = metrics(result, categories)
        if row["fetch_time"] in seen:
            cached_in_a_row += 1
            if cached_in_a_row >= MAX_CACHED_IN_A_ROW:
                raise RuntimeError(f"PSI kept returning its cached result ({row['fetch_time']}) for {url}")
            sleep(WAIT_AFTER_CACHED_S)
            continue
        cached_in_a_row = 0
        seen.add(row["fetch_time"])
        rows.append(row)
        if on_result:
            on_result(result, row)
        if len(rows) < runs:
            sleep(WAIT_BETWEEN_RUNS_S)
    return rows


def median(rows: list[dict]) -> dict:
    return {k: statistics.median(r[k] for r in rows) for k in rows[0] if k != "fetch_time"}


def at_least_one(text: str) -> int:
    runs = int(text)
    if runs < 1:
        raise argparse.ArgumentTypeError(f"must be 1 or more, not {runs}")
    return runs


def main(argv=None, fetch=None) -> int:
    """The command line; a test passes `fetch` and needs no network and no key."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("url")
    parser.add_argument("--runs", type=at_least_one, default=3)
    parser.add_argument("--strategy", nargs="+", default=["mobile", "desktop"], choices=["mobile", "desktop"])
    parser.add_argument("--save", type=Path, help="directory for each run's raw JSON")
    parser.add_argument("--key", type=Path, default=DEFAULT_KEY_PATH, help="the service account's key file")
    parser.add_argument(
        "--category", nargs="+", default=["performance"], choices=CATEGORIES, help="performance is always asked"
    )
    args = parser.parse_args(argv)

    categories = list(dict.fromkeys(["performance", *args.category]))
    others = categories[1:]
    if fetch is None:
        key = os.environ.get("PSI_API_KEY", "").strip()
        fetch = fetch_with(key=key, categories=categories) if key else fetch_with(token(args.key), categories=categories)
    any_failed = False
    print("| strategy | score | LCP | TBT | CLS | FCP |" + "".join(f" {c} |" for c in others) + " runs |")
    print("|---" * (7 + len(others)) + "|")
    for strategy in args.strategy:

        def save(result, row, strategy=strategy):
            outcome = f"failed, {row['failed']}" if "failed" in row else row["score"]
            print(f"  {strategy} run @ {row['fetch_time']}: {outcome}", file=sys.stderr, flush=True)
            if args.save:
                args.save.mkdir(parents=True, exist_ok=True)
                name = row["fetch_time"].replace(":", "")
                (args.save / f"{strategy}-{name}.json").write_text(json.dumps(result))

        rows = measure(args.url, strategy, args.runs, fetch=fetch, on_result=save, categories=categories)
        scored = [row for row in rows if "failed" not in row]
        counted = f"{len(scored)} of {len(rows)}" if len(scored) < len(rows) else f"{len(rows)}"
        any_failed = any_failed or len(scored) < len(rows)
        if not scored:
            print(f"| {strategy} | failed | - | - | - | - |" + " - |" * len(others) + f" {counted} |", flush=True)
            continue
        m = median(scored)
        print(
            f"| {strategy} | {m['score']:.0f} | {m['lcp_ms'] / 1000:.2f} s | {m['tbt_ms']:.0f} ms "
            f"| {m['cls']:.3f} | {m['fcp_ms'] / 1000:.2f} s |" + "".join(f" {m[c]:.0f} |" for c in others) + f" {counted} |",
            flush=True,
        )
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
