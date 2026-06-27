import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { fetchWithFallback } from '../utils/fetchWithFallback';
import vatRates from '../data/vatRates.json';
import Anthropic from '@anthropic-ai/sdk';


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

        const scrapingdogKey = process.env.SCRAPINGDOG_API_KEY;
        console.log(`[Prefill] URL: ${url} | scrapingdogKey: ${scrapingdogKey ? `SET (${scrapingdogKey.length} chars)` : 'MISSING'}`);

        // ── Helper: scrape HTML from a URL (multi-tier strategy) ──
        async function scrapeHtml(targetUrl: string): Promise<string> {
            // Tier 1: Try Scrapingdog if key is available
            if (scrapingdogKey) {
                try {
                    console.log('[Prefill] Trying Scrapingdog for: ' + targetUrl);
                    const scrapeResp = await axios.get('https://api.scrapingdog.com/scrape', {
                        params: {
                            api_key: scrapingdogKey,
                            url: targetUrl,
                            dynamic: 'false',
                        },
                        timeout: 20000,
                    });

                    // Check if Scrapingdog returned an error response
                    const respData = scrapeResp.data;
                    if (typeof respData === 'object' && respData.success === false) {
                        throw new Error(`Scrapingdog error: ${respData.message || 'limit reached'}`);
                    }

                    const html = typeof respData === 'string'
                        ? respData.substring(0, 15000)
                        : JSON.stringify(respData).substring(0, 15000);
                    console.log('[Prefill] Scrapingdog success. HTML length: ' + html.length);
                    return html;
                } catch (sdError: any) {
                    console.warn('[Prefill] Scrapingdog failed:', sdError.message || 'Unknown error');
                    // Fall through to Tier 2
                }
            }

            // Tier 2: Direct fetch (works for most public pages that don't require JS)
            console.log('[Prefill] Trying direct fetch for: ' + targetUrl);
            const fetchResp = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: AbortSignal.timeout(15000),
            });

            if (!fetchResp.ok) {
                throw new Error(`Direct fetch failed: ${fetchResp.status} ${fetchResp.statusText}`);
            }

            const html = await fetchResp.text();
            const trimmed = html.substring(0, 15000);
            console.log('[Prefill] Direct fetch success. HTML length: ' + trimmed.length);
            return trimmed;
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

        const apifyToken = process.env.APIFY_API_TOKEN;
        const fallback = {
            success: false as const,
            fallback: true as const,
            message: 'Competitor discovery unavailable — add competitors manually.',
        };

        if (!apifyToken || !keyword) {
            return reply.send(fallback);
        }

        const result = await fetchWithFallback(async () => {
            const geoModifier = geography && geography !== 'US' && geography !== 'United States'
                ? geography : '';
            const query = `${keyword} ${category} pricing competitors ${geoModifier}`.trim();

            const resp = await axios.post(
                'https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items',
                {
                    queries: query,
                    maxPagesPerQuery: 1,
                    resultsPerPage: 10,
                },
                {
                    params: { token: apifyToken },
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000, // Apify can be slow
                }
            );

            const organicResults = resp.data?.[0]?.organicResults || resp.data || [];

            // Filter out noise (Wikipedia, Reddit, news, user's own domain)
            const EXCLUDE_DOMAINS = ['wikipedia.org', 'reddit.com', 'youtube.com', 'news.', 'blog.'];
            const competitors = organicResults
                .filter((r: any) => {
                    const url = (r.url || r.link || '').toLowerCase();
                    return url && !EXCLUDE_DOMAINS.some(d => url.includes(d));
                })
                .slice(0, perms.maxCompetitors)
                .map((r: any) => ({
                    name: r.title || extractRootDomain(r.url || r.link),
                    url: r.url || r.link,
                    snippet: r.description || r.snippet || '',
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

        const scrapingdogKey = process.env.SCRAPINGDOG_API_KEY;
        if (!scrapingdogKey || !urls || urls.length === 0) {
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

        // Scrape + extract in parallel (per URL)
        const results = await Promise.all(
            cappedUrls.map(async (url) => {
                return fetchWithFallback(async () => {
                    // Step 1: Scrape (Scrapingdog → direct fetch fallback)
                    let textContent = '';
                    let scraped = false;

                    if (scrapingdogKey) {
                        try {
                            const scrapeResp = await axios.get('https://api.scrapingdog.com/scrape', {
                                params: { api_key: scrapingdogKey, url, dynamic: 'false' },
                                timeout: 20000,
                            });
                            const respData = scrapeResp.data;
                            if (typeof respData === 'object' && respData.success === false) {
                                throw new Error(`Scrapingdog error: ${respData.message}`);
                            }
                            textContent = typeof respData === 'string' ? respData : JSON.stringify(respData);
                            scraped = true;
                        } catch (sdErr: any) {
                            console.warn(`[ScrapePrice] Scrapingdog failed for ${url}:`, sdErr.message);
                        }
                    }

                    if (!scraped) {
                        // Fallback: direct fetch
                        const fetchResp = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            },
                            signal: AbortSignal.timeout(15000),
                        });
                        if (!fetchResp.ok) throw new Error(`Direct fetch failed: ${fetchResp.status}`);
                        textContent = await fetchResp.text();
                    }

                    // Strip HTML tags, keep text
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
