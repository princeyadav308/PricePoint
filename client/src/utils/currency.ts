// ============================================================
// Currency Utilities — Global currency symbol resolution
// ============================================================

/** Map from currency option label → symbol */
const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD ($)': '$',
    'EUR (€)': '€',
    'GBP (£)': '£',
    'INR (₹)': '₹',
    'CAD (C$)': 'C$',
    'AUD (A$)': 'A$',
};

/** Map from country → expected currency option label */
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    'United States': 'USD ($)',
    'United Kingdom': 'GBP (£)',
    'India': 'INR (₹)',
    'European Union': 'EUR (€)',
    'Canada': 'CAD (C$)',
    'Australia': 'AUD (A$)',
};

/**
 * Extract the currency symbol from a currency option label.
 * e.g. 'EUR (€)' → '€', 'INR (₹)' → '₹'
 * Falls back to '$' if not found.
 */
export function getCurrencySymbol(currencyLabel?: string | null): string {
    if (!currencyLabel) return '$';
    return CURRENCY_SYMBOLS[currencyLabel] ?? '$';
}

/**
 * Check if country and currency match.
 * Returns a warning message if they don't, or null if they match.
 */
export function getCountryCurrencyMismatchWarning(
    country?: string | null,
    currencyLabel?: string | null
): string | null {
    if (!country || !currencyLabel || country === 'Other') return null;

    const expectedCurrency = COUNTRY_CURRENCY_MAP[country];
    if (!expectedCurrency) return null;

    if (expectedCurrency !== currencyLabel) {
        const expectedSymbol = CURRENCY_SYMBOLS[expectedCurrency] ?? '';
        return `Businesses in ${country} typically use ${expectedCurrency.split(' ')[0]} (${expectedSymbol}). Your report will use ${currencyLabel.split(' ')[0]}.`;
    }

    return null;
}

/**
 * Get currency symbol from session answers.
 * Reads the 'currency' answer from the session store.
 */
export function getCurrencyFromAnswers(answers: Record<string, { value: unknown }>): string {
    const currencyAnswer = answers['currency']?.value;
    return getCurrencySymbol(currencyAnswer as string);
}
