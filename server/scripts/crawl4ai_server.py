"""
Crawl4AI Sidecar Server for PricePoint
=======================================
A lightweight Flask server wrapping Crawl4AI that mirrors the Docker API's
/crawl endpoint. This allows the Node.js/TypeScript server to call Crawl4AI
over HTTP, identical to how it would call the Docker container in production.

Usage (local dev):
    pip install -r requirements.txt
    python crawl4ai_server.py

The server runs on port 11235 by default (same as the Crawl4AI Docker image).
"""

import asyncio
import os
import json
import logging
from flask import Flask, request, jsonify

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [Crawl4AI Sidecar] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ── Lazy-load crawler to avoid startup delay if not needed ──
_crawler = None

async def get_crawler():
    """Get or create the AsyncWebCrawler singleton."""
    global _crawler
    if _crawler is None:
        from crawl4ai import AsyncWebCrawler, BrowserConfig
        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
        )
        _crawler = AsyncWebCrawler(config=browser_config)
        await _crawler.__aenter__()
        logger.info("Crawl4AI browser started")
    return _crawler


async def do_crawl(urls: list[str]) -> list[dict]:
    """Crawl one or more URLs and return results."""
    from crawl4ai import CrawlerRunConfig, CacheMode

    crawler = await get_crawler()
    results = []

    for url in urls:
        try:
            run_config = CrawlerRunConfig(
                cache_mode=CacheMode.BYPASS,
            )
            result = await crawler.arun(url=url, config=run_config)

            # Extract markdown content
            markdown_content = ""
            if result.markdown:
                if hasattr(result.markdown, "raw_markdown"):
                    markdown_content = result.markdown.raw_markdown
                elif isinstance(result.markdown, str):
                    markdown_content = result.markdown

            results.append({
                "url": url,
                "html": result.html[:50000] if result.html else "",
                "markdown": markdown_content[:50000] if markdown_content else "",
                "success": result.success if hasattr(result, "success") else True,
                "status_code": result.status_code if hasattr(result, "status_code") else 200,
            })
            logger.info(f"Crawled {url} — success, markdown length: {len(markdown_content)}")

        except Exception as e:
            logger.error(f"Failed to crawl {url}: {e}")
            results.append({
                "url": url,
                "html": "",
                "markdown": "",
                "success": False,
                "error": str(e),
                "status_code": 500,
            })

    return results


# ── Routes ───────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "crawl4ai-sidecar"})


@app.route("/crawl", methods=["POST"])
def crawl():
    """
    Synchronous crawl endpoint (mirrors Crawl4AI Docker API).

    Request body:
        {
            "urls": ["https://example.com"],
            "priority": 10  (optional, ignored in sidecar)
        }

    Response:
        {
            "results": [
                {
                    "url": "https://example.com",
                    "html": "...",
                    "markdown": "...",
                    "success": true,
                    "status_code": 200
                }
            ]
        }
    """
    data = request.get_json(force=True)
    urls = data.get("urls", [])

    if not urls:
        return jsonify({"error": "No URLs provided"}), 400

    # Run the async crawl in the event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        results = loop.run_until_complete(do_crawl(urls))
    finally:
        loop.close()

    return jsonify({"results": results})


# ── Main ─────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("CRAWL4AI_PORT", "11235"))
    logger.info(f"Starting Crawl4AI sidecar on port {port}")
    logger.info("Press Ctrl+C to stop")
    app.run(host="0.0.0.0", port=port, debug=False)
