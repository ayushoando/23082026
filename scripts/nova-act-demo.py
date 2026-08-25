"""Start a headed Nova Act browser and answer a page question.

PowerShell:
    $env:NOVA_ACT_API_KEY = "<your-api-key>"
    py scripts/nova-act-demo.py

Optional:
    py scripts/nova-act-demo.py --url https://example.com --question "What is the page title?"
    py scripts/nova-act-demo.py --headless
    py scripts/nova-act-demo.py --close-browser

The API key is read only from NOVA_ACT_API_KEY. The browser uses an isolated
Playwright Chromium profile and connects to Nova Act over localhost CDP.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Final
from urllib.error import URLError
from urllib.request import urlopen

from nova_act import NovaAct
from playwright.sync_api import sync_playwright

DEFAULT_PORT: Final[int] = 9222
DEFAULT_URL: Final[str] = "https://example.com"
DEFAULT_QUESTION: Final[str] = "What is the main heading on this page?"


def cdp_is_available(port: int) -> bool:
    """Return whether a browser is already listening on the CDP port."""
    try:
        with urlopen(f"http://localhost:{port}/json/version", timeout=1) as response:
            return response.status == 200
    except (OSError, URLError):
        return False


def wait_for_cdp(port: int, timeout_seconds: float = 15) -> None:
    """Wait until the browser exposes its CDP endpoint."""
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if cdp_is_available(port):
            return
        time.sleep(0.25)
    raise RuntimeError(
        f"Chromium did not start its CDP endpoint on localhost:{port} within "
        f"{timeout_seconds:g} seconds."
    )


def launch_chromium(port: int, headless: bool) -> subprocess.Popen[bytes]:
    """Launch the bundled Playwright Chromium in an isolated profile."""
    with sync_playwright() as playwright:
        executable_path = playwright.chromium.executable_path

    profile_path = Path(tempfile.mkdtemp(prefix="nova-act-demo-"))
    browser_args = [
        f"--remote-debugging-port={port}",
        f"--user-data-dir={profile_path}",
        "--no-first-run",
        "--no-default-browser-check",
        "--window-size=1600,900",
    ]
    if headless:
        browser_args.append("--headless=new")

    creationflags = (
        subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0
    )
    process = subprocess.Popen(
        [executable_path, *browser_args],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creationflags,
    )
    wait_for_cdp(port)
    return process


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run a small Nova Act browser extraction demo."
    )
    parser.add_argument("--url", default=DEFAULT_URL, help="Page to open")
    parser.add_argument(
        "--question",
        default=DEFAULT_QUESTION,
        help="Natural-language question to ask Nova Act",
    )
    parser.add_argument(
        "--port",
        default=DEFAULT_PORT,
        type=int,
        help="Local CDP port (default: 9222)",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run without a visible browser window",
    )
    parser.add_argument(
        "--close-browser",
        action="store_true",
        help="Close Chromium if this script launched it",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    api_key = os.getenv("NOVA_ACT_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Set NOVA_ACT_API_KEY before running, for example: "
            '$env:NOVA_ACT_API_KEY = "<your-api-key>"'
        )

    browser_process: subprocess.Popen[bytes] | None = None
    if not cdp_is_available(args.port):
        browser_process = launch_chromium(args.port, headless=args.headless)
        print(f"Started {'headless' if args.headless else 'headed'} Chromium.")
    else:
        print(f"Reusing the browser already connected on localhost:{args.port}.")

    try:
        with NovaAct(
            cdp_endpoint_url=f"http://localhost:{args.port}",
            cdp_use_existing_page=True,
            headless=args.headless,
            ignore_screen_dims_check=True,
            nova_act_api_key=api_key,
        ) as nova:
            nova.page.goto(args.url)
            result = nova.act_get(args.question)
            print(f"Nova Act response: {result.response}")
    finally:
        if browser_process is not None and args.close_browser:
            browser_process.terminate()
            browser_process.wait(timeout=10)


if __name__ == "__main__":
    main()
