/**
 * Report Version Constants and Documentation
 *
 * Manages template and Claude schema versions for cache invalidation.
 * Includes documentation for what triggers version bumps to prevent accidental cache staleness.
 */

/**
 * Template version for HTML-to-PDF template.
 *
 * Bump this when ANY of the following occurs:
 * - Changes to pdfTemplate.ts template structure (e.g., new sections, layout changes)
 * - Changes to Voya design system (font: Source Sans 3, colors: #E8672A/#367C8A)
 * - Changes to Puppeteer PDF generation options (margins, footer, headers, etc.)
 * - Addition of new SVG charts or visual elements
 * - Modification of page wrapper structure (pageStart/pageEnd functions)
 * - Changes to safety helper functions (txt(), num(), fmt(), fmtK(), arr(), esc())
 * - Changes to currency symbol extraction logic
 * - Changes to section numbering or naming (e.g., new tier-specific sections)
 *
 * Current value: 1
 */
export const CURRENT_TEMPLATE_VERSION = 1;

/**
 * Claude schema version for Claude AI narrative data.
 *
 * Bump this when ANY of the following occurs:
 * - Changes to claude.ts tier schema definitions (field additions/removals)
 * - Changes to required Claude prompt shape/structure
 * - Changes to narrative extraction format
 * - Changes to validation rules in reportValidator.ts
 *
 * This version allows template-only changes to reuse cached claudeData.
 * Current value: 1
 */
export const CURRENT_CLAUDE_SCHEMA_VERSION = 1;

/**
 * Generates a concise comment for use in logs/debug about why a PDF regeneration occurred.
 *
 * @param trigger - Description of what changed
 * @returns Human-readable explanation of regeneration reason
 */
export function regenerationReason(trigger: string): string {
    return `PDF regeneration triggered by: ${trigger}`;
}