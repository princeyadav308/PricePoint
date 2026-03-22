/**
 * fetchWithFallback — Generic async wrapper for external API calls.
 *
 * Golden Rule: Intelligence should enhance, never block.
 * Every external call gets a timeout + graceful fallback.
 */
export async function fetchWithFallback<T, F = T>(
    fetchFn: () => Promise<T>,
    fallback: F,
    timeoutMs: number = parseInt(process.env.INTELLIGENCE_TIMEOUT_MS || '10000', 10)
): Promise<T | F> {
    try {
        return await Promise.race([
            fetchFn(),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Intelligence timeout')), timeoutMs)
            ),
        ]);
    } catch (error) {
        const err = error as any;
        console.error('[Intelligence fallback triggered]', err.message);
        if (err.status) console.error('[Intelligence] API status:', err.status);
        if (err.response?.data) console.error('[Intelligence] Response data:', JSON.stringify(err.response.data).substring(0, 500));
        return fallback;
    }
}
