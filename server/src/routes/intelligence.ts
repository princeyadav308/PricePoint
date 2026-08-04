import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { fetchWithFallback } from '../utils/fetchWithFallback';
import vatRates from '../data/vatRates.json';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';
import { crawlUrl, searchGoogle } from '../utils/crawl4ai';


// ============================================================
// Rate Limiters (in-memory)
// ============================================================
const ipDailyLimiter = new RateLimiterMemory({
    points: parseInt(process.env.INTELLIGENCE_CALLS_PER_IP_PER_DAY || '20', 10),
    duration: 86400, // 24 hours
    keyPrefix: 'intel_ip_daily',
});

const sessionScrapeLimiter = new RateLimiterMemory({
    points: parseInt(process.env.MAX_COMPETITOR_SCRAPES || '5', 10),
    duration: 3600, // 1 hour per session
    keyPrefix: 'intel_scrape_session',
});

const sessionDemandLimiter = new RateLimiterMemory({
    points: 3,
    duration: 3600,
    keyPrefix: 'intel_demand_session',
});

const sessionPreFillLimiter = new RateLimiterMemory({
    points: 10,
    duration: 3600,
    keyPrefix: 'intel_prefill_session',
});

// ============================================================
// Lazy Claude client (reuse from parent scope if available)
// ============================================================
let _claude: Anthropic | null = null;
const getClaude = () => {
    if (!_claude) {
        _claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    }
    return _claude;
};

// ============================================================
// Tier-based gating helper
// ============================================================
type ReportTier = 'basic' | 'founder_ready' | 'investor_grade';

const TIER_PERMISSIONS: Record<ReportTier, {
    competitorScraping: boolean;
    demandData: boolean;
    preFill: boolean;
    geolocate: boolean;
    maxCompetitors: number;
}> = {
    basic: {
        competitorScraping: false,
        demandData: false,
        preFill: true,
        geolocate: true,
        maxCompetitors: 0,
    },
    founder_ready: {
        competitorScraping: true,
        demandData: true,
        preFill: true,
        geolocate: true,
        maxCompetitors: 3,
    },
    investor_grade: {
        competitorScraping: true,
        demandData: true,
        preFill: true,
        geolocate: true,
        maxCompetitors: 5,
    },
};

function getTierPermissions(tier?: string) {
    const key = (tier || 'basic') as ReportTier;
    return TIER_PERMISSIONS[key] || TIER_PERMISSIONS.basic;
}

// ============================================================
// URL utility: extract root domain, dedup, reject user domain
// ============================================================
function extractRootDomain(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        // strip www. and return root domain
        return hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return url.toLowerCase();
    }
}

function deduplicateAndFilter(urls: string[], userDomain?: string): string[] {
    const seenDomains = new Set<string>();
    const filtered: string[] = [];
    const userRoot = userDomain ? extractRootDomain(userDomain) : null;

    for (const url of urls) {
        const root = extractRootDomain(url);
        // Skip user's own domain
        if (userRoot && root === userRoot) continue;
        // Skip duplicates by root domain
        if (seenDomains.has(root)) continue;
        seenDomains.add(root);
        filtered.push(url);
    }
    return filtered;
}

// ============================================================
// IP extraction helper
// ============================================================
function getClientIp(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return ip.trim();
    }
    return request.ip || '127.0.0.1';
}

// ============================================================
// ROUTE PLUGIN
// ============================================================
export default async function intelligenceRoutes(server: FastifyInstance) {

    // ── IP rate limit preHandler ─────────────────────────────
    const ipRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
        const ip = getClientIp(request);
        try {
            await ipDailyLimiter.consume(ip);
        } catch {
            return reply.status(429).send({
                success: false,
                fallback: true,
                message: 'Daily intelligence limit reached. Please try again tomorrow.',
            });
        }
    };

    // ══════════════════════════════════════════════════════════
    // 1. GET /api/intelligence/geolocate
    // ══════════════════════════════════════════════════════════
    server.get('/api/intelligence/geolocate', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const apiKey = process.env.ABSTRACTAPI_GEOLOCATION_KEY;
        const ip = getClientIp(request);

        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Geolocation unavailable — please select your country manually.',
        };

        if (!apiKey) {
            return reply.send(fallback);
        }

        const result = await fetchWithFallback(async () => {
            const resp = await axios.get('https://ipgeolocation.abstractapi.com/v1/', {
                params: { api_key: apiKey, ip_address: ip === '127.0.0.1' ? undefined : ip },
            });
            const d = resp.data;
            const countryCode = d.country_code || '';
            const suggestedVatRate = (vatRates as Record<string, number>)[countryCode] ?? 0;

            return {
                success: true as const,
                data: {
                    country: d.country || '',
                    countryCode,
                    currency: d.currency?.currency_code || '',
                    suggestedVatRate,
                    timezone: d.timezone?.name || '',
                },
            };
        }, fallback);

        return reply.send(result);
    });

    // ══════════════════════════════════════════════════════════
    // 2. POST /api/intelligence/prefill-product
    // ══════════════════════════════════════════════════════════
    server.post('/api/intelligence/prefill-product', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const { url, productName } = request.body as { url?: string; productName?: string };
        const sessionId = (request.body as any).sessionId || getClientIp(request);

        // Rate limit pre-fill attempts
        try {
            await sessionPreFillLimiter.consume(sessionId);
        } catch {
            return reply.send({
                success: false, fallback: true,
                message: 'Pre-fill limit reached for this session.',
            });
        }

        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Could not analyze the product — please enter details manually.',
        };

        if (!url && !productName) {
            return reply.send(fallback);
        }

        logger.info(`[Prefill] Processing URL: ${url}`);

        // ── Helper: scrape HTML from a URL (Crawl4AI with direct-fetch fallback) ──
        async function scrapeHtml(targetUrl: string): Promise<string> {
            logger.info(`[Prefill] Crawling via Crawl4AI: ${targetUrl}`);
            const result = await crawlUrl(targetUrl);

            if (result.success && result.html) {
                const html = result.html.substring(0, 15000);
                logger.info(`[Prefill] Crawl4AI success. HTML length: ${html.length}`);
                return html;
            }

            // crawlUrl already includes a direct-fetch fallback internally,
            // so if we get here, both Crawl4AI and direct fetch failed
            throw new Error(`All fetch methods failed for ${targetUrl}`);
        }

        // ── Helper: send HTML to Claude for extraction ──
        async function extractWithClaude(htmlContent: string, sourceUrl: string) {
            const claude = getClaude();
            const extraction = await claude.messages.create({
                model: 'claude-sonnet-4-6',
                max_tokens: 1000,
                temperature: 0,
                messages: [{
                    role: 'user',
                    content: `You are a product intelligence extractor. Given the following HTML from a product website, extract and return ONLY a JSON object with these fields:
{
  "productName": string,
  "productDescription": string (2-3 sentences max, plain text),
  "productCategory": string (one of: "Physical Product", "Service", "Digital Product"),
  "productSubCategory": string (e.g. "SaaS Analytics", "E-commerce", "Consulting"),
  "targetCustomer": string (1 sentence),
  "geographyServed": string,
  "uniqueValueProp": string (1 sentence)
}
If a field cannot be determined, return null for that field. Return ONLY valid JSON.

HTML:
${htmlContent}`
                }],
            });

            const textBlock = extraction.content[0];
            const rawText = textBlock.type === 'text' ? textBlock.text : '{}';
            console.log('[Prefill] Claude extraction done. Raw text length: ' + rawText.length);

            let parsed;
            try {
                const jsonStart = rawText.indexOf('{');
                const jsonEnd = rawText.lastIndexOf('}');
                parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
            } catch {
                parsed = {};
            }

            return {
                success: true as const,
                data: {
                    productName: parsed.productName || null,
                    description: parsed.productDescription || null,
                    category: parsed.productCategory || null,
                    subCategory: parsed.productSubCategory || null,
                    targetCustomer: parsed.targetCustomer || null,
                    geographyServed: parsed.geographyServed || null,
                    valueUsp: parsed.uniqueValueProp || null,
                    sourceUrl: sourceUrl,
                },
            };
        }

        // If URL provided, scrape + extract
        if (url) {
            console.log('[Prefill] Starting scrape+Claude chain for: ' + url);
            const result = await fetchWithFallback(async () => {
                const htmlContent = await scrapeHtml(url);
                return await extractWithClaude(htmlContent, url);
            }, fallback, 60000); // 60s timeout for scrape+Claude chain

            return reply.send(result);
        }

        // If only product name provided (no URL), return minimal data
        if (productName) {
            return reply.send({
                success: true,
                data: {
                    productName,
                    description: null,
                    category: null,
                    subCategory: null,
                    targetCustomer: null,
                    geographyServed: null,
                    valueUsp: null,
                    sourceUrl: null,
                },
            });
        }

        return reply.send(fallback);
    });

    // ══════════════════════════════════════════════════════════
    // 3. POST /api/intelligence/competitors
    // ══════════════════════════════════════════════════════════
    server.post('/api/intelligence/competitors', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const { keyword, category, geography, tier } = request.body as {
            keyword: string; category: string; geography: string; tier?: string;
        };

        // Tier gating — basic tier users still get the endpoint (no error),
        // but with an empty list indicating the feature isn't available at their tier
        const perms = getTierPermissions(tier);
        if (!perms.competitorScraping) {
            return reply.send({
                success: true,
                data: {
                    competitors: [],
                    tierLimited: true,
                    message: 'Competitor discovery is available on Founder Ready and Investor Grade tiers.',
                },
            });
        }

        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Competitor discovery unavailable — add competitors manually.',
        };

        if (!keyword) {
            return reply.send(fallback);
        }

        const result = await fetchWithFallback(async () => {
            const geoModifier = geography && geography !== 'US' && geography !== 'United States'
                ? geography : '';
            const query = `${keyword} ${category} pricing competitors ${geoModifier}`.trim();

            // Use Crawl4AI to crawl Google search results (replaces Apify)
            const searchResults = await searchGoogle(query, 10);

            // Filter out noise (Wikipedia, Reddit, news, user's own domain)
            const EXCLUDE_DOMAINS = ['wikipedia.org', 'reddit.com', 'youtube.com', 'news.', 'blog.'];
            const competitors = searchResults
                .filter((r) => {
                    const url = (r.url || '').toLowerCase();
                    return url && !EXCLUDE_DOMAINS.some(d => url.includes(d));
                })
                .slice(0, perms.maxCompetitors)
                .map((r) => ({
                    name: r.title || extractRootDomain(r.url),
                    url: r.url,
                    snippet: r.snippet || '',
                    priceFound: null,
                }));

            return {
                success: true as const,
                data: { competitors },
            };
        }, fallback);

        return reply.send(result);
    });

    // ══════════════════════════════════════════════════════════
    // 4. POST /api/intelligence/scrape-pricing
    // ══════════════════════════════════════════════════════════
    server.post('/api/intelligence/scrape-pricing', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const { urls, tier, userDomain, sessionId } = request.body as {
            urls: string[]; tier?: string; userDomain?: string; sessionId?: string;
        };

        // Tier gating
        const perms = getTierPermissions(tier);
        if (!perms.competitorScraping) {
            return reply.send({
                success: true,
                data: {
                    results: [],
                    tierLimited: true,
                    message: 'Competitor pricing scraping is available on Founder Ready and Investor Grade tiers.',
                },
            });
        }

        if (!urls || urls.length === 0) {
            return reply.send({
                success: false, fallback: true,
                message: 'Price scraping unavailable — enter competitor prices manually.',
            });
        }

        // URL deduplication & user-domain rejection
        const cleanedUrls = deduplicateAndFilter(urls, userDomain);
        const cappedUrls = cleanedUrls.slice(0, perms.maxCompetitors);

        // Session-level rate limit for scraping
        const limiterKey = sessionId || getClientIp(request);
        try {
            await sessionScrapeLimiter.consume(limiterKey, cappedUrls.length);
        } catch {
            return reply.send({
                success: false, fallback: true,
                message: 'Scraping limit reached for this session.',
            });
        }

        // Scrape + extract in parallel (per URL) using Crawl4AI
        const results = await Promise.all(
            cappedUrls.map(async (url) => {
                return fetchWithFallback(async () => {
                    // Step 1: Scrape via Crawl4AI (includes direct-fetch fallback)
                    const crawlResult = await crawlUrl(url);

                    let textContent = '';
                    if (crawlResult.success) {
                        // Prefer markdown (cleaner for LLM extraction), fall back to HTML
                        textContent = crawlResult.markdown || crawlResult.html || '';
                    }

                    if (!textContent) {
                        throw new Error(`Failed to scrape content from ${url}`);
                    }

                    // Strip HTML tags if we got HTML, keep text
                    textContent = textContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 12000);

                    // Step 2: Claude extraction
                    const claude = getClaude();
                    const extraction = await claude.messages.create({
                        model: 'claude-sonnet-4-6',
                        max_tokens: 1000,
                        temperature: 0,
                        messages: [{
                            role: 'user',
                            content: `You are a pricing intelligence extractor. From the following webpage text, find all pricing information and return ONLY this JSON:
{
  "plans": [
    {
      "name": string (plan name, e.g. "Starter", "Pro", "Enterprise"),
      "price": number (numeric value only, no symbols),
      "currency": string (3-letter ISO code, e.g. "USD"),
      "billingCycle": "monthly" | "annual" | "one-time" | "unknown",
      "isPerSeat": boolean,
      "keyFeatures": [string] (max 3 features)
    }
  ],
  "hasFreeTrialOrFreeTier": boolean,
  "pricingModelType": "flat" | "per-seat" | "usage-based" | "tiered" | "unknown",
  "websiteUrl": "${url}"
}
If no pricing found, return { "plans": [], "pricingNotFound": true }
Return ONLY valid JSON.

TEXT: ${textContent}`
                        }],
                    });

                    const textBlock = extraction.content[0];
                    const rawText = textBlock.type === 'text' ? textBlock.text : '{}';

                    let parsed;
                    try {
                        const jsonStart = rawText.indexOf('{');
                        const jsonEnd = rawText.lastIndexOf('}');
                        parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
                    } catch {
                        parsed = { plans: [], pricingNotFound: true };
                    }

                    return {
                        url,
                        plans: parsed.plans || [],
                        pricingModelType: parsed.pricingModelType || 'unknown',
                        hasFreeTrialOrFreeTier: parsed.hasFreeTrialOrFreeTier || false,
                        pricingNotFound: parsed.pricingNotFound || false,
                    };
                }, {
                    url,
                    plans: [],
                    pricingModelType: 'unknown',
                    hasFreeTrialOrFreeTier: false,
                    pricingNotFound: true,
                });
            })
        );

        return reply.send({ success: true, data: { results } });
    });

    // ══════════════════════════════════════════════════════════
    // 5. POST /api/intelligence/demand
    // ══════════════════════════════════════════════════════════
    server.post('/api/intelligence/demand', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const { keyword, country, tier, sessionId } = request.body as {
            keyword: string; country?: string; tier?: string; sessionId?: string;
        };

        // Tier gating
        const perms = getTierPermissions(tier);
        if (!perms.demandData) {
            return reply.send({
                success: true,
                data: {
                    keyword,
                    monthlySearchVolume: null,
                    competitionLevel: null,
                    costPerClick: null,
                    demandSignal: null,
                    demandInterpretation: 'Market demand data is available on Founder Ready and Investor Grade tiers.',
                    tierLimited: true,
                },
            });
        }

        const login = process.env.DATAFORSEO_LOGIN;
        const password = process.env.DATAFORSEO_PASSWORD;
        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Demand data unavailable — estimate your monthly volume manually.',
        };

        if (!login || !password || !keyword) {
            return reply.send(fallback);
        }

        // Session rate limit
        const limiterKey = sessionId || getClientIp(request);
        try {
            await sessionDemandLimiter.consume(limiterKey);
        } catch {
            return reply.send({
                success: false, fallback: true,
                message: 'Demand query limit reached for this session.',
            });
        }

        const result = await fetchWithFallback(async () => {
            const locationCode = country === 'India' ? 2356 :
                country === 'United Kingdom' ? 2826 :
                    country === 'Canada' ? 2124 :
                        country === 'Australia' ? 2036 : 2840; // default US

            const resp = await axios.post(
                'https://api.dataforseo.com/v3/keywords_data/google/search_volume/live',
                [{
                    keywords: [keyword],
                    location_code: locationCode,
                    language_code: 'en',
                }],
                {
                    auth: { username: login, password },
                    headers: { 'Content-Type': 'application/json' },
                }
            );

            const task = resp.data?.tasks?.[0];
            const item = task?.result?.[0];

            if (!item) throw new Error('No DataForSEO result');

            const volume = item.search_volume || 0;
            const competition = (item.competition || '').toUpperCase();
            const cpc = item.cpc || 0;

            // Derive demand signal
            let demandSignal: string;
            if (volume < 1000) demandSignal = 'Niche';
            else if (volume < 10000) demandSignal = 'Moderate';
            else demandSignal = 'Strong';

            const demandInterpretation = `${volume.toLocaleString()} monthly searches indicates ${demandSignal.toLowerCase()} market demand. ${cpc > 0 ? `CPC of $${cpc.toFixed(2)} ${cpc > 2 ? 'confirms strong' : 'suggests moderate'} commercial intent.` : ''}`;

            return {
                success: true as const,
                data: {
                    keyword,
                    monthlySearchVolume: volume,
                    competitionLevel: competition || null,
                    costPerClick: cpc,
                    demandSignal,
                    demandInterpretation,
                },
            };
        }, fallback);

        return reply.send(result);
    });

    // ══════════════════════════════════════════════════════════
    // 6. GET /api/intelligence/currency
    // ══════════════════════════════════════════════════════════
    server.get('/api/intelligence/currency', {
        preHandler: ipRateLimit,
    }, async (request, reply) => {
        const { base } = request.query as { base?: string };
        const baseCurrency = (base || 'USD').toUpperCase();

        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Currency rates unavailable.',
        };

        // Use ExchangeRate-API (free, no key required, 1500 calls/mo)
        const result = await fetchWithFallback(async () => {
            const resp = await axios.get(
                `https://open.er-api.com/v6/latest/${baseCurrency}`
            );

            if (resp.data?.result !== 'success') {
                throw new Error('ExchangeRate-API error');
            }

            return {
                success: true as const,
                data: {
                    base: baseCurrency,
                    rates: resp.data.rates || {},
                    timestamp: resp.data.time_last_update_utc || new Date().toISOString(),
                },
            };
        }, fallback);

        return reply.send(result);
    });
}
