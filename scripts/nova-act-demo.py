"""
Nova Act demo — simple browser automation with Python.

Run after setting your API key:
    $env:NOVA_ACT_API_KEY = "your_key_here"
    python scripts/nova-act-demo.py

Get your key from https://nova.amazon.com/act?tab=dev_tools
"""

import os

from nova_act import NovaAct


def main():
    # Using headed mode so you can see the browser.
    # Switch to headless=True for CI/automation.
    api_key = os.getenv("NOVA_ACT_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Set NOVA_ACT_API_KEY before running: "
            "$env:NOVA_ACT_API_KEY = \"your_key_here\""
        )

    with NovaAct(
        starting_page="https://example.com",
        headless=False,
        nova_act_api_key=api_key,
    ) as nova:
        # Ask the page a question
        result = nova.act_get("What is the main heading on this page?")
        print(f"Page heading: {result.response}")

        # Execute a multi-step task
        nova.act("Scroll to the bottom of the page")

        # Extract structured data
        result = nova.act_get(
            "List all the links on this page",
            schema={"type": "array", "items": {"type": "string"}}
        )
        print(f"Found {len(result.parsed_response)} links")

if __name__ == "__main__":
    main()