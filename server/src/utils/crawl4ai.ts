/**
 * Crawl4AI Client Utility
 * =======================
 * TypeScript client for calling the Crawl4AI REST API (sidecar or Docker).
 * Centralizes all web scraping calls so intelligence routes stay clean.
 *
 * The API is the same whether running the Python sidecar (local dev)
 * or the Docker container (production).
 */

import axios from 'axios';
import { logger } from './logger';

// ── Types ───────────────────────────────────────────────

export interface CrawlResult {
    url: string;
    html: string;
    markdown: string;
    success: boolean;
    status_code?: number;
    error?: string;
}

export interface GoogleSearchResult {
    title: string;
    url: string;
    snippet: string;
}

// ── Config ──────────────────────────────────────────────

const CRAWL4AI_BASE_URL = process.env.CRAWL4AI_API_URL || 'http://localhost:11235';
const CRAWL4AI_TIMEOUT = parseInt(process.env.CRAWL4AI_TIMEOUT_MS || '30000', 10);

// ── Health Check ────────────────────────────────────────

/**
 * Check if the Crawl4AI service is reachable.
 */
export async function isCrawl4AiAvailable(): Promise<boolean> {
    try {
        const resp = await axios.get(`${CRAWL4AI_BASE_URL}/health`, {
            timeout: 3000,
        });
        return resp.data?.status === 'ok';
    } catch {
        return false;
    }
}

// ── Single URL Crawl ────────────────────────────────────

/**
 * Crawl a single URL and return its content (HTML + Markdown).
 * Falls back to a direct fetch if Crawl4AI is unavailable.
 */
export async function crawlUrl(url: string): Promise<CrawlResult> {
    try {
        const resp = await axios.post(
            `${CRAWL4AI_BASE_URL}/crawl`,
            { urls: [url], priority: 10 },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: CRAWL4AI_TIMEOUT,
            }
        );

        const results = resp.data?.results;
        if (results && results.length > 0) {
            const result = results[0];
            logger.info(`[Crawl4AI] Crawled ${url} — success: ${result.success}, markdown length: ${result.markdown?.length || 0}`);
            return result;
        }

        throw new Error('No results returned from Crawl4AI');
    } catch (err: any) {
        logger.warn(`[Crawl4AI] Failed to crawl ${url}: ${err.message}`);

        // Fallback: direct fetch
        return await directFetchFallback(url);
    }
}

// ── Batch URL Crawl ─────────────────────────────────────

/**
 * Crawl multiple URLs. Each URL is crawled individually to isolate failures.
 */
export async function crawlUrls(urls: string[]): Promise<CrawlResult[]> {
    return Promise.all(urls.map(url => crawlUrl(url)));
}

// ── Google Search via Crawl4AI ──────────────────────────

/**
 * Search Google by crawling the SERP page and extracting organic results.
 * This replaces the Apify Google Search Scraper.
 */
export async function searchGoogle(query: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.google.com/search?q=${encodedQuery}&num=${maxResults}&hl=en`;

    try {
        const result = await crawlUrl(searchUrl);

        if (!result.success || !result.html) {
            logger.warn('[Crawl4AI] Google search crawl failed, returning empty results');
            return [];
        }

        // Parse organic results from the HTML
        return parseGoogleResults(result.html, maxResults);
    } catch (err: any) {
        logger.warn(`[Crawl4AI] Google search failed: ${err.message}`);
        return [];
    }
}

// ── Google SERP Parser ──────────────────────────────────

/**
 * Parse Google search results from raw HTML.
 * Extracts titles, URLs, and snippets from organic results.
 */
function parseGoogleResults(html: string, maxResults: number): GoogleSearchResult[] {
    const results: GoogleSearchResult[] = [];

    // Strategy 1: Look for result blocks with <a> tags pointing to external sites
    // Google wraps organic results in <div class="g"> or similar containers
    // Each result has an <a href="..."> with the URL and an <h3> with the title

    // Extract all href links that look like organic results
    const linkRegex = /<a[^>]+href="\/url\?q=([^"&]+)[^"]*"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null && results.length < maxResults) {
        const url = decodeURIComponent(match[1]);
        const title = match[2].replace(/<[^>]*>/g, '').trim();

        if (url && title && url.startsWith('http')) {
            results.push({ title, url, snippet: '' });
        }
    }

    // Strategy 2: If Strategy 1 found nothing, try direct href extraction
    if (results.length === 0) {
        // Look for links in result containers
        const directLinkRegex = /<a[^>]+href="(https?:\/\/(?!www\.google\.|accounts\.google\.|support\.google\.|maps\.google\.)[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/gi;

        while ((match = directLinkRegex.exec(html)) !== null && results.length < maxResults) {
            const url = match[1];
            const title = match[2].replace(/<[^>]*>/g, '').trim();

            if (url && title) {
                results.push({ title, url, snippet: '' });
            }
        }
    }

    // Strategy 3: If still nothing, try extracting from markdown
    // (Crawl4AI converts pages to markdown which may be easier to parse)
    if (results.length === 0) {
        // Try to find markdown-style links: [title](url)
        const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/(?!www\.google\.|accounts\.google\.)[^\)]+)\)/g;

        while ((match = mdLinkRegex.exec(html)) !== null && results.length < maxResults) {
            const title = match[1].trim();
            const url = match[2];

            if (url && title && title.length > 5) {
                results.push({ title, url, snippet: '' });
            }
        }
    }

    // Extract snippets: look for <span> blocks near each result
    // This is best-effort — snippets from Google SERP are tricky
    const snippetRegex = /<span[^>]*class="[^"]*(?:st|aCOpRe|VwiC3b)[^"]*"[^>]*>([\s\S]*?)<\/span>/gi;
    let snippetIdx = 0;
    while ((match = snippetRegex.exec(html)) !== null && snippetIdx < results.length) {
        const snippet = match[1].replace(/<[^>]*>/g, '').trim();
        if (snippet.length > 20) {
            results[snippetIdx].snippet = snippet;
            snippetIdx++;
        }
    }

    logger.info(`[Crawl4AI] Parsed ${results.length} Google search results`);
    return results;
}

// ── Direct Fetch Fallback ───────────────────────────────

/**
 * Fallback scraper using Node.js native fetch.
 * Used when Crawl4AI sidecar/Docker is unavailable.
 */
async function directFetchFallback(url: string): Promise<CrawlResult> {
    logger.info(`[Crawl4AI] Falling back to direct fetch for: ${url}`);
    try {
        const resp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!resp.ok) {
            throw new Error(`Direct fetch failed: ${resp.status} ${resp.statusText}`);
        }

        const html = await resp.text();
        logger.info(`[Crawl4AI] Direct fetch success for ${url}. HTML length: ${html.length}`);

        return {
            url,
            html: html.substring(0, 50000),
            markdown: '', // No markdown conversion in direct fetch
            success: true,
            status_code: resp.status,
        };
    } catch (err: any) {
        logger.warn(`[Crawl4AI] Direct fetch also failed for ${url}: ${err.message}`);
        return {
            url,
            html: '',
            markdown: '',
            success: false,
            error: err.message,
            status_code: 0,
        };
    }
}
