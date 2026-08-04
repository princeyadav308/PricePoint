// ============================================================
// PricePoint — Puppeteer HTML-to-PDF Template
//
// Voya Design System: Source Sans 3, Orange/Teal palette.
// Tier-aware: Basic (4 pages) | Founder (6) | Investor (10+)
//
// Visual elements: Donut charts, horizontal bars, scatter plots,
// gauge meters, SVG stat icons, exhibit numbering, progress bars,
// comparison cards, pull quotes — matching Voya Investment template.
// ============================================================

// ── Voya Design Tokens ──────────────────────────────────────
const VOYA = {
    orange: '#E8672A',
    orangeLight: '#F4A261',
    teal: '#367C8A',
    tealLight: '#5BA4B0',
    dark: '#333333',
    gray: '#737373',
    lightGray: '#F5F5F5',
    tableHeader: '#666666',
    tableStripe: '#F7F7F7',
    white: '#FFFFFF',
    border: '#E0E0E0',
    red: '#EF4444',
    green: '#10B981',
    greenLight: '#6EE7B7',
    blue: '#3B82F6',
    purple: '#8B5CF6',
};

// ── Currency helper (server-side mirror of client util) ──────
const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD ($)': '$', 'EUR (€)': '€', 'GBP (£)': '£',
    'INR (₹)': '₹', 'CAD (C$)': 'C$', 'AUD (A$)': 'A$',
};
function getCurrencySymbol(answers: Record<string, any>): string {
    const raw = answers?.currency?.value;
    if (typeof raw === 'string' && CURRENCY_SYMBOLS[raw]) return CURRENCY_SYMBOLS[raw];
    return '$';
}

// ── Number / text safety helpers ────────────────────────────
const txt = (v: any, fallback = ''): string =>
    typeof v === 'string' && v.length > 0 ? v : fallback;
const num = (v: any, fallback = 0): number => {
    const n = Number(v); return isNaN(n) ? fallback : n;
};
const fmt = (n: any): string => {
    const v = Number(n); return isNaN(v) ? '0.00' : v.toFixed(2);
};
const fmtK = (n: any): string => {
    const v = Number(n);
    if (isNaN(v)) return '0';
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
    return v.toFixed(0);
};
const arr = (v: any): any[] => Array.isArray(v) ? v : [];
const esc = (s: string): string =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Smart Value Formatter (handles arrays, objects, primitives) ──
function formatAnswerValue(val: any, cs: string = ''): string {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
        // Array of objects with name/amount (e.g., ue_digital)
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
            return val.map((item: any) => {
                if (item.name && (item.amount !== undefined || item.cost !== undefined)) {
                    const amount = item.amount ?? item.cost ?? '';
                    return `${item.name}: ${cs}${Number(amount).toLocaleString()}`;
                }
                // Generic object in array
                return Object.entries(item)
                    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                    .join(', ');
            }).join(' | ');
        }
        // Simple array of primitives
        return val.join(', ');
    }
    if (typeof val === 'object') {
        // Plain object — format key: value pairs
        return Object.entries(val)
            .filter(([_, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)
            .join(' | ');
    }
    return String(val);
}

// ── Exhibit Counter ─────────────────────────────────────────
let exhibitCounter = 0;
function nextExhibit(title: string): string {
    exhibitCounter++;
    return `Exhibit ${exhibitCounter}: ${title}`;
}

// ── Source Reference Tracker ────────────────────────────────
let sourceReferences: string[] = [];
function trackSource(source: string): string {
    // Add to tracking array if not already present
    if (!sourceReferences.includes(source)) {
        sourceReferences.push(source);
    }
    const idx = sourceReferences.indexOf(source) + 1;
    return `<sup style="font-size:9px;color:${VOYA.gray};">[${idx}]</sup>`;
}

// ══════════════════════════════════════════════════════════════
// SVG ICON SYSTEM — Circular line icons for stat cards
// Matching Voya's "by the numbers" visual style
// ══════════════════════════════════════════════════════════════

function svgIcon(type: string, color: string = VOYA.teal, size: number = 44): string {
    const r = size / 2;
    const cx = r, cy = r;
    const iconStroke = color;
    const bgFill = color + '12'; // 7% opacity bg
    let inner = '';

    switch (type) {
        case 'dollar': // Price / currency
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <text x="${cx}" y="${cy + 6}" font-size="20" font-weight="700" fill="${iconStroke}" text-anchor="middle" font-family="Source Sans 3, sans-serif">$</text>`;
            break;
        case 'target': // Optimal / recommended
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="none" stroke="${iconStroke}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy}" r="${r * 0.25}" fill="${iconStroke}"/>`;
            break;
        case 'crown': // Premium
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <path d="M${cx - 9} ${cy + 5} L${cx - 7} ${cy - 5} L${cx - 2} ${cy} L${cx} ${cy - 7} L${cx + 2} ${cy} L${cx + 7} ${cy - 5} L${cx + 9} ${cy + 5} Z" fill="${iconStroke}" opacity="0.85"/>`;
            break;
        case 'calculator': // Cost base
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <rect x="${cx - 7}" y="${cy - 9}" width="14" height="18" rx="2" fill="none" stroke="${iconStroke}" stroke-width="1.2"/>
                <line x1="${cx - 5}" y1="${cy - 4}" x2="${cx + 5}" y2="${cy - 4}" stroke="${iconStroke}" stroke-width="1"/>
                <circle cx="${cx - 3}" cy="${cy + 1}" r="1" fill="${iconStroke}"/><circle cx="${cx + 3}" cy="${cy + 1}" r="1" fill="${iconStroke}"/>
                <circle cx="${cx - 3}" cy="${cy + 5}" r="1" fill="${iconStroke}"/><circle cx="${cx + 3}" cy="${cy + 5}" r="1" fill="${iconStroke}"/>`;
            break;
        case 'multiplier': // Value multiplier
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <text x="${cx}" y="${cy + 5}" font-size="16" font-weight="700" fill="${iconStroke}" text-anchor="middle" font-family="Source Sans 3, sans-serif">&times;</text>`;
            break;
        case 'gear': // Modifiers / settings
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <circle cx="${cx}" cy="${cy}" r="5" fill="none" stroke="${iconStroke}" stroke-width="1.5"/>
                <circle cx="${cx}" cy="${cy}" r="2" fill="${iconStroke}"/>`;
            for (let i = 0; i < 6; i++) {
                const angle = (i * 60) * Math.PI / 180;
                const x1 = cx + 5 * Math.cos(angle);
                const y1 = cy + 5 * Math.sin(angle);
                const x2 = cx + 8 * Math.cos(angle);
                const y2 = cy + 8 * Math.sin(angle);
                inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${iconStroke}" stroke-width="1.5"/>`;
            }
            break;
        case 'chart': // Analytics
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <polyline points="${cx - 8},${cy + 6} ${cx - 4},${cy - 2} ${cx + 1},${cy + 3} ${cx + 8},${cy - 6}" fill="none" stroke="${iconStroke}" stroke-width="1.5" stroke-linecap="round"/>`;
            break;
        case 'shield': // Risk / protection
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <path d="M${cx} ${cy - 9} L${cx + 8} ${cy - 4} L${cx + 8} ${cy + 3} Q${cx + 6} ${cy + 8} ${cx} ${cy + 10} Q${cx - 6} ${cy + 8} ${cx - 8} ${cy + 3} L${cx - 8} ${cy - 4} Z" fill="none" stroke="${iconStroke}" stroke-width="1.2"/>
                <polyline points="${cx - 3},${cy + 1} ${cx - 1},${cy + 3} ${cx + 4},${cy - 2}" fill="none" stroke="${iconStroke}" stroke-width="1.2" stroke-linecap="round"/>`;
            break;
        case 'rocket': // Growth / launch
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>
                <path d="M${cx} ${cy - 8} Q${cx + 6} ${cy - 2} ${cx + 2} ${cy + 6} L${cx} ${cy + 4} L${cx - 2} ${cy + 6} Q${cx - 6} ${cy - 2} ${cx} ${cy - 8} Z" fill="none" stroke="${iconStroke}" stroke-width="1.2"/>
                <circle cx="${cx}" cy="${cy - 2}" r="1.5" fill="${iconStroke}"/>`;
            break;
        default: // Generic circle
            inner = `<circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="${bgFill}" stroke="${iconStroke}" stroke-width="1.5"/>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ══════════════════════════════════════════════════════════════
// SVG CHART GENERATORS
// ══════════════════════════════════════════════════════════════

// ── Vertical Bar Chart ──────────────────────────────────────
function generateBarChartSVG(labels: string[], values: number[], highlightIndex?: number): string {
    if (!labels?.length || !values?.length) return '';
    const W = 520, H = 220;
    const pad = { top: 20, right: 25, bottom: 45, left: 70 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const maxVal = Math.max(...values, 1);
    const barW = Math.min(42, (cW / labels.length) * 0.6);
    const gap = cW / labels.length;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    // Background
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}" fill="${VOYA.lightGray}" rx="2"/>`;
    // Grid lines
    for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const y = pad.top + cH * (1 - frac);
        svg += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${VOYA.border}" stroke-width="0.5"/>`;
        svg += `<text x="${pad.left - 8}" y="${y + 4}" font-size="11" fill="${VOYA.gray}" text-anchor="end" font-family="Source Sans 3, sans-serif">${fmtK(maxVal * frac)}</text>`;
    }
    // Bars with rounded tops
    values.forEach((val, i) => {
        const barH = (val / maxVal) * cH;
        const x = pad.left + i * gap + (gap - barW) / 2;
        const y = pad.top + cH - barH;
        const fill = highlightIndex === i ? VOYA.orange : VOYA.teal;
        // Shadow
        svg += `<rect x="${x + 2}" y="${y + 2}" width="${barW}" height="${barH}" fill="#00000010" rx="3"/>`;
        // Bar
        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${fill}" rx="3"/>`;
        // Gradient overlay for depth
        svg += `<rect x="${x}" y="${y}" width="${barW * 0.4}" height="${barH}" fill="#FFFFFF15" rx="3"/>`;
        // Value label
        svg += `<text x="${x + barW / 2}" y="${y - 6}" font-size="12" fill="${VOYA.dark}" text-anchor="middle" font-weight="600" font-family="Source Sans 3, sans-serif">${fmtK(val)}</text>`;
        // Category label
        svg += `<text x="${x + barW / 2}" y="${pad.top + cH + 18}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${esc(String(labels[i] || '').substring(0, 14))}</text>`;
    });
    // Axis
    svg += `<line x1="${pad.left}" y1="${pad.top + cH}" x2="${W - pad.right}" y2="${pad.top + cH}" stroke="${VOYA.dark}" stroke-width="1"/>`;
    svg += '</svg>';
    return svg;
}

// ── Waterfall Chart ─────────────────────────────────────────
function generateWaterfallSVG(labels: string[], values: number[]): string {
    if (!labels?.length || !values?.length) return '';
    const W = 520, H = 220;
    const pad = { top: 20, right: 25, bottom: 45, left: 70 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    let cumulative = 0;
    const segments = values.map((val, i) => {
        const isLast = i === values.length - 1;
        const start = isLast ? 0 : cumulative;
        const end = isLast ? val : cumulative + val;
        if (!isLast) cumulative += val;
        return { start, end, value: val, isPositive: val >= 0, isLast };
    });
    const allY = segments.flatMap(s => [s.start, s.end]);
    const minY = Math.min(0, ...allY);
    const maxY = Math.max(1, ...allY);
    const range = maxY - minY;
    const barW = Math.min(44, (cW / labels.length) * 0.6);
    const gap = cW / labels.length;
    const yScale = (v: number) => pad.top + cH - ((v - minY) / range) * cH;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}" fill="${VOYA.lightGray}" rx="2"/>`;
    for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const val = minY + range * frac;
        const y = yScale(val);
        svg += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${VOYA.border}" stroke-width="0.5"/>`;
        svg += `<text x="${pad.left - 8}" y="${y + 4}" font-size="11" fill="${VOYA.gray}" text-anchor="end" font-family="Source Sans 3, sans-serif">${fmtK(val)}</text>`;
    }
    segments.forEach((seg, i) => {
        const x = pad.left + i * gap + (gap - barW) / 2;
        const yTop = yScale(Math.max(seg.start, seg.end));
        const yBot = yScale(Math.min(seg.start, seg.end));
        const barH = Math.max(1, yBot - yTop);
        const fill = seg.isLast ? VOYA.teal : seg.isPositive ? VOYA.orange : VOYA.red;
        svg += `<rect x="${x}" y="${yTop}" width="${barW}" height="${barH}" fill="${fill}" rx="3"/>`;
        svg += `<text x="${x + barW / 2}" y="${yTop - 6}" font-size="12" fill="${VOYA.dark}" text-anchor="middle" font-weight="600" font-family="Source Sans 3, sans-serif">${fmtK(Math.abs(seg.value))}</text>`;
        svg += `<text x="${x + barW / 2}" y="${pad.top + cH + 18}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${esc(String(labels[i] || '').substring(0, 14))}</text>`;
        // Connector line to next
        if (i < segments.length - 1 && !segments[i + 1].isLast) {
            const connY = yScale(seg.end);
            const nextX = pad.left + (i + 1) * gap + (gap - barW) / 2;
            svg += `<line x1="${x + barW}" y1="${connY}" x2="${nextX}" y2="${connY}" stroke="${VOYA.gray}" stroke-width="0.8" stroke-dasharray="3,2"/>`;
        }
    });
    svg += `<line x1="${pad.left}" y1="${yScale(0)}" x2="${W - pad.right}" y2="${yScale(0)}" stroke="${VOYA.dark}" stroke-width="1"/>`;
    svg += '</svg>';
    return svg;
}

// ── Multi-Line Revenue Chart ────────────────────────────────
function generateRevenueChartSVG(labels: string[], conservative: number[], baseCase: number[], optimistic: number[]): string {
    if (!labels?.length || !conservative?.length) return '';
    const W = 520, H = 240;
    const pad = { top: 20, right: 130, bottom: 45, left: 70 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const allVals = [...(conservative || []), ...(baseCase || []), ...(optimistic || [])];
    const maxVal = Math.max(...allVals, 1);
    const stepX = cW / Math.max(labels.length - 1, 1);
    const xPos = (i: number) => pad.left + i * stepX;
    const yPos = (val: number) => pad.top + cH - (val / maxVal) * cH;

    const drawArea = (data: number[], color: string) => {
        if (!data?.length) return '';
        let s = `<path d="M${xPos(0)} ${yPos(data[0])}`;
        for (let i = 1; i < data.length; i++) s += ` L${xPos(i)} ${yPos(data[i])}`;
        s += ` L${xPos(data.length - 1)} ${pad.top + cH} L${xPos(0)} ${pad.top + cH} Z" fill="${color}" opacity="0.08"/>`;
        return s;
    };

    const drawLine = (data: number[], color: string, width: number = 2) => {
        if (!data?.length) return '';
        let s = '';
        // Draw smooth path
        s += `<path d="M${xPos(0)} ${yPos(data[0])}`;
        for (let i = 1; i < data.length; i++) s += ` L${xPos(i)} ${yPos(data[i])}`;
        s += `" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
        // End dot
        const lastI = data.length - 1;
        s += `<circle cx="${xPos(lastI)}" cy="${yPos(data[lastI])}" r="3.5" fill="${color}"/>`;
        return s;
    };

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}" fill="${VOYA.lightGray}" rx="2"/>`;
    for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const y = pad.top + cH * (1 - frac);
        svg += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${VOYA.border}" stroke-width="0.5"/>`;
        svg += `<text x="${pad.left - 8}" y="${y + 4}" font-size="11" fill="${VOYA.gray}" text-anchor="end" font-family="Source Sans 3, sans-serif">${fmtK(maxVal * frac)}</text>`;
    }
    // Area fills
    svg += drawArea(optimistic, VOYA.orange);
    svg += drawArea(baseCase, VOYA.teal);
    svg += drawArea(conservative, VOYA.gray);
    // Lines
    svg += drawLine(conservative, VOYA.gray, 1.5);
    svg += drawLine(baseCase, VOYA.teal, 2.5);
    svg += drawLine(optimistic, VOYA.orange, 2);
    // X labels
    labels.forEach((label, i) => {
        svg += `<text x="${xPos(i)}" y="${pad.top + cH + 18}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${esc(label)}</text>`;
    });
    // Legend box
    const lx = W - 120;
    svg += `<rect x="${lx - 8}" y="${pad.top}" width="120" height="68" fill="${VOYA.white}" rx="4" stroke="${VOYA.border}" stroke-width="0.5"/>`;
    svg += `<text x="${lx}" y="${pad.top + 14}" font-size="11" fill="${VOYA.dark}" font-weight="600" font-family="Source Sans 3, sans-serif">Legend</text>`;
    svg += `<line x1="${lx + 2}" y1="${pad.top + 28}" x2="${lx + 18}" y2="${pad.top + 28}" stroke="${VOYA.orange}" stroke-width="2.5"/><circle cx="${lx + 18}" cy="${pad.top + 28}" r="2.5" fill="${VOYA.orange}"/>`;
    svg += `<text x="${lx + 24}" y="${pad.top + 31}" font-size="10" fill="${VOYA.gray}" font-family="Source Sans 3, sans-serif">Optimistic</text>`;
    svg += `<line x1="${lx + 2}" y1="${pad.top + 42}" x2="${lx + 18}" y2="${pad.top + 42}" stroke="${VOYA.teal}" stroke-width="2.5"/><circle cx="${lx + 18}" cy="${pad.top + 42}" r="2.5" fill="${VOYA.teal}"/>`;
    svg += `<text x="${lx + 24}" y="${pad.top + 45}" font-size="10" fill="${VOYA.gray}" font-family="Source Sans 3, sans-serif">Base Case</text>`;
    svg += `<line x1="${lx + 2}" y1="${pad.top + 56}" x2="${lx + 18}" y2="${pad.top + 56}" stroke="${VOYA.gray}" stroke-width="1.5"/>`;
    svg += `<text x="${lx + 24}" y="${pad.top + 59}" font-size="10" fill="${VOYA.gray}" font-family="Source Sans 3, sans-serif">Conservative</text>`;
    svg += `<line x1="${pad.left}" y1="${pad.top + cH}" x2="${W - pad.right}" y2="${pad.top + cH}" stroke="${VOYA.dark}" stroke-width="1"/>`;
    svg += '</svg>';
    return svg;
}

// ── Van Westendorp Price Sensitivity ────────────────────────
function generateVanWestendorpSVG(vw: any, cs: string): string {
    if (!vw) return '';
    const points = [
        { label: 'Floor (OPP)', value: num(vw.opp || vw.floor) },
        { label: 'IPP', value: num(vw.ipp) },
        { label: 'PMC', value: num(vw.pmc) },
        { label: 'Ceiling (PME)', value: num(vw.pme || vw.ceiling) },
    ].filter(p => p.value > 0);
    if (points.length === 0) return '';

    const W = 520, H = 120;
    const pad = { left: 40, right: 40 };
    const usable = W - pad.left - pad.right;
    const min = Math.min(...points.map(p => p.value)) * 0.85;
    const max = Math.max(...points.map(p => p.value)) * 1.15;
    const range = max - min || 1;
    const xPos = (v: number) => pad.left + ((v - min) / range) * usable;
    const colors = [VOYA.green, VOYA.teal, VOYA.orange, VOYA.red];

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    // Background track
    if (points.length >= 2) {
        const x1 = xPos(points[0].value);
        const x2 = xPos(points[points.length - 1].value);
        svg += `<rect x="${x1}" y="46" width="${x2 - x1}" height="8" fill="${VOYA.border}" rx="4"/>`;
        // Gradient fill for optimal zone
        if (points.length >= 3) {
            const zx1 = xPos(points[1].value);
            const zx2 = xPos(points[points.length > 3 ? 2 : points.length - 1].value);
            svg += `<rect x="${zx1}" y="44" width="${zx2 - zx1}" height="12" fill="${VOYA.teal}" opacity="0.2" rx="6"/>`;
            svg += `<text x="${(zx1 + zx2) / 2}" y="40" font-size="10" fill="${VOYA.teal}" text-anchor="middle" font-weight="600" font-family="Source Sans 3, sans-serif">OPTIMAL ZONE</text>`;
        }
    }
    points.forEach((p, i) => {
        const x = xPos(p.value);
        svg += `<circle cx="${x}" cy="50" r="8" fill="${VOYA.white}" stroke="${colors[i] || VOYA.teal}" stroke-width="2.5"/>`;
        svg += `<circle cx="${x}" cy="50" r="3" fill="${colors[i] || VOYA.teal}"/>`;
        svg += `<text x="${x}" y="26" font-size="11" fill="${VOYA.dark}" text-anchor="middle" font-weight="700" font-family="Source Sans 3, sans-serif">${cs}${fmt(p.value)}</text>`;
        svg += `<text x="${x}" y="78" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${esc(p.label)}</text>`;
    });
    svg += '</svg>';
    return svg;
}

// ── Donut Chart (NEW) ───────────────────────────────────────
function generateDonutChartSVG(segments: { label: string; value: number; color?: string }[], title?: string): string {
    if (!segments?.length) return '';
    const total = segments.reduce((s, seg) => s + num(seg.value), 0);
    if (total === 0) return '';

    const W = 280, H = 200;
    const cx = 100, cy = 100, outerR = 72, innerR = 45;
    const palette = [VOYA.teal, VOYA.orange, VOYA.green, VOYA.blue, VOYA.purple, VOYA.gray];

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

    let startAngle = -90;
    segments.forEach((seg, i) => {
        const pctVal = num(seg.value) / total;
        const angle = pctVal * 360;
        const endAngle = startAngle + angle;
        const largeArc = angle > 180 ? 1 : 0;
        const color = seg.color || palette[i % palette.length];

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1o = cx + outerR * Math.cos(startRad);
        const y1o = cy + outerR * Math.sin(startRad);
        const x2o = cx + outerR * Math.cos(endRad);
        const y2o = cy + outerR * Math.sin(endRad);
        const x1i = cx + innerR * Math.cos(endRad);
        const y1i = cy + innerR * Math.sin(endRad);
        const x2i = cx + innerR * Math.cos(startRad);
        const y2i = cy + innerR * Math.sin(startRad);

        svg += `<path d="M${x1o},${y1o} A${outerR},${outerR} 0 ${largeArc},1 ${x2o},${y2o} L${x1i},${y1i} A${innerR},${innerR} 0 ${largeArc},0 ${x2i},${y2i} Z" fill="${color}" stroke="${VOYA.white}" stroke-width="2"/>`;
        startAngle = endAngle;
    });

    // Center text
    svg += `<text x="${cx}" y="${cy - 4}" font-size="18" font-weight="700" fill="${VOYA.dark}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${fmtK(total)}</text>`;
    svg += `<text x="${cx}" y="${cy + 12}" font-size="8" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">TOTAL</text>`;

    // Legend (right side)
    const lx = 200;
    if (title) {
        svg += `<text x="${lx}" y="20" font-size="10" font-weight="600" fill="${VOYA.dark}" font-family="Source Sans 3, sans-serif">${esc(title)}</text>`;
    }
    segments.forEach((seg, i) => {
        const ly = (title ? 38 : 20) + i * 22;
        const color = seg.color || palette[i % palette.length];
        const pctLabel = ((num(seg.value) / total) * 100).toFixed(1);
        // Font sizes bumped for PDF readability
        svg += `<rect x="${lx}" y="${ly - 6}" width="10" height="10" fill="${color}" rx="2"/>`;
        svg += `<text x="${lx + 15}" y="${ly + 3}" font-size="11" fill="${VOYA.dark}" font-family="Source Sans 3, sans-serif">${esc(seg.label)}</text>`;
        svg += `<text x="${lx + 15}" y="${ly + 14}" font-size="10" fill="${VOYA.gray}" font-family="Source Sans 3, sans-serif">${pctLabel}%</text>`;
    });
    svg += '</svg>';
    return svg;
}

// ── Horizontal Bar Chart (NEW) ──────────────────────────────
function generateHorizontalBarSVG(items: { label: string; value: number; color?: string }[], maxOverride?: number): string {
    if (!items?.length) return '';
    const W = 520, barH = 24, gap = 10, pad = { left: 180, right: 60, top: 10 };
    const H = pad.top + items.length * (barH + gap) + 10;
    const maxVal = maxOverride || Math.max(...items.map(i => num(i.value)), 1);
    const barArea = W - pad.left - pad.right;
    const palette = [VOYA.teal, VOYA.orange, VOYA.green, VOYA.blue, VOYA.purple];

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    items.forEach((item, i) => {
        const y = pad.top + i * (barH + gap);
        const barW = (num(item.value) / maxVal) * barArea;
        const color = item.color || palette[i % palette.length];

        // Label
        svg += `<text x="${pad.left - 10}" y="${y + barH / 2 + 4}" font-size="12" fill="${VOYA.dark}" text-anchor="end" font-family="Source Sans 3, sans-serif">${esc(String(item.label))}</text>`;
        // Track background
        svg += `<rect x="${pad.left}" y="${y}" width="${barArea}" height="${barH}" fill="${VOYA.lightGray}" rx="4"/>`;
        // Bar fill
        svg += `<rect x="${pad.left}" y="${y}" width="${Math.max(barW, 2)}" height="${barH}" fill="${color}" rx="4"/>`;
        // Sheen
        svg += `<rect x="${pad.left}" y="${y}" width="${Math.max(barW, 2)}" height="${barH / 2}" fill="#FFFFFF20" rx="4"/>`;
        // Value
        svg += `<text x="${pad.left + barW + 8}" y="${y + barH / 2 + 4}" font-size="12" fill="${VOYA.dark}" font-weight="600" font-family="Source Sans 3, sans-serif">${fmtK(item.value)}</text>`;
    });
    svg += '</svg>';
    return svg;
}

// ── Gauge / Semicircle Meter (NEW) ──────────────────────────
function generateGaugeSVG(value: number, max: number = 100, label: string = '', unit: string = ''): string {
    const W = 180, H = 120;
    const cx = W / 2, cy = 90;
    const r = 65;
    const pct = Math.min(Math.max(num(value) / max, 0), 1);
    const startAngle = Math.PI;
    const endAngle = Math.PI + pct * Math.PI;

    // Color based on percentage
    const color = pct >= 0.7 ? VOYA.green : pct >= 0.4 ? VOYA.orange : VOYA.red;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    // Background arc
    svg += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}" fill="none" stroke="${VOYA.border}" stroke-width="12" stroke-linecap="round"/>`;
    // Value arc
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    svg += `<path d="M${cx - r},${cy} A${r},${r} 0 ${largeArc},1 ${x2},${y2}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round"/>`;
    // Center value
    svg += `<text x="${cx}" y="${cy - 10}" font-size="24" font-weight="700" fill="${VOYA.dark}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${num(value)}${unit}</text>`;
    // Label below
    svg += `<text x="${cx}" y="${cy + 8}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${esc(label)}</text>`;
    // Min/Max
    svg += `<text x="${cx - r - 4}" y="${cy + 14}" font-size="10" fill="${VOYA.gray}" text-anchor="middle">0</text>`;
    svg += `<text x="${cx + r + 4}" y="${cy + 14}" font-size="10" fill="${VOYA.gray}" text-anchor="middle">${max}</text>`;
    svg += '</svg>';
    return svg;
}

// ── Positioning Map (Scatter Plot) ──────────────────────────
function generatePositioningMapSVG(items: { name: string; price: number; value_score: number }[], cs: string): string {
    if (!items?.length) return '';
    const W = 520, H = 280;
    const pad = { top: 30, right: 30, bottom: 50, left: 70 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    const prices = items.map(i => i.price);
    const scores = items.map(i => i.value_score);
    const minP = Math.min(...prices) * 0.8, maxP = Math.max(...prices) * 1.2;
    const minS = 0, maxS = Math.max(...scores, 10) * 1.15;
    const xPos = (p: number) => pad.left + ((p - minP) / (maxP - minP || 1)) * cW;
    const yPos = (s: number) => pad.top + cH - ((s - minS) / (maxS - minS || 1)) * cH;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect x="${pad.left}" y="${pad.top}" width="${cW}" height="${cH}" fill="${VOYA.lightGray}" rx="2"/>`;
    // Grid
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (cH * i) / 4;
        svg += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="${VOYA.border}" stroke-width="0.5"/>`;
        const x = pad.left + (cW * i) / 4;
        svg += `<line x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + cH}" stroke="${VOYA.border}" stroke-width="0.5"/>`;
    }
    // Dots
    items.forEach((item, i) => {
        const x = xPos(item.price);
        const y = yPos(item.value_score);
        const isYou = item.name === 'Your Product';
        const r = isYou ? 10 : 7;
        const color = isYou ? VOYA.teal : VOYA.orange;
        svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.85" stroke="${VOYA.white}" stroke-width="2"/>`;
        svg += `<text x="${x}" y="${y - r - 4}" font-size="10" fill="${VOYA.dark}" text-anchor="middle" font-weight="${isYou ? '700' : '400'}" font-family="Source Sans 3, sans-serif">${esc(item.name)}</text>`;
    });
    // Axes
    svg += `<line x1="${pad.left}" y1="${pad.top + cH}" x2="${W - pad.right}" y2="${pad.top + cH}" stroke="${VOYA.dark}" stroke-width="1"/>`;
    svg += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + cH}" stroke="${VOYA.dark}" stroke-width="1"/>`;
    svg += `<text x="${W / 2}" y="${H - 8}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">Price (${cs})</text>`;
    svg += `<text x="14" y="${pad.top + cH / 2}" font-size="11" fill="${VOYA.gray}" text-anchor="middle" transform="rotate(-90, 14, ${pad.top + cH / 2})" font-family="Source Sans 3, sans-serif">Value Score</text>`;
    svg += '</svg>';
    return svg;
}

// ── Rule of 40 Gauge ────────────────────────────────────────
function generateRuleOf40GaugeSVG(score: number): string {
    const W = 200, H = 130;
    const cx = W / 2, cy = 100, r = 70;
    const clamped = Math.min(Math.max(score, 0), 80);
    const pct = clamped / 80;
    const endAngle = Math.PI + pct * Math.PI;
    const color = score >= 40 ? VOYA.green : score >= 25 ? VOYA.orange : VOYA.red;

    let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}" fill="none" stroke="${VOYA.border}" stroke-width="14" stroke-linecap="round"/>`;
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;
    svg += `<path d="M${cx - r},${cy} A${r},${r} 0 ${largeArc},1 ${x2},${y2}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>`;
    // "40" threshold marker
    const threshAngle = Math.PI + (40 / 80) * Math.PI;
    const mx = cx + (r + 12) * Math.cos(threshAngle);
    const my = cy + (r + 12) * Math.sin(threshAngle);
    svg += `<circle cx="${cx + r * Math.cos(threshAngle)}" cy="${cy + r * Math.sin(threshAngle)}" r="2" fill="${VOYA.dark}"/>`;
    svg += `<text x="${mx}" y="${my + 4}" font-size="9" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">40</text>`;
    svg += `<text x="${cx}" y="${cy - 14}" font-size="28" font-weight="700" fill="${VOYA.dark}" text-anchor="middle" font-family="Source Sans 3, sans-serif">${score}</text>`;
    svg += `<text x="${cx}" y="${cy + 4}" font-size="10" fill="${VOYA.gray}" text-anchor="middle" font-family="Source Sans 3, sans-serif">Rule of 40</text>`;
    svg += `<text x="${cx - r - 4}" y="${cy + 14}" font-size="9" fill="${VOYA.gray}" text-anchor="middle">0</text>`;
    svg += `<text x="${cx + r + 4}" y="${cy + 14}" font-size="9" fill="${VOYA.gray}" text-anchor="middle">80</text>`;
    svg += '</svg>';
    return svg;
}

// ── Margin Erosion Horizontal Bar ───────────────────────────
function generateMarginErosionBarSVG(sources: { source: string; annual_impact: string }[]): string {
    if (!sources?.length) return '';
    const items = sources.map(s => ({
        label: s.source,
        value: parseFloat(String(s.annual_impact).replace(/[^0-9.]/g, '')) || 0,
        color: VOYA.red,
    }));
    return generateHorizontalBarSVG(items);
}

// ══════════════════════════════════════════════════════════════
// MAIN TEMPLATE GENERATOR
// ══════════════════════════════════════════════════════════════
export function generateHTMLTemplate(payload: any): string {
    // Reset exhibit counter and source references for each generation
    exhibitCounter = 0;
    sourceReferences = [];

    const { claudeData, pricingResult, sessionData, tier, validationReport } = payload;

    const d = claudeData || {};
    const pr = pricingResult || { budget: 0, recommended: 0, premium: 0, analysis: { costPlusBase: 0, valueMultiplier: 1, totalUnitCost: 0 } };
    const answers = sessionData?.answers || {};
    const productName = answers?.projectName?.value || 'Pricing Intelligence Report';
    const companyName = answers?.companyName?.value || '';
    const cs = getCurrencySymbol(answers);
    const journeyType = sessionData?.journeyType || 'new_launcher';

    const isAudit = journeyType === 'Pricing Audit' || journeyType === 'established_seller';
    const isBasic = tier === 'Basic';
    const isFounder = tier === 'Professional';
    const isInvestor = tier === 'Investor';
    const coverTierLabel = isInvestor ? 'Investor Grade' : isFounder ? 'Founder Ready' : 'Essentials';

    const meta = d.report_meta || {};
    const exec = typeof d.executive_summary === 'object'
        ? d.executive_summary
        : { headline: 'Executive Summary', summary: txt(d.executiveSummary || d.executive_summary), pricing_verdict: {} };

    const answerEntries = Object.entries(answers).map(([key, val]: [string, any]) => ({
        question: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        answer: formatAnswerValue(val?.value, cs),
    }));

    const V = VOYA;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Pricing data for charts
    const budget = num(pr.budget);
    const recommended = num(pr.recommended);
    const premium = num(pr.premium);
    const costBase = num(pr.analysis?.costPlusBase);
    const valueMult = num(pr.analysis?.valueMultiplier, 1);
    const totalUnitCost = num(pr.analysis?.totalUnitCost);
    const margin = recommended > 0 && costBase > 0 ? ((recommended - costBase) / recommended * 100) : 0;

    // Validation report for provenance dots and data gating
    const vr = validationReport || { provenanceMap: {}, hasCostData: totalUnitCost > 0, hasCompetitorData: false, hasIntelligenceData: false };

    // Provenance dot helper — shows data source classification in exhibit headers
    function provDot(section: string): string {
        const prov = vr.provenanceMap?.[section];
        if (!prov || prov === 'verified') return '<span class="prov-dot prov-verified" title="Verified — calculated from your inputs"></span>';
        if (prov === 'ai_estimated') return '<span class="prov-dot prov-estimated" title="AI-Estimated — inferred by AI analysis"></span>';
        if (prov === 'illustrative') return '<span class="prov-dot prov-estimated" title="Illustrative — AI estimate, verify independently"></span>';
        return '<span class="prov-dot prov-unavailable" title="Unavailable — requires additional input"></span>';
    }

    // Page wrapper helpers
    const pageStart = (section: string) => `
    <div class="voya-page">
        <div class="voya-page-header">
            <span class="header-brand">PricePoint Intelligence</span>
            <span class="header-section">${section}</span>
        </div>`;
    const pageEnd = `
        <div class="voya-page-number">
            <span>${dateStr}</span>
        </div>
    </div>`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PricePoint Report — ${esc(productName)}</title>
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        /* ── Voya Design System ── */
        :root {
            --voya-orange: ${V.orange};
            --voya-teal: ${V.teal};
            --voya-dark: ${V.dark};
            --voya-gray: ${V.gray};
            --voya-light-gray: ${V.lightGray};
            --voya-table-header: ${V.tableHeader};
            --voya-table-stripe: ${V.tableStripe};
            --voya-border: ${V.border};
        }

        @page { size: A4; margin: 20mm 0 25mm 0; }
        * { box-sizing: border-box; }
        body {
            margin: 0; padding: 0;
            font-family: 'Source Sans 3', 'Source Sans Pro', -apple-system, sans-serif;
            color: var(--voya-dark);
            background: #FFFFFF;
            font-size: 15px;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ── Page Container ── */
        .voya-page {
            max-width: 210mm;
            margin: 0 auto;
            padding: 10px 48px 10px 48px;
            position: relative;
            page-break-after: always;
            background: #FFFFFF;
        }
        .voya-page:last-child { page-break-after: auto; }

        /* ── Page Header ── */
        .voya-page-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 2px solid var(--voya-orange);
            padding-bottom: 10px; margin-bottom: 28px;
        }
        .header-brand {
            font-size: 11px; font-weight: 700; color: var(--voya-orange);
            text-transform: uppercase; letter-spacing: 2px;
        }
        .header-section {
            font-size: 11px; font-weight: 600; color: var(--voya-gray);
            text-transform: uppercase; letter-spacing: 0.8px;
        }

        /* ── Page Number / Footer (handled by Puppeteer displayHeaderFooter) ── */
        .voya-page-number {
            display: none;
        }

        /* ── Typography ── */
        h1, h2, h3, h4 { margin-top: 0; }

        .section-title {
            font-size: 26px; font-weight: 300; color: var(--voya-orange);
            margin-bottom: 6px; line-height: 1.3;
            border-bottom: 1px solid var(--voya-border);
            padding-bottom: 8px;
        }
        .section-subtitle {
            font-size: 13px; color: var(--voya-gray); font-weight: 400;
            margin-bottom: 20px; margin-top: 2px;
        }
        .subsection-title {
            font-size: 16px; font-weight: 700; color: var(--voya-dark);
            margin: 22px 0 10px 0;
        }
        .paragraph {
            margin-bottom: 14px; line-height: 1.65; font-size: 14px; color: var(--voya-dark);
        }
        .paragraph strong { color: var(--voya-teal); }
        .muted { color: var(--voya-gray); }
        .footnote { font-size: 11px; color: var(--voya-gray); font-style: italic; }
        .source-note { display: none; }
        .source-note::before { content: ''; }

        /* ── Voya Divider ── */
        .voya-divider {
            border: none; border-top: 2px solid var(--voya-orange);
            margin: 24px 0;
        }
        .voya-divider-thin {
            border: none; border-top: 1px solid var(--voya-border);
            margin: 18px 0;
        }

        /* ── Cover Page ── */
        .cover-page {
            padding: 0 !important;
            overflow: hidden;
        }
        .cover-hero {
            background: linear-gradient(145deg, #1B2A4A 0%, #243B5C 45%, ${V.teal} 100%);
            padding: 60px 48px 50px 48px;
            position: relative;
            min-height: 45%;
        }
        .cover-hero::before {
            content: '';
            position: absolute; top: 0; left: 0; right: 0; height: 6px;
            background: linear-gradient(90deg, ${V.orange}, ${V.teal});
        }
        .cover-hero .brand-label {
            font-size: 11px; font-weight: 700; color: ${V.orange};
            letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;
        }
        .cover-hero .product-name {
            font-size: 42px; font-weight: 700; color: #FFFFFF;
            line-height: 1.15; margin-bottom: 16px;
        }
        .cover-hero .tier-badge {
            display: inline-block; padding: 6px 18px; border-radius: 20px;
            font-size: 12px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1px; color: #FFFFFF;
            background: ${V.orange};
            margin-bottom: 20px;
        }
        .cover-hero .verdict {
            font-size: 16px; color: rgba(255,255,255,0.85);
            line-height: 1.6; font-style: italic; max-width: 90%;
        }
        .cover-body {
            padding: 36px 48px 48px 48px;
        }
        .cover-price-row {
            display: flex; gap: 20px; margin-bottom: 36px;
        }
        .cover-price-card {
            flex: 1; text-align: center; padding: 22px 16px;
            border-radius: 8px; background: ${V.lightGray};
            border: 1px solid ${V.border};
        }
        .cover-price-card.primary {
            border: 2px solid ${V.teal};
            background: ${V.teal}08;
        }
        .cover-price-card .price-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.8px; color: ${V.gray}; margin-bottom: 6px;
        }
        .cover-price-card .price-value {
            font-size: 28px; font-weight: 700; color: ${V.dark};
        }
        .cover-price-card.primary .price-value {
            color: ${V.teal};
        }
        .cover-price-card .price-sub {
            font-size: 10px; color: ${V.gray}; margin-top: 4px;
        }
        .cover-footer {
            display: flex; justify-content: space-between; align-items: flex-end;
            padding-top: 20px; border-top: 1px solid ${V.border};
        }
        .cover-footer .doc-info {
            font-size: 11px; color: ${V.gray}; line-height: 1.8;
        }
        .cover-footer .doc-logo {
            font-size: 14px; font-weight: 700; color: ${V.orange};
            letter-spacing: 1.5px; text-transform: uppercase;
        }

        /* ── Two Column Grid ── */
        .voya-two-col { display: flex; gap: 28px; }
        .voya-two-col > div { flex: 1; }
        .col-left-38 { flex: 0 0 38% !important; }
        .col-right-58 { flex: 0 0 58% !important; }
        .voya-three-col { display: flex; gap: 16px; }
        .voya-three-col > div { flex: 1; }

        /* ── Flowing Two-Column Layout ── */
        .flowing-two-col {
            column-count: 2;
            column-gap: 28px;
            column-rule: 1px solid var(--voya-border);
            orphans: 3;
            widows: 3;
        }
        .flowing-two-col .subsection-title {
            column-span: all;
        }

        /* ── "By the Numbers" Stat Cards (Voya style with icons) ── */
        .stat-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0;
            page-break-inside: avoid; break-inside: avoid;
        }
        .stat-card {
            padding: 16px 14px; border-radius: 6px;
            background: var(--voya-light-gray);
            border-top: 3px solid var(--voya-orange);
            display: flex; align-items: flex-start; gap: 12px;
            page-break-inside: avoid; break-inside: avoid;
        }
        .stat-card-icon { flex-shrink: 0; }
        .stat-card-body { flex: 1; }
        .stat-value {
            font-size: 28px; font-weight: 700; color: var(--voya-teal);
            line-height: 1.1; margin-bottom: 4px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .stat-label {
            font-size: 10px; color: var(--voya-gray); text-transform: uppercase;
            font-weight: 600; letter-spacing: 0.4px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Pull Quote ── */
        .pull-quote {
            padding: 18px 24px; margin: 20px 0;
            border-left: 4px solid var(--voya-teal);
            background: ${V.teal}08;
            font-size: 15px; font-style: italic; color: var(--voya-dark);
            line-height: 1.6;
        }
        .pull-quote .attribution {
            display: block; margin-top: 8px;
            font-size: 11px; font-weight: 600; font-style: normal;
            color: var(--voya-teal); text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* ── Sidebar / Callout ── */
        .callout {
            padding: 16px 18px; background: var(--voya-light-gray);
            border-left: 4px solid var(--voya-orange); margin-bottom: 16px;
            border-radius: 0 6px 6px 0;
            page-break-inside: avoid; break-inside: avoid;
        }
        .callout.teal { border-left-color: var(--voya-teal); background: ${V.teal}08; }
        .callout.red { border-left-color: ${V.red}; background: ${V.red}06; }
        .callout.green { border-left-color: ${V.green}; background: ${V.green}06; }
        .callout-label {
            font-size: 11px; font-weight: 700; color: var(--voya-dark);
            text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
        }

        /* ── Voya Tables ── */
        .voya-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 6px; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
        .voya-table th, .voya-table td {
            text-align: left; padding: 10px 14px;
            border-bottom: 1px solid var(--voya-border); font-size: 13px;
        }
        .voya-table th {
            background: var(--voya-table-header); color: #FFFFFF;
            font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px;
        }
        .voya-table tr:nth-child(even) { background: var(--voya-table-stripe); }
        .voya-table td:first-child { font-weight: 600; color: var(--voya-dark); }
        .voya-table .highlight-row { background: ${V.teal}0A !important; }
        .voya-table .highlight-row td { color: var(--voya-teal); font-weight: 600; }

        /* ── Exhibit Box ── */
        .exhibit-box {
            border: 1px solid var(--voya-border); padding: 20px; margin-bottom: 18px;
            background: #FFFFFF; border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            page-break-inside: avoid; break-inside: avoid;
        }
        .exhibit-header {
            font-size: 11px; font-weight: 700; color: var(--voya-orange); margin-bottom: 14px;
            border-bottom: 1px solid var(--voya-border); padding-bottom: 8px;
            text-transform: uppercase; letter-spacing: 0.6px;
        }

        /* ── KPI Row (mini stat cards inline) ── */
        .kpi-row {
            display: flex; gap: 12px; margin: 16px 0;
            page-break-inside: avoid; break-inside: avoid;
            flex-wrap: wrap;
        }
        .kpi-item {
            flex: 1 1 120px; text-align: center; padding: 14px 8px;
            background: var(--voya-light-gray); border-radius: 6px;
            border: 1px solid var(--voya-border);
            page-break-inside: avoid; break-inside: avoid;
            min-width: 0;
            max-width: 180px;
        }
        .kpi-value {
            font-size: 20px; font-weight: 700; color: var(--voya-teal);
            overflow: visible; text-overflow: clip;
            word-wrap: break-word;
            line-height: 1.2;
            min-height: 24px;
        }
        .kpi-label {
            font-size: 9px; color: var(--voya-gray); text-transform: uppercase;
            font-weight: 600; margin-top: 2px; letter-spacing: 0.3px;
            overflow: visible; text-overflow: clip;
            word-wrap: break-word;
            line-height: 1.2;
        }

        /* ── Phase Cards (roadmap) ── */
        .phase-card {
            padding: 16px 18px; margin-bottom: 12px;
            border-radius: 6px; border: 1px solid var(--voya-border);
            background: #FFFFFF; position: relative;
            padding-left: 50px;
            page-break-inside: avoid; break-inside: avoid;
        }
        .phase-card .phase-number {
            position: absolute; left: 0; top: 0; bottom: 0; width: 36px;
            background: var(--voya-teal); color: #FFFFFF;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: 700; border-radius: 6px 0 0 6px;
        }
        .phase-card.active .phase-number { background: var(--voya-orange); }
        .phase-card h4 { margin: 0 0 4px 0; font-size: 14px; color: var(--voya-dark); }
        .phase-card .phase-duration { font-size: 11px; color: var(--voya-gray); font-weight: 600; }
        .phase-card ul { margin: 6px 0 4px 0; padding-left: 16px; }
        .phase-card li { font-size: 12px; color: var(--voya-dark); margin-bottom: 2px; }
        .phase-card .success { font-size: 11px; color: var(--voya-teal); font-weight: 600; margin-top: 6px; }

        /* ── Disclaimer ── */
        .disclaimer-box {
            margin-top: 16px; padding: 16px 18px; background: var(--voya-light-gray);
            border-left: 4px solid var(--voya-gray); border-radius: 0 6px 6px 0;
        }
        .disclaimer-box.orange { border-left-color: var(--voya-orange); }
        .disclaimer-box.red { border-left-color: ${V.red}; }
        .disclaimer-title {
            font-size: 12px; font-weight: 700; color: var(--voya-dark);
            margin-bottom: 6px; text-transform: uppercase;
        }
        .disclaimer-body { font-size: 11px; color: var(--voya-gray); line-height: 1.6; }

        /* ── Charts ── */
        .chart-container { margin: 16px 0; text-align: center; }
        .chart-container svg { max-width: 100%; }

        /* ── Utilities ── */
        .text-orange { color: var(--voya-orange); }
        .text-teal { color: var(--voya-teal); font-weight: 700; }
        .severity-high { color: ${V.red}; font-weight: 600; }
        .severity-medium { color: var(--voya-orange); font-weight: 600; }
        .severity-low { color: ${V.green}; font-weight: 600; }
        .badge {
            display: inline-block; padding: 3px 10px; border-radius: 12px;
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
        }
        .badge-teal { background: ${V.teal}15; color: ${V.teal}; }
        .badge-orange { background: ${V.orange}15; color: ${V.orange}; }
        .badge-green { background: ${V.green}15; color: ${V.green}; }
        .badge-red { background: ${V.red}15; color: ${V.red}; }
        ul { margin: 0; padding-left: 18px; }
        li { margin-bottom: 5px; font-size: 14px; }

        /* ── Provenance Dots ── */
        .prov-dot { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:5px; vertical-align:middle; }
        .prov-verified { background: ${V.green}; }
        .prov-estimated { background: #F59E0B; }
        .prov-unavailable { background: ${V.red}; }
        .data-source-legend { background: #FAFAFA; border-left: 4px solid ${V.teal}; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }
        .data-source-legend .legend-row { display: flex; gap: 24px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
        .data-not-provided { background: ${V.orange}10; border: 1px solid ${V.orange}40; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px; }
        .data-not-provided .dnp-label { font-size: 13px; font-weight: 700; color: ${V.orange}; margin-bottom: 4px; }
        .data-not-provided p { margin: 4px 0 0 0; font-size: 12px; color: ${V.dark}; line-height: 1.5; }

        /* ── Table of Contents ── */
        .toc-page .toc-grid { display: flex; gap: 32px; }
        .toc-page .toc-col { flex: 1; }
        .toc-group { margin-bottom: 18px; }
        .toc-group-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1.5px; color: var(--voya-orange); margin-bottom: 8px;
            border-bottom: 1px solid var(--voya-border); padding-bottom: 4px;
        }
        .toc-item {
            display: flex; justify-content: space-between; align-items: baseline;
            padding: 4px 0; border-bottom: 1px dotted var(--voya-border);
        }
        .toc-item .toc-num { font-size: 11px; font-weight: 700; color: var(--voya-teal); min-width: 24px; }
        .toc-item .toc-label { font-size: 13px; color: var(--voya-dark); flex: 1; }

        /* ── Strategic Verdict Card ── */
        .verdict-card {
            padding: 24px 28px; margin: 20px 0;
            background: linear-gradient(135deg, ${VOYA.teal}08 0%, ${VOYA.orange}06 100%);
            border: 2px solid ${VOYA.teal}; border-radius: 10px;
            page-break-inside: avoid; break-inside: avoid;
        }
        .verdict-card .vc-headline {
            font-size: 20px; font-weight: 700; color: var(--voya-teal);
            margin-bottom: 12px; line-height: 1.3;
        }
        .verdict-card .vc-body { font-size: 14px; color: var(--voya-dark); line-height: 1.65; }
        .verdict-card .vc-badge {
            display: inline-block; margin-top: 12px; padding: 4px 14px;
            border-radius: 16px; font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.5px;
        }

        /* ── Cost of Inaction Callout ── */
        .inaction-callout {
            padding: 24px 28px; margin: 20px 0;
            background: ${VOYA.red}08; border: 2px solid ${VOYA.red};
            border-radius: 10px; text-align: center;
            page-break-inside: avoid; break-inside: avoid;
        }
        .inaction-callout .ic-label {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 1.5px; color: ${VOYA.red}; margin-bottom: 8px;
        }
        .inaction-callout .ic-number {
            font-size: 32px; font-weight: 700; color: ${VOYA.red}; margin-bottom: 8px;
        }
        .inaction-callout .ic-calc { font-size: 14px; color: var(--voya-dark); line-height: 1.6; }

        /* ── Thesis Page ── */
        .thesis-content {
            column-count: 2; column-gap: 28px;
            column-rule: 1px solid var(--voya-border);
            font-size: 14px; line-height: 1.7; color: var(--voya-dark);
            orphans: 3; widows: 3;
        }

        /* ── Glossary Grid ── */
        .glossary-grid {
            column-count: 2; column-gap: 24px;
        }
        .glossary-item {
            padding: 8px 0; border-bottom: 1px solid var(--voya-border);
            break-inside: avoid; page-break-inside: avoid;
        }
        .glossary-term { font-size: 13px; font-weight: 700; color: var(--voya-teal); }
        .glossary-def { font-size: 12px; color: var(--voya-dark); line-height: 1.5; margin-top: 2px; }

        /* ── Q&A Cards ── */
        .qa-card {
            padding: 14px 18px; margin-bottom: 12px;
            border: 1px solid var(--voya-border); border-radius: 6px;
            background: var(--voya-light-gray);
            page-break-inside: avoid; break-inside: avoid;
        }
        .qa-card .qa-q {
            font-size: 14px; font-weight: 700; color: var(--voya-dark); margin-bottom: 6px;
        }
        .qa-card .qa-a { font-size: 13px; color: var(--voya-dark); line-height: 1.6; }

        /* ── Metric Trigger Table ── */
        .metric-trigger-table td.target { color: ${VOYA.green}; font-weight: 600; }
        .metric-trigger-table td.warning { color: ${VOYA.red}; font-weight: 600; }

        /* ── Timeline Steps ── */
        .timeline-item {
            display: flex; gap: 14px; margin-bottom: 14px;
            page-break-inside: avoid; break-inside: avoid;
        }
        .timeline-dot {
            min-width: 36px; height: 36px; border-radius: 50%;
            background: var(--voya-teal); color: #FFF;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 700;
        }
        .timeline-body { flex: 1; }
        .timeline-body h4 { font-size: 13px; margin: 0 0 2px 0; color: var(--voya-dark); }
        .timeline-body p { font-size: 12px; color: var(--voya-gray); margin: 0; }

        /* ── Input Audit Table ── */
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table td {
            padding: 8px 14px; border-bottom: 1px solid var(--voya-border);
            font-size: 12px; vertical-align: top;
        }
        .audit-table td:first-child {
            font-weight: 600; color: var(--voya-dark); width: 35%;
            background: var(--voya-light-gray);
        }
        .audit-table td:last-child { color: var(--voya-dark); }
    </style>
</head>
<body>

    <!-- ═══════════════════════════════════════════════
         01 · COVER PAGE (All Tiers)
         ═══════════════════════════════════════════════ -->
    <div class="voya-page cover-page">
        <div class="cover-hero">
            <div class="brand-label">PricePoint Intelligence</div>
            <div class="product-name">${esc(productName)}</div>
            <div class="tier-badge">${esc(coverTierLabel)}</div>
            <div class="verdict">${esc(txt(exec.headline || meta.one_line_verdict, 'Your comprehensive pricing intelligence analysis.'))}</div>
        </div>

        <div class="cover-body">
            <div class="cover-price-row">
                <div class="cover-price-card">
                    <div class="price-label">Entry Price</div>
                    <div class="price-value">${cs}${fmtK(budget)}</div>
                    <div class="price-sub">Market Floor</div>
                </div>
                <div class="cover-price-card primary">
                    <div class="price-label">Optimal Price</div>
                    <div class="price-value">${cs}${fmtK(recommended)}</div>
                    <div class="price-sub">Recommended</div>
                </div>
                <div class="cover-price-card">
                    <div class="price-label">Premium $≈</div>
                    <div class="price-value">${cs}${fmt(premium)}</div>
                    <div class="price-sub">Value-Based Cap</div>
                </div>
            </div>
            ${pr.analysis?.vanWestendorp?.pme ? `
            <div style="text-align:center;margin-top:8px;">
                <span style="font-size:9px;color:${V.gray};">
                    <strong>Premium vs VW Ceiling:</strong> Your value-based cap (${cs}${fmt(premium)}) may differ from the Van Westendorp ceiling (${cs}${fmt(num(pr.analysis.vanWestendorp.pme))}) — the price above which consumers perceive the product as too expensive. This difference reveals pricing headroom.
                </span>
            </div>` : `
            <p style="text-align:center;font-size:9px;color:${V.gray};margin:8px 0 0 0;">
                <strong>Premium vs VW Ceiling:</strong> Premium Anchor (${cs}${fmt(premium)}) is your value-adjusted maximum (cost-plus × multiplier). PME/VW Ceiling is where consumers see the product as too expensive. These are distinct metrics.<br>
                Tip: If Premium > PME, consider aggressive upside. If Premium < PME, you have pricing runway.
            </p>`}

            ${!isBasic && meta.report_thesis ? `
            <div class="callout teal" style="margin-bottom: 24px;">
                <div class="callout-label">Investment Thesis</div>
                <p style="font-size: 14px; color: var(--voya-dark); line-height: 1.6; font-style: italic; margin: 0;">${esc(meta.report_thesis)}</p>
            </div>` : ''}

            <div class="cover-footer">
                <div class="doc-info">
                    <strong>${esc(productName)}</strong>${companyName ? ` &mdash; ${esc(companyName)}` : ''}<br>
                    Document ID: PP-${Date.now().toString(36).toUpperCase()} &bull; ${dateStr}<br>
                    <span style="font-size:10px;">Strictly Confidential</span>
                </div>
                <div class="doc-logo">PricePoint</div>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         02 · TABLE OF CONTENTS (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${pageStart('Table of Contents')}
        <h2 class="section-title">Table of Contents</h2>
        <div class="toc-page">
        ${isBasic ? `
            <div class="toc-group">
                <div class="toc-group-label">Opening</div>
                <div class="toc-item"><span class="toc-num">01</span><span class="toc-label">Cover Page</span></div>
                <div class="toc-item"><span class="toc-num">02</span><span class="toc-label">Table of Contents</span></div>
                <div class="toc-item"><span class="toc-num">03</span><span class="toc-label">Executive Summary</span></div>
            </div>
            <div class="toc-group">
                <div class="toc-group-label">Core Analysis</div>
                <div class="toc-item"><span class="toc-num">04</span><span class="toc-label">Price Recommendation + Rationale</span></div>
                <div class="toc-item"><span class="toc-num">05</span><span class="toc-label">Van Westendorp Visual + Interpretation</span></div>
                <div class="toc-item"><span class="toc-num">06</span><span class="toc-label">Cost Breakdown + Gross Margin</span></div>
                <div class="toc-item"><span class="toc-num">07</span><span class="toc-label">Breakeven Table</span></div>
                <div class="toc-item"><span class="toc-num">08</span><span class="toc-label">Top 3 Risks + Mitigations</span></div>
                <div class="toc-item"><span class="toc-num">09</span><span class="toc-label">5 Next Steps</span></div>
            </div>
            <div class="toc-group">
                <div class="toc-group-label">Closing</div>
                <div class="toc-item"><span class="toc-num">10</span><span class="toc-label">Full Input Audit</span></div>
                <div class="toc-item"><span class="toc-num">11</span><span class="toc-label">Methodology Appendix</span></div>
                <div class="toc-item"><span class="toc-num">12</span><span class="toc-label">Legal Disclaimer</span></div>
                <div class="toc-item"><span class="toc-num">13</span><span class="toc-label">Verification Seal</span></div>
            </div>
        ` : isFounder ? `
            <div class="toc-grid">
                <div class="toc-col">
                    <div class="toc-group">
                        <div class="toc-group-label">Opening</div>
                        <div class="toc-item"><span class="toc-num">01</span><span class="toc-label">Cover Page</span></div>
                        <div class="toc-item"><span class="toc-num">02</span><span class="toc-label">Table of Contents</span></div>
                        <div class="toc-item"><span class="toc-num">03</span><span class="toc-label">Executive Summary</span></div>
                        <div class="toc-item"><span class="toc-num">04</span><span class="toc-label">Strategic Verdict Card</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Market Intelligence</div>
                        <div class="toc-item"><span class="toc-num">05</span><span class="toc-label">Van Westendorp Full Analysis</span></div>
                        <div class="toc-item"><span class="toc-num">06</span><span class="toc-label">Market Sizing (TAM/SAM)</span></div>
                        <div class="toc-item"><span class="toc-num">07</span><span class="toc-label">Competitive Benchmark Table</span></div>
                        <div class="toc-item"><span class="toc-num">08</span><span class="toc-label">Positioning Map</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Unit Economics</div>
                        <div class="toc-item"><span class="toc-num">09</span><span class="toc-label">Cost Breakdown + Gross Margin</span></div>
                        <div class="toc-item"><span class="toc-num">10</span><span class="toc-label">Breakeven Table</span></div>
                        <div class="toc-item"><span class="toc-num">11</span><span class="toc-label">LTV &middot; CAC &middot; Payback</span></div>
                        <div class="toc-item"><span class="toc-num">12</span><span class="toc-label">Revenue Scenario Table</span></div>
                        <div class="toc-item"><span class="toc-num">13</span><span class="toc-label">Cost of Inaction</span></div>
                    </div>
                </div>
                <div class="toc-col">
                    <div class="toc-group">
                        <div class="toc-group-label">Strategy</div>
                        <div class="toc-item"><span class="toc-num">14</span><span class="toc-label">Price Recommendation + Rationale</span></div>
                        <div class="toc-item"><span class="toc-num">15</span><span class="toc-label">Pricing Tier Architecture</span></div>
                        <div class="toc-item"><span class="toc-num">16</span><span class="toc-label">Launch vs. Scale Pricing</span></div>
                        <div class="toc-item"><span class="toc-num">17</span><span class="toc-label">90-Day Monitoring Plan</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Risk &amp; Roadmap</div>
                        <div class="toc-item"><span class="toc-num">18</span><span class="toc-label">Risk Matrix</span></div>
                        <div class="toc-item"><span class="toc-num">19</span><span class="toc-label">3-Phase Implementation Roadmap</span></div>
                        <div class="toc-item"><span class="toc-num">20</span><span class="toc-label">Next Steps</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Closing</div>
                        <div class="toc-item"><span class="toc-num">21</span><span class="toc-label">Full Input Audit</span></div>
                        <div class="toc-item"><span class="toc-num">22</span><span class="toc-label">Methodology Appendix</span></div>
                        <div class="toc-item"><span class="toc-num">23</span><span class="toc-label">Legal Disclaimer + Verification Seal</span></div>
                    </div>
                </div>
            </div>
        ` : `
            <div class="toc-grid">
                <div class="toc-col">
                    <div class="toc-group">
                        <div class="toc-group-label">Opening</div>
                        <div class="toc-item"><span class="toc-num">01</span><span class="toc-label">Cover Page</span></div>
                        <div class="toc-item"><span class="toc-num">02</span><span class="toc-label">Table of Contents</span></div>
                        <div class="toc-item"><span class="toc-num">03</span><span class="toc-label">Investment Thesis</span></div>
                        <div class="toc-item"><span class="toc-num">04</span><span class="toc-label">Executive Summary</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Market Intelligence</div>
                        <div class="toc-item"><span class="toc-num">05</span><span class="toc-label">Van Westendorp Full Analysis</span></div>
                        <div class="toc-item"><span class="toc-num">06</span><span class="toc-label">Market Sizing (TAM/SAM/SOM)</span></div>
                        <div class="toc-item"><span class="toc-num">07</span><span class="toc-label">Market Timing Assessment</span></div>
                        <div class="toc-item"><span class="toc-num">08</span><span class="toc-label">Competitive Benchmark</span></div>
                        <div class="toc-item"><span class="toc-num">09</span><span class="toc-label">Feature-to-Price Mapping</span></div>
                        <div class="toc-item"><span class="toc-num">10</span><span class="toc-label">Competitive Moat Assessment</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Financial Analysis</div>
                        <div class="toc-item"><span class="toc-num">11</span><span class="toc-label">Cost Breakdown + Gross Margin</span></div>
                        <div class="toc-item"><span class="toc-num">12</span><span class="toc-label">Breakeven Table</span></div>
                        <div class="toc-item"><span class="toc-num">13</span><span class="toc-label">LTV &middot; CAC &middot; Payback &middot; Rule of 40</span></div>
                        <div class="toc-item"><span class="toc-num">14</span><span class="toc-label">Revenue Scenario Table</span></div>
                        <div class="toc-item"><span class="toc-num">15</span><span class="toc-label">12-Month Revenue Projection</span></div>
                        <div class="toc-item"><span class="toc-num">16</span><span class="toc-label">Margin Erosion + Leakage Audit</span></div>
                        <div class="toc-item"><span class="toc-num">17</span><span class="toc-label">Cost of Inaction</span></div>
                    </div>
                </div>
                <div class="toc-col">
                    <div class="toc-group">
                        <div class="toc-group-label">Pricing Strategy</div>
                        <div class="toc-item"><span class="toc-num">18</span><span class="toc-label">Price Recommendation + Rationale</span></div>
                        <div class="toc-item"><span class="toc-num">19</span><span class="toc-label">Pricing Tier Architecture</span></div>
                        <div class="toc-item"><span class="toc-num">20</span><span class="toc-label">Packaging Recommendation</span></div>
                        <div class="toc-item"><span class="toc-num">21</span><span class="toc-label">Launch vs. Scale Pricing</span></div>
                        <div class="toc-item"><span class="toc-num">22</span><span class="toc-label">Price Increase Strategy</span></div>
                        <div class="toc-item"><span class="toc-num">23</span><span class="toc-label">90-Day Monitoring Plan</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Investor Materials</div>
                        <div class="toc-item"><span class="toc-num">24</span><span class="toc-label">Pricing Defensibility Statement</span></div>
                        <div class="toc-item"><span class="toc-num">25</span><span class="toc-label">Comparable Company Pricing</span></div>
                        <div class="toc-item"><span class="toc-num">26</span><span class="toc-label">Red Flags to Address</span></div>
                        <div class="toc-item"><span class="toc-num">27</span><span class="toc-label">Investor Questions to Prepare For</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Risk &amp; Roadmap</div>
                        <div class="toc-item"><span class="toc-num">28</span><span class="toc-label">Risk Matrix</span></div>
                        <div class="toc-item"><span class="toc-num">29</span><span class="toc-label">4-Phase Roadmap (18 Months)</span></div>
                        <div class="toc-item"><span class="toc-num">30</span><span class="toc-label">Next Steps</span></div>
                    </div>
                    <div class="toc-group">
                        <div class="toc-group-label">Closing</div>
                        <div class="toc-item"><span class="toc-num">31</span><span class="toc-label">Full Input Audit</span></div>
                        <div class="toc-item"><span class="toc-num">32</span><span class="toc-label">Methodology Appendix</span></div>
                        <div class="toc-item"><span class="toc-num">33</span><span class="toc-label">Glossary of Pricing Terms</span></div>
                        <div class="toc-item"><span class="toc-num">34</span><span class="toc-label">Legal Disclaimer + Verification Seal</span></div>
                    </div>
                </div>
            </div>
        `}
        </div>
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         02b · DATA SOURCE LEGEND (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${pageStart('Data Sources')}
        <div class="data-source-legend">
            <div style="font-size: 12px; font-weight: 700; color: ${V.dark}; letter-spacing: 0.5px; text-transform: uppercase;">Data Source Classification</div>
            <p style="font-size: 11px; color: ${V.gray}; margin: 4px 0 10px 0;">
                This report contains data from multiple sources. Each section is classified by its provenance to help you distinguish calculated facts from AI-generated analysis.
            </p>
            <div class="legend-row">
                <div style="font-size: 12px;"><span class="prov-dot prov-verified"></span> <strong>Verified</strong> — calculated from your inputs</div>
                <div style="font-size: 12px;"><span class="prov-dot prov-estimated"></span> <strong>AI-Estimated</strong> — inferred by AI analysis</div>
                <div style="font-size: 12px;"><span class="prov-dot prov-unavailable"></span> <strong>Unavailable</strong> — requires additional input</div>
            </div>
        </div>

        ${!vr.hasCostData ? `
        <div class="data-not-provided">
            <div class="dnp-label">⚠ Unit Economics Data Not Provided</div>
            <p>You did not provide cost data. Sections requiring unit cost input (gross margin, breakeven analysis, margin erosion) are marked as <strong>Unavailable</strong>. Re-run your analysis with cost data to unlock these sections.</p>
        </div>` : ''}

        ${!vr.hasCompetitorData ? `
        <div class="data-not-provided">
            <div class="dnp-label">⚠ Competitor Intelligence Not Available</div>
            <p>No verified competitor data was scraped. Competitive benchmark tables show industry-typical positioning tiers rather than specific company data. Enable competitor discovery to populate with real market data.</p>
        </div>` : ''}
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         03 · INVESTMENT THESIS (Investor Only — 2 pages)
         ═══════════════════════════════════════════════ -->
    ${isInvestor && txt(d.investment_thesis) ? `
    ${pageStart('Investment Thesis')}
        <h2 class="section-title">Investment Thesis</h2>
        <p class="section-subtitle">Pricing strategy rationale for investor consideration</p>
        <div class="thesis-content">
            ${txt(d.investment_thesis).split('\n\n').map((p: string) => `<p class="paragraph">${esc(p)}</p>`).join('')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         03/04 · EXECUTIVE SUMMARY (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${pageStart('Executive Summary')}
        <h2 class="section-title">Executive Summary</h2>
        <p class="section-subtitle">Situation analysis, key finding, and recommended action</p>

        <h3 class="subsection-title">${esc(txt(exec.headline, 'Executive Summary'))}</h3>
        <p class="paragraph">${esc(txt(exec.summary))}</p>

        ${exec.pricing_verdict?.recommended_price ? `
        <div class="callout teal">
            <div class="callout-label">Pricing Verdict</div>
            <p style="margin: 6px 0 0 0; font-size: 14px;">Recommended Price: <strong class="text-teal" style="font-size:20px;">${cs}${num(exec.pricing_verdict.recommended_price).toFixed(2)}</strong></p>
            <p style="margin: 6px 0 0 0; font-size: 14px;">Model: <span class="badge badge-teal">${esc(txt(exec.pricing_verdict.recommended_model, 'N/A'))}</span> &nbsp; Confidence: <strong>${esc(txt(exec.pricing_verdict.confidence_level, 'N/A'))}</strong></p>
            <p class="footnote" style="margin-top: 4px;">${esc(txt(exec.pricing_verdict.confidence_rationale, ''))}</p>
        </div>` : ''}

        <!-- Stat Cards -->
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-card-icon">${svgIcon('dollar', V.orange)}</div>
                <div class="stat-card-body">
                    <div class="stat-value">${cs}${fmt(budget)}</div>
                    <div class="stat-label">Entry Floor</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">${svgIcon('target', V.teal)}</div>
                <div class="stat-card-body">
                    <div class="stat-value">${cs}${fmt(recommended)}</div>
                    <div class="stat-label">Optimal Price</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-card-icon">${svgIcon('crown', V.orange)}</div>
                <div class="stat-card-body">
                    <div class="stat-value">${cs}${fmt(premium)}</div>
                    <div class="stat-label">Premium (Value-Based)</div>
                </div>
            </div>
        </div>

        ${isInvestor && arr(exec.key_findings).length > 0 ? `
        <h3 class="subsection-title">Key Findings</h3>
        ${arr(exec.key_findings).map((f: string) => `
        <div style="display:flex;gap:10px;align-items:flex-start;margin-bottom:8px;">
            <span style="color:${V.teal};font-size:16px;font-weight:700;">&bull;</span>
            <p class="paragraph" style="margin:0;">${esc(f)}</p>
        </div>`).join('')}
        ` : ''}
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         04 · STRATEGIC VERDICT CARD (Founder + Investor)
         ═══════════════════════════════════════════════ -->
    ${!isBasic && d.strategic_verdict ? `
    ${pageStart('Strategic Verdict')}
        <div class="verdict-card">
            <div class="vc-headline">${esc(txt(d.strategic_verdict.headline, txt(meta.one_line_verdict)))}</div>
            <div class="vc-body">${esc(txt(d.strategic_verdict.body))}</div>
            <span class="vc-badge badge-${(d.strategic_verdict.confidence_badge || exec.pricing_verdict?.confidence_level || '').toLowerCase() === 'high' ? 'green' : 'orange'}">
                Confidence: ${esc(txt(d.strategic_verdict.confidence_badge || exec.pricing_verdict?.confidence_level, 'Medium'))}
            </span>
        </div>

        <!-- Price Comparison Chart -->
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Price Point Comparison')}</div>
            <div class="chart-container">
                ${generateBarChartSVG(
                    ['Cost Base', 'Entry Floor', 'Optimal', 'Premium'],
                    [costBase, budget, recommended, premium],
                    2
                )}
            </div>
            ${trackSource('PricePoint Pricing Engine — algorithmic output')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         BASIC ONLY: Price Recommendation + Rationale
         ═══════════════════════════════════════════════ -->
    ${isBasic && d.pricing_analysis ? `
    ${pageStart('Price Recommendation')}
        <h2 class="section-title">Price Recommendation &amp; Rationale</h2>
        <p class="section-subtitle">Detailed commentary on your three pricing tiers</p>

        <div class="callout" style="margin-bottom: 20px;">
            <div class="callout-label">Recommended Anchor: <span class="badge badge-teal">${esc(txt(d.pricing_analysis.recommended_anchor, 'best')).toUpperCase()}</span></div>
            <p style="margin: 6px 0 0 0; font-size: 14px;">${esc(txt(d.pricing_analysis.anchor_rationale))}</p>
        </div>

        <h3 class="subsection-title">Survival Price Commentary</h3>
        <p class="paragraph">${esc(txt(d.pricing_analysis.survival_commentary))}</p>
        <h3 class="subsection-title">Best Price Commentary</h3>
        <p class="paragraph">${esc(txt(d.pricing_analysis.best_price_commentary))}</p>
        <h3 class="subsection-title">Premium Price Commentary</h3>
        <p class="paragraph">${esc(txt(d.pricing_analysis.premium_price_commentary))}</p>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         05 · VAN WESTENDORP VISUAL + INTERPRETATION (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${pr.analysis?.vanWestendorp ? `
    ${pageStart('Van Westendorp Analysis')}
        <h2 class="section-title">Van Westendorp Price Sensitivity</h2>
        <p class="section-subtitle">Price sensitivity meter — identifying your optimal pricing zone</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Van Westendorp PSM')}</div>
            <div class="chart-container">${generateVanWestendorpSVG(pr.analysis.vanWestendorp, cs)}</div>
            <table class="voya-table" style="margin-top: 14px;">
                <thead><tr><th>Point</th><th>Value</th><th>What It Means</th></tr></thead>
                <tbody>
                    <tr><td>OPP (Floor)</td><td class="text-teal">${cs}${fmt(num(pr.analysis.vanWestendorp.opp || pr.analysis.vanWestendorp.floor))}</td><td style="font-weight:400;">Your recommended launch price</td></tr>
                    <tr><td>IPP</td><td class="text-teal">${cs}${fmt(num(pr.analysis.vanWestendorp.ipp))}</td><td style="font-weight:400;">Customers are indifferent — neither impressed nor put off</td></tr>
                    <tr><td>PMC</td><td class="text-teal">${cs}${fmt(num(pr.analysis.vanWestendorp.pmc))}</td><td style="font-weight:400;">Below this, customers think the product is too cheap to be credible</td></tr>
                    <tr><td>PME (Ceiling)</td><td class="text-teal">${cs}${fmt(num(pr.analysis.vanWestendorp.pme || pr.analysis.vanWestendorp.ceiling))}</td><td style="font-weight:400;">Above this, most customers walk away</td></tr>
                </tbody>
            </table>
            ${trackSource('Van Westendorp Price Sensitivity Meter')}
        </div>

        ${isBasic && txt(d.van_westendorp_interpretation) ? `
        <h3 class="subsection-title">Interpretation</h3>
        <p class="paragraph">${esc(d.van_westendorp_interpretation)}</p>` : ''}

        ${!isBasic && txt(d.market_analysis?.willingness_to_pay_analysis) ? `
        <h3 class="subsection-title">Willingness to Pay Analysis</h3>
        <p class="paragraph">${esc(d.market_analysis.willingness_to_pay_analysis)}</p>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         06 · COST BREAKDOWN + GROSS MARGIN (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${pageStart('Cost Breakdown')}
        <h2 class="section-title">${provDot('cost_breakdown')} Cost Breakdown &amp; Gross Margin</h2>
        <p class="section-subtitle">${totalUnitCost > 0 ? 'Unit cost structure and margin analysis' : 'Unit cost data not provided — margin calculations require cost input'}</p>

        ${totalUnitCost === 0 ? `
        <div class="data-not-provided">
            <div class="dnp-label">⚠ Cost Data Not Provided</div>
            <p>You did not provide unit economics data. The margin and profit figures in this section require cost input. Re-run your analysis with cost data to unlock accurate margin analysis.</p>
        </div>` : ''}

        <div class="voya-two-col">
            <div>
                <div class="exhibit-box">
                    <div class="exhibit-header">${nextExhibit('Unit Cost Structure')}</div>
                    <div class="kpi-row">
                        <div class="kpi-item">
                            <div class="kpi-value">${totalUnitCost > 0 ? `${cs}${fmt(totalUnitCost)}` : 'Not provided'}</div>
                            <div class="kpi-label">Total Unit Cost</div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-value">${cs}${fmt(costBase)}</div>
                            <div class="kpi-label">Cost-Plus Base</div>
                        </div>
                    </div>
                    <div class="kpi-row">
                        <div class="kpi-item">
                            <div class="kpi-value">${valueMult.toFixed(2)}x</div>
                            <div class="kpi-label">Value Multiplier</div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-value">${totalUnitCost > 0 ? `${margin.toFixed(1)}%` : 'N/A'}</div>
                            <div class="kpi-label">Gross Margin</div>
                        </div>
                    </div>
                    ${trackSource('PricePoint Unit Economics')}
                </div>
            </div>
            <div>
                ${totalUnitCost > 0 ? `
                <div class="exhibit-box">
                    <div class="exhibit-header">${nextExhibit('Cost vs. Margin')}</div>
                    ${generateDonutChartSVG([
                        { label: 'Unit Cost', value: totalUnitCost, color: V.gray },
                        { label: 'Margin', value: Math.max(recommended - totalUnitCost, 0), color: V.teal },
                    ], 'Cost vs. Margin')}
                </div>` : ''}
            </div>
        </div>

        ${isBasic && txt(d.cost_breakdown_narrative) ? `
        <h3 class="subsection-title">Cost Structure Analysis</h3>
        <p class="paragraph">${esc(d.cost_breakdown_narrative)}</p>` : ''}

        ${isBasic && txt(d.gross_margin_commentary) ? `
        <h3 class="subsection-title">Gross Margin Commentary</h3>
        <p class="paragraph">${esc(d.gross_margin_commentary)}</p>` : ''}

        ${!isBasic && txt(d.unit_economics?.narrative) ? `
        <h3 class="subsection-title">Unit Economics Analysis</h3>
        <p class="paragraph">${esc(d.unit_economics.narrative)}</p>
        ${txt(d.unit_economics.gross_margin_analysis) ? `<p class="paragraph">${esc(d.unit_economics.gross_margin_analysis)}</p>` : ''}` : ''}
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         07 · BREAKEVEN TABLE (All Tiers)
         ═══════════════════════════════════════════════ -->
    ${totalUnitCost > 0 ? `
    ${pageStart('Breakeven Analysis')}
        <h2 class="section-title">Breakeven Analysis</h2>
        <p class="section-subtitle">Customers needed at each price point to cover costs</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Breakeven Table')}</div>
            <table class="voya-table">
                <thead><tr>
                    <th>Price Point</th><th>Price</th><th>Gross Margin %</th><th>Customers to Cover Monthly Costs</th><th>Months to Recover Dev Investment</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td>Entry (Floor)</td>
                        <td class="text-teal">${cs}${fmt(budget)}</td>
                        <td style="font-weight:400;">${budget > 0 ? ((budget - totalUnitCost) / budget * 100).toFixed(1) : '0'}%</td>
                        <td style="font-weight:400;">${budget > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (budget - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:400;">${budget > totalUnitCost ? Math.ceil(totalUnitCost * 50 / (budget - totalUnitCost)) : '\u221E'}</td>
                    </tr>
                    <tr class="highlight-row">
                        <td><strong>Optimal (Recommended)</strong></td>
                        <td class="text-teal"><strong>${cs}${fmt(recommended)}</strong></td>
                        <td style="font-weight:600;">${recommended > 0 ? ((recommended - totalUnitCost) / recommended * 100).toFixed(1) : '0'}%</td>
                        <td style="font-weight:600;">${recommended > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (recommended - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:600;">${recommended > totalUnitCost ? Math.ceil(totalUnitCost * 50 / (recommended - totalUnitCost)) : '\u221E'}</td>
                    </tr>
                    <tr>
                        <td>Premium (Anchor)</td>
                        <td class="text-teal">${cs}${fmt(premium)}</td>
                        <td style="font-weight:400;">${premium > 0 ? ((premium - totalUnitCost) / premium * 100).toFixed(1) : '0'}%</td>
                        <td style="font-weight:400;">${premium > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (premium - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:400;">${premium > totalUnitCost ? Math.ceil(totalUnitCost * 50 / (premium - totalUnitCost)) : '\u221E'}</td>
                    </tr>
                </tbody>
            </table>
            <p class="footnote">Based on total unit cost of ${cs}${fmt(totalUnitCost)}. Monthly cost coverage assumes 10x operating overhead. Dev recovery assumes 50x unit cost.</p>
            ${trackSource('PricePoint Breakeven Analysis')}
        </div>

        ${isBasic && txt(d.cost_of_inaction) ? `
        <div class="inaction-callout">
            <div class="ic-label">Cost of Inaction</div>
            <div class="ic-calc">${esc(d.cost_of_inaction)}</div>
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         BASIC ONLY: Top Risks + Next Steps
         ═══════════════════════════════════════════════ -->
    ${isBasic ? `
    ${pageStart('Risks &amp; Next Steps')}
        <h2 class="section-title">Top Risks &amp; Mitigations</h2>
        <p class="section-subtitle">Key risks to monitor and strategies to mitigate them</p>
        ${arr(d.top_risks).map((risk: any) => `
        <div class="exhibit-box" style="border-left: 4px solid ${risk.severity === 'High' ? V.red : risk.severity === 'Medium' ? V.orange : V.green};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color: var(--voya-dark); font-size: 14px;">${esc(risk.risk || '')}</strong>
                <span class="badge badge-${risk.severity === 'High' ? 'red' : risk.severity === 'Medium' ? 'orange' : 'green'}">${esc(risk.severity || '')}</span>
            </div>
            <p class="paragraph" style="margin-top: 6px; font-size: 13px;">${esc(risk.mitigation || '')}</p>
        </div>`).join('')}

        <hr class="voya-divider">

        <h2 class="section-title">Next Steps</h2>
        <p class="section-subtitle">Prioritised actions to take now</p>
        ${arr(d.next_steps).map((step: string, i: number) => `
        <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
            <div style="min-width:32px;height:32px;border-radius:50%;background:${V.teal};color:#FFF;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">${i + 1}</div>
            <p class="paragraph" style="margin:4px 0 0 0;">${esc(step)}</p>
        </div>`).join('')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: TAM/SAM Market Sizing
         ═══════════════════════════════════════════════ -->
    ${!isBasic ? `
    ${pageStart('Market Sizing')}
        <h2 class="section-title">Market Sizing — TAM / SAM${isInvestor ? ' / SOM' : ''}</h2>
        <p class="section-subtitle">Total addressable market analysis and sizing estimates</p>

        <div class="flowing-two-col">
            <h4 class="subsection-title" style="font-size: 14px; margin-top: 0;">Market Analysis</h4>
            <p class="paragraph" style="font-size: 13px;">${esc(txt(d.market_analysis?.market_narrative || d.marketAnalysis))}</p>
            ${d.market_analysis?.willingness_to_pay_analysis ? `
            <h4 class="subsection-title" style="font-size: 14px;">Willingness to Pay</h4>
            <p class="paragraph" style="font-size: 13px;">${esc(d.market_analysis.willingness_to_pay_analysis)}</p>` : ''}
        </div>

        ${d.market_analysis?.tam_analysis || d.market_analysis?.tam_sam_narrative ? `
        <div class="callout teal" style="margin-top: 14px;">
            <div class="callout-label">TAM/SAM${isInvestor ? '/SOM' : ''} Analysis</div>
            <p style="margin: 6px 0 0 0; font-size: 13px;">${esc(txt(d.market_analysis.tam_sam_narrative || d.market_analysis.tam_analysis))}</p>
        </div>` : ''}

        ${trackSource('PricePoint Market Intelligence Module')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Market Timing Assessment
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.market_analysis?.market_timing_assessment ? `
    ${pageStart('Market Timing')}
        <h2 class="section-title">Market Timing Assessment</h2>
        <p class="section-subtitle">Macro-economic and competitive timing analysis for market entry</p>

        <div class="exhibit-box">
            <p class="paragraph">${esc(d.market_analysis.market_timing_assessment)}</p>
            <p class="source-note">AI-generated market timing analysis</p>
            ${trackSource('AI-generated market timing analysis')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Competitive Benchmark Table
         ═══════════════════════════════════════════════ -->
    ${!isBasic ? `
    ${pageStart('Competitive Benchmark')}
        <h2 class="section-title">${provDot('competitive_benchmark')} Competitive Benchmark</h2>
        <p class="section-subtitle">How your pricing compares to key competitors in the market</p>

        ${d.competitive_positioning?.benchmark_table && arr(d.competitive_positioning.benchmark_table).length > 0 && !d.competitive_positioning?._stripped ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Competitive Benchmark')}</div>

            <!-- Horizontal Bar Comparison -->
            ${(() => {
                const benchmarks = arr(d.competitive_positioning.benchmark_table);
                const barItems = benchmarks.map((row: any) => ({
                    label: row.competitor || 'Unknown',
                    value: parseFloat(String(row.estimated_price || '0').replace(/[^0-9.]/g, '')) || 0,
                    color: V.gray,
                }));
                barItems.push({ label: 'Your Product', value: recommended, color: V.teal });
                return barItems.some((b: any) => b.value > 0) ?
                    `<div class="chart-container">${generateHorizontalBarSVG(barItems)}</div>` : '';
            })()}

            <table class="voya-table">
                <thead><tr>
                    <th>Competitor</th><th>Est. Price</th><th>Positioning</th><th>Your Advantage</th>
                </tr></thead>
                <tbody>
                    ${arr(d.competitive_positioning.benchmark_table).map((row: any) => `
                    <tr>
                        <td>${esc(row.competitor || '')}</td>
                        <td>${esc(row.estimated_price || '')}</td>
                        <td style="font-weight:400;">${esc(row.positioning || '')}</td>
                        <td style="font-weight:400;">${esc(row.your_advantage || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="source-note">Competitive intelligence based on user-provided data and AI analysis</p>
            ${trackSource('Competitive intelligence based on user-provided data and AI analysis')}
        </div>
        ` : `
        <div class="data-not-provided">
            <div class="dnp-label">⚠ No Verified Competitor Data</div>
            <p>Competitor pricing data was not provided or scraped. The positioning framework below uses industry-typical price bands derived from your Van Westendorp analysis, not specific company data. Enable competitor discovery to populate with real market data.</p>
        </div>
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Positioning Tier Framework')}</div>
            <table class="voya-table">
                <thead><tr>
                    <th>Positioning Tier</th><th>Typical Price Range</th><th>Description</th>
                </tr></thead>
                <tbody>
                    <tr><td>Budget</td><td>Below ${cs}${fmt(num(pr.analysis?.vanWestendorp?.pmc ?? pr.analysis?.vanWestendorp?.floor))}</td><td>Price-driven segment, minimal differentiation</td></tr>
                    <tr><td>Value</td><td>${cs}${fmt(num(pr.analysis?.vanWestendorp?.pmc ?? pr.analysis?.vanWestendorp?.floor))} – ${cs}${fmt(num(pr.analysis?.vanWestendorp?.opp))}</td><td>Balance of price and perceived value</td></tr>
                    <tr class="highlight-row"><td><strong>Premium</strong></td><td><strong>${cs}${fmt(num(pr.analysis?.vanWestendorp?.opp))} – ${cs}${fmt(num(pr.analysis?.vanWestendorp?.pme ?? pr.analysis?.vanWestendorp?.ceiling))}</strong></td><td>Differentiated offering, brand/feature premium</td></tr>
                    <tr><td>Ultra-Premium</td><td>Above ${cs}${fmt(num(pr.analysis?.vanWestendorp?.pme ?? pr.analysis?.vanWestendorp?.ceiling))}</td><td>Luxury/niche positioning, high switching costs</td></tr>
                </tbody>
            </table>
            <p class="footnote">Price bands derived from Van Westendorp PSM analysis (PMC, OPP, PME). Not based on competitor data.</p>
            ${trackSource('PricePoint Van Westendorp-derived positioning tiers')}
        </div>
        `}

        ${txt(d.market_analysis?.competitive_landscape || d.competitive_positioning?.narrative || d.competitivePositioning) ? `
        <div class="flowing-two-col" style="margin-top: 16px;">
            <h4 class="subsection-title" style="font-size: 14px; margin-top: 0;">Competitive Landscape</h4>
            <p class="paragraph" style="font-size: 13px;">${esc(txt(d.market_analysis?.competitive_landscape || d.competitive_positioning?.narrative || d.competitivePositioning))}</p>
        </div>` : ''}
        ${trackSource('AI-generated competitive analysis')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Positioning Map
         ═══════════════════════════════════════════════ -->
    ${!isBasic && arr(d.market_analysis?.positioning_map).length > 0 ? `
    ${pageStart('Positioning Map')}
        <h2 class="section-title">Positioning Map</h2>
        <p class="section-subtitle">Price vs. value positioning relative to competitors</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Competitive Positioning Map')}</div>
            <div class="chart-container">
                ${generatePositioningMapSVG(
                    [...arr(d.market_analysis.positioning_map).map((p: any) => ({
                        name: p.name || p.competitor || '',
                        price: num(p.price),
                        value_score: num(p.value_score),
                    })), {
                        name: 'Your Product',
                        price: recommended,
                        value_score: num(d.market_analysis.positioning_map?.[0]?.value_score || 7) * 1.15,
                    }],
                    cs
                )}
            </div>
            <p class="footnote">Larger dot = your product. Positioned by price (X) and perceived value score (Y).</p>
            <p class="source-note">PricePoint Positioning Analysis</p>
            ${trackSource('PricePoint Positioning Analysis')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Feature-to-Price Mapping
         ═══════════════════════════════════════════════ -->
    ${isInvestor && arr(d.market_analysis?.feature_price_mapping).length > 0 ? `
    ${pageStart('Feature-Price Mapping')}
        <h2 class="section-title">Feature-to-Price Mapping</h2>
        <p class="section-subtitle">How specific features drive pricing power across tiers</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Feature-Price Mapping')}</div>
            <table class="voya-table">
                <thead><tr>
                    <th>Feature</th><th>Price Impact</th><th>Customer Value</th><th>Tier Recommendation</th>
                </tr></thead>
                <tbody>
                    ${arr(d.market_analysis.feature_price_mapping).map((f: any) => `
                    <tr>
                        <td>${esc(f.feature || '')}</td>
                        <td style="font-weight:400;">${esc(f.price_impact || '')}</td>
                        <td style="font-weight:400;">${esc(f.customer_value || '')}</td>
                        <td style="font-weight:400;">${esc(f.tier_recommendation || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="source-note">AI-generated feature-price analysis</p>
            ${trackSource('AI-generated feature-price analysis')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Competitive Moat Assessment
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.competitive_positioning?.competitive_moat_assessment ? `
    ${pageStart('Competitive Moat')}
        <h2 class="section-title">Competitive Moat Assessment</h2>
        <p class="section-subtitle">Defensibility analysis of your competitive positioning</p>

        <div class="exhibit-box">
            <p class="paragraph">${esc(typeof d.competitive_positioning.competitive_moat_assessment === 'string'
                ? d.competitive_positioning.competitive_moat_assessment
                : txt(d.competitive_positioning.competitive_moat_assessment?.narrative || d.competitive_positioning.competitive_moat_assessment?.assessment || ''))}</p>

            ${typeof d.competitive_positioning.competitive_moat_assessment === 'object' && arr(d.competitive_positioning.competitive_moat_assessment?.moat_factors).length > 0 ? `
            <table class="voya-table" style="margin-top: 14px;">
                <thead><tr>
                    <th>Moat Factor</th><th>Strength</th><th>Description</th>
                </tr></thead>
                <tbody>
                    ${arr(d.competitive_positioning.competitive_moat_assessment.moat_factors).map((m: any) => `
                    <tr>
                        <td>${esc(m.factor || '')}</td>
                        <td><span class="badge badge-${(m.strength || '').toLowerCase() === 'strong' ? 'green' : (m.strength || '').toLowerCase() === 'weak' ? 'red' : 'orange'}">${esc(m.strength || '')}</span></td>
                        <td style="font-weight:400;">${esc(m.description || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>` : ''}
            <p class="source-note">PricePoint Competitive Moat Analysis</p>
            ${trackSource('PricePoint Competitive Moat Analysis')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: LTV / CAC / Payback Analysis
         ═══════════════════════════════════════════════ -->
    ${!isBasic && d.unit_economics ? `
    ${pageStart('Unit Economics')}
        <h2 class="section-title">LTV · CAC · Payback${isInvestor ? ' · Rule of 40' : ''} Analysis</h2>
        <p class="section-subtitle">Unit economics health check and customer lifetime value analysis</p>

        <div class="voya-two-col">
            <div>
                <div class="exhibit-box">
                    <div class="exhibit-header">${nextExhibit('Unit Economics')}</div>
                    <p class="paragraph" style="font-size: 13px;">${esc(txt(d.unit_economics.narrative))}</p>

                    ${d.unit_economics.health_score ? `
                    <div style="text-align:center;margin:12px 0;">
                        ${generateGaugeSVG(
                            d.unit_economics.health_score === 'Strong' ? 85 :
                            d.unit_economics.health_score === 'Moderate' ? 55 :
                            d.unit_economics.health_score === 'Critical' ? 25 : 50,
                            100, 'Economics Health'
                        )}
                    </div>
                    <div class="callout ${d.unit_economics.health_score === 'Strong' ? 'green' : d.unit_economics.health_score === 'Critical' ? 'red' : ''}">
                        <div class="callout-label">Health Score: <span class="badge badge-${d.unit_economics.health_score === 'Strong' ? 'green' : d.unit_economics.health_score === 'Critical' ? 'red' : 'orange'}">${esc(d.unit_economics.health_score)}</span></div>
                        <p class="footnote" style="margin-top: 4px;">${esc(txt(d.unit_economics.health_rationale, ''))}</p>
                    </div>` : ''}
                    <p class="source-note">PricePoint Unit Economics Module</p>
                    ${trackSource('PricePoint Unit Economics Module')}
                </div>
            </div>
            <div>
                <div class="exhibit-box">
                    <div class="exhibit-header">${nextExhibit('Key Metrics')}</div>
                    <div class="kpi-row" style="flex-wrap:wrap;">
                        <div class="kpi-item">
                            <div class="kpi-value">${cs}${fmtK(d.unit_economics.estimated_ltv)}</div>
                            <div class="kpi-label">Est. LTV</div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-value">${num(d.unit_economics.estimated_ltv_cac_ratio).toFixed(1)}x</div>
                            <div class="kpi-label">LTV:CAC</div>
                        </div>
                    </div>
                    <div class="kpi-row" style="flex-wrap:wrap;">
                        <div class="kpi-item">
                            <div class="kpi-value">${num(d.unit_economics.payback_period_months)}mo</div>
                            <div class="kpi-label">Payback Period</div>
                        </div>
                        ${isInvestor && d.unit_economics.breakeven_units ? `
                        <div class="kpi-item">
                            <div class="kpi-value">${esc(String(d.unit_economics.breakeven_units))}</div>
                            <div class="kpi-label">Breakeven Units</div>
                        </div>` : `
                        <div class="kpi-item">
                            <div class="kpi-value">${margin.toFixed(0)}%</div>
                            <div class="kpi-label">Gross Margin</div>
                        </div>`}
                    </div>

                    ${totalUnitCost > 0 ? `
                    <div style="margin-top: 16px;">
                        ${generateDonutChartSVG([
                            { label: 'Unit Cost', value: totalUnitCost, color: V.gray },
                            { label: 'Margin', value: Math.max(recommended - totalUnitCost, 0), color: V.teal },
                        ], 'Cost vs. Margin')}
                    </div>` : ''}
                    <p class="source-note">Derived from pricing engine calculations</p>
                    ${trackSource('Derived from pricing engine calculations')}
                </div>
            </div>
        </div>

        ${isInvestor && d.unit_economics?.investor_lens_commentary ? `
        <div class="pull-quote">
            ${esc(d.unit_economics.investor_lens_commentary)}
            <span class="attribution">Investor Lens Analysis</span>
        </div>` : ''}

        ${isInvestor && d.unit_economics?.rule_of_40 ? `
        <div class="exhibit-box" style="margin-top: 18px;">
            <div class="exhibit-header">${nextExhibit('Rule of 40 Assessment')}</div>
            <div style="display:flex;gap:28px;align-items:center;">
                <div style="text-align:center;">
                    ${generateRuleOf40GaugeSVG(num(d.unit_economics.rule_of_40.score || d.unit_economics.rule_of_40.combined_score))}
                </div>
                <div style="flex:1;">
                    <div class="kpi-row" style="flex-wrap:wrap;margin-bottom:12px;">
                        <div class="kpi-item">
                            <div class="kpi-value">${num(d.unit_economics.rule_of_40.revenue_growth_pct).toFixed(0)}%</div>
                            <div class="kpi-label">Revenue Growth</div>
                        </div>
                        <div class="kpi-item">
                            <div class="kpi-value">${num(d.unit_economics.rule_of_40.profit_margin_pct).toFixed(0)}%</div>
                            <div class="kpi-label">Profit Margin</div>
                        </div>
                    </div>
                    <p class="paragraph" style="font-size: 13px;">${esc(txt(d.unit_economics.rule_of_40.interpretation, 'The Rule of 40 states that a SaaS company\'s growth rate plus profit margin should exceed 40%.'))}</p>
                </div>
            </div>
            <p class="source-note">PricePoint Rule of 40 Assessment</p>
            ${trackSource('PricePoint Rule of 40 Assessment')}
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Revenue Scenario Table
         ═══════════════════════════════════════════════ -->
    ${!isBasic ? `
    ${pageStart('Revenue Scenarios')}
        <h2 class="section-title">Revenue Scenario Projection</h2>
        <p class="section-subtitle">Projected revenue across three volume scenarios</p>

        ${arr(d.financial_scenarios?.scenarios).length > 0 ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Revenue Scenario Projection')}</div>
            <p class="paragraph" style="font-size: 13px;">${esc(txt(d.financial_scenarios?.narrative, 'Projected monthly and annual revenue at the optimal price point across three volume scenarios.'))}</p>
            <table class="voya-table">
                <thead><tr>
                    <th>Metric</th>
                    ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<th>${esc(sc.name || '')}</th>`).join('')}
                </tr></thead>
                <tbody>
                    <tr>
                        <td>Price</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td class="text-teal">${cs}${num(sc.price_point).toFixed(0)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Monthly Customers</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td style="font-weight:400;">${fmtK(sc.monthly_customers || 0)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>MRR</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td style="font-weight:400;">${cs}${fmtK(sc.mrr_month_6 || num(sc.price_point) * num(sc.monthly_customers))}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>ARR (Year 1)</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any, i: number) => `<td ${i === 1 ? 'class="text-teal" style="font-weight:700;"' : 'style="font-weight:400;"'}>${cs}${fmtK(sc.arr_year_1)}</td>`).join('')}
                    </tr>
                    <tr>
                        <td>Gross Profit</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td style="font-weight:400;">${cs}${fmtK(sc.gross_profit || 0)}</td>`).join('')}
                    </tr>
                    ${isInvestor ? `<tr>
                        <td>Implied CAC Budget</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td style="font-weight:400;">${cs}${fmtK(sc.implied_cac_budget || 0)}</td>`).join('')}
                    </tr>` : ''}
                    <tr>
                        <td>Key Assumption</td>
                        ${arr(d.financial_scenarios.scenarios).map((sc: any) => `<td style="font-weight:400;font-size:12px;">${esc(sc.key_assumption || '')}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
            ${trackSource('PricePoint Revenue Scenario Projection')}
        </div>
        ` : `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Revenue Scenario Projection')}</div>
            <p class="paragraph" style="font-size: 13px;">Projected monthly and annual revenue at the optimal price point across three volume scenarios.</p>
            <table class="voya-table">
                <thead><tr>
                    <th>Metric</th><th>Conservative (10)</th><th>Base Case (50)</th><th>Optimistic (200)</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td>Monthly Revenue (MRR)</td>
                        <td style="font-weight:400;">${cs}${fmtK(recommended * 10)}</td>
                        <td style="font-weight:400;">${cs}${fmtK(recommended * 50)}</td>
                        <td style="font-weight:400;">${cs}${fmtK(recommended * 200)}</td>
                    </tr>
                    <tr>
                        <td>Annual Revenue (ARR)</td>
                        <td style="font-weight:400;">${cs}${fmtK(recommended * 10 * 12)}</td>
                        <td class="text-teal" style="font-weight:700;">${cs}${fmtK(recommended * 50 * 12)}</td>
                        <td style="font-weight:400;">${cs}${fmtK(recommended * 200 * 12)}</td>
                    </tr>
                    ${totalUnitCost > 0 ? `
                    <tr>
                        <td>Gross Profit (Annual)</td>
                        <td style="font-weight:400;">${cs}${fmtK(Math.max(recommended - totalUnitCost, 0) * 10 * 12)}</td>
                        <td style="font-weight:400;">${cs}${fmtK(Math.max(recommended - totalUnitCost, 0) * 50 * 12)}</td>
                        <td style="font-weight:400;">${cs}${fmtK(Math.max(recommended - totalUnitCost, 0) * 200 * 12)}</td>
                    </tr>
                    <tr>
                        <td>Gross Margin</td>
                        <td colspan="3" style="font-weight:400; text-align: center;"><strong class="text-teal">${margin.toFixed(1)}%</strong> across all scenarios (price-independent)</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
            <p class="footnote">Projections based on optimal price of ${cs}${fmt(recommended)}${totalUnitCost > 0 ? ` and unit cost of ${cs}${fmt(totalUnitCost)}` : ''}.</p>
            ${trackSource('PricePoint Revenue Scenario Projection')}
        </div>
        `}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Cost of Inaction
         ═══════════════════════════════════════════════ -->
    ${!isBasic && (d.cost_of_inaction || (typeof d.cost_of_inaction === 'object' && d.cost_of_inaction)) ? `
    ${pageStart('Cost of Inaction')}
        <h2 class="section-title">Cost of Inaction</h2>
        <p class="section-subtitle">The financial impact of maintaining current pricing or delaying action</p>

        <div class="inaction-callout">
            <div class="ic-label">Cost of Inaction</div>
            ${typeof d.cost_of_inaction === 'object' ? `
            <div class="ic-number">${esc(txt(d.cost_of_inaction.headline_number, ''))}</div>
            ${d.cost_of_inaction.calculation ? `<p style="font-size: 13px; color: var(--voya-gray); margin: 4px 0 10px 0;">${esc(d.cost_of_inaction.calculation)}</p>` : ''}
            <div class="ic-calc">${esc(txt(d.cost_of_inaction.narrative, ''))}</div>
            ` : `
            <div class="ic-calc">${esc(String(d.cost_of_inaction))}</div>
            `}
        </div>
        ${trackSource('PricePoint Cost of Inaction Analysis')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Price Recommendation + Rationale
         ═══════════════════════════════════════════════ -->
    ${!isBasic && d.pricing_strategy ? `
    ${pageStart('Price Recommendation')}
        <h2 class="section-title">Price Recommendation &amp; Rationale</h2>
        <p class="section-subtitle">Strategic pricing recommendation based on comprehensive analysis</p>

        <p class="paragraph">${esc(txt(d.pricing_strategy.strategy_narrative))}</p>

        <div class="exhibit-box" style="margin-top: 18px;">
            <div class="exhibit-header">${nextExhibit('Recommended Price Point')}</div>
            <div class="kpi-row" style="justify-content:center;gap:32px;">
                <div class="kpi-item">
                    <div class="kpi-value" style="color:${V.gray};">${cs}${fmt(budget)}</div>
                    <div class="kpi-label">Floor (Entry)</div>
                </div>
                <div class="kpi-item" style="border:2px solid ${V.teal};border-radius:10px;padding:12px 20px;">
                    <div class="kpi-value" style="font-size:28px;">${cs}${fmt(recommended)}</div>
                    <div class="kpi-label">Recommended</div>
                </div>
                <div class="kpi-item">
                    <div class="kpi-value" style="color:${V.gray};">${cs}${fmt(premium)}</div>
                    <div class="kpi-label">Premium</div>
                </div>
            </div>
            ${trackSource('PricePoint Pricing Engine Recommendation')}
        </div>

        <!-- Breakeven Analysis Table -->
        ${totalUnitCost > 0 ? `
        <div class="exhibit-box" style="margin-top: 18px;">
            <div class="exhibit-header">${nextExhibit('Breakeven Analysis')}</div>
            <p class="paragraph" style="font-size: 13px;">Number of customers needed at each price point to cover monthly fixed costs.</p>
            <table class="voya-table">
                <thead><tr>
                    <th>Price Point</th><th>Price</th><th>Gross Margin %</th><th>Customers to Breakeven</th><th>Months to Recover Dev</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td>Entry (Floor)</td>
                        <td class="text-teal">${cs}${fmt(budget)}</td>
                        <td style="font-weight:400;">${budget > 0 ? ((Math.max(budget - totalUnitCost, 0) / budget) * 100).toFixed(1) : '0.0'}%</td>
                        <td style="font-weight:400;">${budget > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (budget - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:400;">${budget > totalUnitCost ? Math.ceil(totalUnitCost * 120 / ((budget - totalUnitCost) * 10)) : '\u221E'}mo</td>
                    </tr>
                    <tr class="highlight-row">
                        <td><strong>Optimal (Recommended)</strong></td>
                        <td class="text-teal"><strong>${cs}${fmt(recommended)}</strong></td>
                        <td style="font-weight:600;">${recommended > 0 ? ((Math.max(recommended - totalUnitCost, 0) / recommended) * 100).toFixed(1) : '0.0'}%</td>
                        <td style="font-weight:600;">${recommended > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (recommended - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:600;">${recommended > totalUnitCost ? Math.ceil(totalUnitCost * 120 / ((recommended - totalUnitCost) * 10)) : '\u221E'}mo</td>
                    </tr>
                    <tr>
                        <td>Premium (Anchor)</td>
                        <td class="text-teal">${cs}${fmt(premium)}</td>
                        <td style="font-weight:400;">${premium > 0 ? ((Math.max(premium - totalUnitCost, 0) / premium) * 100).toFixed(1) : '0.0'}%</td>
                        <td style="font-weight:400;">${premium > totalUnitCost ? Math.ceil(totalUnitCost * 10 / (premium - totalUnitCost)) : '\u221E'}</td>
                        <td style="font-weight:400;">${premium > totalUnitCost ? Math.ceil(totalUnitCost * 120 / ((premium - totalUnitCost) * 10)) : '\u221E'}mo</td>
                    </tr>
                </tbody>
            </table>
            <p class="footnote">Based on total unit cost of ${cs}${fmt(totalUnitCost)}. Breakeven assumes 10x monthly cost coverage.</p>
            ${trackSource('PricePoint Breakeven Analysis')}
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Pricing Tier Architecture
         ═══════════════════════════════════════════════ -->
    ${!isBasic && arr(d.pricing_strategy?.pricing_tiers_suggestion).length > 0 ? `
    ${pageStart('Pricing Tiers')}
        <h2 class="section-title">Pricing Tier Architecture</h2>
        <p class="section-subtitle">Recommended multi-tier pricing structure</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Recommended Pricing Tiers')}</div>

            <div class="chart-container">
                ${generateHorizontalBarSVG(
                    arr(d.pricing_strategy.pricing_tiers_suggestion).map((t: any, i: number) => ({
                        label: t.tier_name || `Tier ${i + 1}`,
                        value: num(t.price),
                        color: i === 0 ? V.teal : i === 1 ? V.orange : V.gray,
                    }))
                )}
            </div>

            <table class="voya-table">
                <thead><tr>
                    <th>Tier</th><th>Price</th><th>Target Segment</th><th>Key Value Prop</th>
                </tr></thead>
                <tbody>
                    ${arr(d.pricing_strategy.pricing_tiers_suggestion).map((t: any) => `
                    <tr>
                        <td>${esc(t.tier_name || '')}</td>
                        <td class="text-teal">${cs}${num(t.price).toFixed(0)}</td>
                        <td style="font-weight:400;">${esc(t.target_segment || '')}</td>
                        <td style="font-weight:400;">${esc(t.key_value_prop || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="source-note">PricePoint Strategy Module — AI-generated tier recommendations</p>
            ${trackSource('PricePoint Strategy Module — AI-generated tier recommendations')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Launch vs Scale Pricing
         ═══════════════════════════════════════════════ -->
    ${!isBasic && d.pricing_strategy?.launch_vs_scale ? `
    ${pageStart('Launch vs. Scale')}
        <h2 class="section-title">Launch vs. Scale Pricing</h2>
        <p class="section-subtitle">How your pricing should evolve from launch through growth</p>

        <div class="voya-two-col">
            <div class="exhibit-box">
                <div class="exhibit-header">${nextExhibit('Launch Phase')}</div>
                <div class="kpi-row" style="justify-content:center;">
                    <div class="kpi-item">
                        <div class="kpi-value">${cs}${num(d.pricing_strategy.launch_vs_scale.launch_price).toFixed(0)}</div>
                        <div class="kpi-label">Launch Price</div>
                    </div>
                </div>
                <p class="paragraph" style="font-size: 13px; margin-top: 10px;">${esc(txt(d.pricing_strategy.launch_vs_scale.launch_rationale, ''))}</p>
            </div>
            <div class="exhibit-box">
                <div class="exhibit-header">${nextExhibit('Scale Phase')}</div>
                <div class="kpi-row" style="justify-content:center;">
                    <div class="kpi-item">
                        <div class="kpi-value">${cs}${num(d.pricing_strategy.launch_vs_scale.scale_price).toFixed(0)}</div>
                        <div class="kpi-label">Scale Price</div>
                    </div>
                </div>
                <p class="paragraph" style="font-size: 13px; margin-top: 10px;">${esc(txt(d.pricing_strategy.launch_vs_scale.scale_rationale, ''))}</p>
            </div>
        </div>

        ${d.pricing_strategy.launch_vs_scale.transition_trigger ? `
        <div class="callout teal" style="margin-top: 14px;">
            <div class="callout-label">Transition Trigger</div>
            <p style="margin: 6px 0 0 0; font-size: 13px;">${esc(d.pricing_strategy.launch_vs_scale.transition_trigger)}</p>
        </div>` : ''}
        ${trackSource('PricePoint Launch vs. Scale Analysis')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: 12-Month Revenue Projection Chart
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.chart_data?.revenue_projection_12m ? `
    ${pageStart('Revenue Projection')}
        <h2 class="section-title">12-Month Revenue Projection</h2>
        <p class="section-subtitle">Forward revenue projection across three growth scenarios</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('12-Month Revenue Projection')}</div>
            <div class="chart-container">${generateRevenueChartSVG(
                arr(d.chart_data.revenue_projection_12m.labels),
                arr(d.chart_data.revenue_projection_12m.conservative),
                arr(d.chart_data.revenue_projection_12m.base_case),
                arr(d.chart_data.revenue_projection_12m.optimistic)
            )}</div>
            <p class="source-note">${esc(txt(d.chart_data.revenue_projection_12m.description, '12-month forward revenue projection across three scenarios'))}</p>
            ${trackSource(txt(d.chart_data.revenue_projection_12m.description, '12-month forward revenue projection across three scenarios'))}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Margin Erosion + Leakage Audit
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.margin_erosion_audit ? `
    ${pageStart('Margin Erosion')}
        <h2 class="section-title">Margin Erosion &amp; Leakage Audit</h2>
        <p class="section-subtitle">Identifying sources of margin leakage and revenue loss</p>

        ${d.margin_erosion_audit.narrative ? `
        <p class="paragraph">${esc(d.margin_erosion_audit.narrative)}</p>` : ''}

        ${arr(d.margin_erosion_audit.leakage_sources).length > 0 ? `
        <div class="exhibit-box" style="margin-top: 14px;">
            <div class="exhibit-header">${nextExhibit('Margin Leakage Sources')}</div>
            <div class="chart-container">
                ${generateMarginErosionBarSVG(arr(d.margin_erosion_audit.leakage_sources))}
            </div>
            <table class="voya-table">
                <thead><tr>
                    <th>Leakage Source</th><th>Annual Impact</th><th>Severity</th>
                </tr></thead>
                <tbody>
                    ${arr(d.margin_erosion_audit.leakage_sources).map((s: any) => `
                    <tr>
                        <td>${esc(s.source || '')}</td>
                        <td style="color:${V.red};font-weight:600;">${esc(s.annual_impact || '')}</td>
                        <td><span class="badge badge-${(s.severity || '').toLowerCase() === 'high' ? 'red' : (s.severity || '').toLowerCase() === 'medium' ? 'orange' : 'green'}">${esc(s.severity || '')}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="source-note">PricePoint Margin Erosion Analysis</p>
            ${trackSource('PricePoint Margin Erosion Analysis')}
        </div>` : ''}

        ${d.margin_erosion_audit.total_leakage ? `
        <div class="callout red" style="margin-top: 14px;">
            <div class="callout-label" style="color: ${V.red};">Total Estimated Leakage</div>
            <p style="font-size: 18px; font-weight: 700; margin: 6px 0 0 0; color: ${V.red};">${esc(d.margin_erosion_audit.total_leakage)}</p>
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Packaging Recommendation
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.pricing_strategy?.packaging_recommendation_detail ? `
    ${pageStart('Packaging Recommendation')}
        <h2 class="section-title">Packaging Recommendation</h2>
        <p class="section-subtitle">Detailed feature packaging and bundling strategy</p>

        <div class="exhibit-box">
            <p class="paragraph">${esc(typeof d.pricing_strategy.packaging_recommendation_detail === 'string'
                ? d.pricing_strategy.packaging_recommendation_detail
                : txt(d.pricing_strategy.packaging_recommendation_detail?.narrative || ''))}</p>

            ${typeof d.pricing_strategy.packaging_recommendation_detail === 'object' && arr(d.pricing_strategy.packaging_recommendation_detail?.packages).length > 0 ? `
            <table class="voya-table" style="margin-top: 14px;">
                <thead><tr>
                    <th>Package</th><th>Price</th><th>Features</th><th>Target Segment</th>
                </tr></thead>
                <tbody>
                    ${arr(d.pricing_strategy.packaging_recommendation_detail.packages).map((pkg: any) => `
                    <tr>
                        <td>${esc(pkg.name || '')}</td>
                        <td class="text-teal">${esc(pkg.price || '')}</td>
                        <td style="font-weight:400;">${esc(arr(pkg.features).join(', '))}</td>
                        <td style="font-weight:400;">${esc(pkg.target || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>` : ''}
            <p class="source-note">PricePoint Packaging Strategy</p>
            ${trackSource('PricePoint Packaging Strategy')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Price Increase Strategy
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.pricing_strategy?.price_increase_strategy ? `
    ${pageStart('Price Increase Strategy')}
        <h2 class="section-title">Price Increase Strategy</h2>
        <p class="section-subtitle">Phased approach to increasing prices over time</p>

        ${d.pricing_strategy.price_increase_strategy.narrative ? `
        <p class="paragraph">${esc(d.pricing_strategy.price_increase_strategy.narrative)}</p>` : ''}

        ${arr(d.pricing_strategy.price_increase_strategy.timeline).length > 0 ? `
        <div class="exhibit-box" style="margin-top: 14px;">
            <div class="exhibit-header">${nextExhibit('Price Increase Timeline')}</div>
            ${arr(d.pricing_strategy.price_increase_strategy.timeline).map((step: any, i: number) => `
            <div class="timeline-item">
                <div class="timeline-dot">${step.month || `M${(i + 1) * 3}`}</div>
                <div class="timeline-body">
                    <h4>${esc(step.action || step.title || `Phase ${i + 1}`)}</h4>
                    <p>${esc(step.rationale || step.description || '')}</p>
                    ${step.target_increase ? `<span class="badge badge-teal" style="margin-top:4px;">${esc(step.target_increase)}</span>` : ''}
                </div>
            </div>`).join('')}
            <p class="source-note">PricePoint Price Escalation Strategy</p>
            ${trackSource('PricePoint Price Escalation Strategy')}
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: 90-Day Monitoring Plan
         ═══════════════════════════════════════════════ -->
    ${!isBasic ? `
    ${pageStart('Monitoring Plan')}
        <h2 class="section-title">90-Day Monitoring Plan</h2>
        <p class="section-subtitle">Key metrics to track and action triggers for pricing adjustments</p>

        ${arr(d.monitoring_plan).length > 0 ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Pricing Monitoring Dashboard')}</div>
            <table class="voya-table metric-trigger-table">
                <thead><tr>
                    <th style="width:20%">What to Measure</th><th style="width:15%">Target</th><th style="width:15%">Threshold Trigger</th><th style="width:50%">Specific Action</th>
                </tr></thead>
                <tbody>
                    ${arr(d.monitoring_plan).map((m: any) => `
                    <tr>
                        <td>${esc(m.metric || m.what_to_measure || '')}</td>
                        <td class="target">${esc(m.target || '')}</td>
                        <td class="warning">${esc(m.threshold_trigger || m.warning || '')}</td>
                        <td style="font-weight:400;">${esc(m.specific_action || m.action || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="footnote">Review weekly for 90 days post-launch. Targets calibrated to ${cs}${fmt(recommended)} optimal price.</p>
            ${trackSource('PricePoint 90-Day Monitoring Plan')}
        </div>
        ` : `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Pricing Monitoring Dashboard')}</div>
            <table class="voya-table">
                <thead><tr>
                    <th style="width:20%">Metric</th><th style="width:15%">Target</th><th style="width:15%">Warning</th><th style="width:50%">Action Trigger</th>
                </tr></thead>
                <tbody>
                    <tr>
                        <td>Conversion Rate</td>
                        <td style="font-weight:400;">&ge; 3.5%</td>
                        <td><span class="badge badge-orange">&lt; 2.0%</span></td>
                        <td style="font-weight:400;"><strong>Below 2%:</strong> Price may be too high — consider an entry-level tier or adjusting down 10–15%. <strong>Above 5%:</strong> Price may be too low — test a 10–20% increase.</td>
                    </tr>
                    <tr>
                        <td>Customer Acquisition Cost</td>
                        <td style="font-weight:400;">&le; ${cs}${fmtK(recommended * 0.3)}</td>
                        <td><span class="badge badge-red">&gt; ${cs}${fmtK(recommended * 0.5)}</span></td>
                        <td style="font-weight:400;"><strong>CAC exceeds 50% of price:</strong> Unit economics unsustainable. Reduce acquisition spend or increase price to restore LTV:CAC above 3:1.</td>
                    </tr>
                    <tr>
                        <td>Refund / Churn Rate</td>
                        <td style="font-weight:400;">&le; 5%</td>
                        <td><span class="badge badge-red">&gt; 8%</span></td>
                        <td style="font-weight:400;"><strong>Above 8%:</strong> Customers perceive a value gap. Increase value delivery before reducing price. Consider adding features or a mid-tier option.</td>
                    </tr>
                </tbody>
            </table>
            <p class="footnote">Review weekly for 90 days post-launch. Targets calibrated to ${cs}${fmt(recommended)} optimal price.</p>
            ${trackSource('PricePoint 90-Day Monitoring Plan')}
        </div>
        `}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Risk Matrix
         ═══════════════════════════════════════════════ -->
    ${!isBasic && arr(d.risk_matrix).length > 0 ? `
    ${pageStart('Risk Matrix')}
        <h2 class="section-title">Risk Matrix</h2>
        <p class="section-subtitle">Risk assessment matrix with severity ratings and mitigation strategies</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Risk Matrix')}</div>
            <table class="voya-table">
                <thead><tr>
                    <th style="width:28%">Risk</th><th style="width:14%">Category</th><th style="width:12%">Severity</th><th style="width:46%">Mitigation</th>
                </tr></thead>
                <tbody>
                    ${arr(d.risk_matrix).map((r: any) => `
                    <tr>
                        <td>${esc(r.risk || '')}</td>
                        <td style="font-weight:400;">${esc(r.category || '')}</td>
                        <td><span class="badge badge-${(r.severity || '').toLowerCase() === 'high' ? 'red' : (r.severity || '').toLowerCase() === 'medium' ? 'orange' : 'green'}">${esc(r.severity || '')}</span></td>
                        <td style="font-weight:400;">${esc(r.mitigation || '')}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
            <p class="source-note">PricePoint Risk Assessment Module</p>
            ${trackSource('PricePoint Risk Assessment Module')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Implementation Roadmap
         ═══════════════════════════════════════════════ -->
    ${!isBasic && d.implementation_roadmap ? `
    ${pageStart('Implementation Roadmap')}
        <h2 class="section-title">${isInvestor ? '4-Phase' : '3-Phase'} Implementation Roadmap</h2>
        <p class="section-subtitle">Phased approach to implementing your pricing strategy</p>

        ${txt(d.implementation_roadmap.narrative) ? `<p class="paragraph">${esc(d.implementation_roadmap.narrative)}</p>` : ''}
        ${arr(d.implementation_roadmap.phases).map((phase: any, i: number) => `
        <div class="phase-card ${i === 0 ? 'active' : ''}">
            <div class="phase-number">${phase.phase || i + 1}</div>
            <h4>${esc(phase.title || `Phase ${i + 1}`)}</h4>
            <span class="phase-duration">${esc(phase.duration || '')}</span>
            <ul>
                ${arr(phase.key_actions).map((a: string) => `<li>${esc(a)}</li>`).join('')}
            </ul>
            <p class="success">&check; ${esc(phase.success_metric || phase.pricing_milestone || '')}</p>
        </div>`).join('')}
        ${trackSource('PricePoint Implementation Roadmap')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         FOUNDER + INVESTOR: Next Steps
         ═══════════════════════════════════════════════ -->
    ${!isBasic && arr(d.next_steps).length > 0 ? `
    ${pageStart('Next Steps')}
        <h2 class="section-title">Next Steps</h2>
        <p class="section-subtitle">Prioritised actions to take now</p>

        ${arr(d.next_steps).map((step: string, i: number) => `
        <div style="display:flex;gap:12px;margin-bottom:14px;align-items:flex-start;">
            <div style="min-width:32px;height:32px;border-radius:50%;background:${V.teal};color:#FFF;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;">${i + 1}</div>
            <p class="paragraph" style="margin:4px 0 0 0;">${esc(step)}</p>
        </div>`).join('')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Pricing Defensibility Statement
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.investor_narrative?.defensibility_statement ? `
    ${pageStart('Pricing Defensibility')}
        <h2 class="section-title">Pricing Defensibility Statement</h2>
        <p class="section-subtitle">Why this pricing strategy is sustainable and defensible</p>

        <div class="callout teal">
            <div class="callout-label">${svgIcon('shield', V.teal, 20)} &nbsp;Defensibility Statement</div>
            <p style="margin: 6px 0 0 0; font-size: 14px; line-height: 1.7;">${esc(d.investor_narrative.defensibility_statement)}</p>
        </div>

        ${d.investor_narrative.pricing_thesis ? `
        <div class="pull-quote" style="margin-top: 20px;">
            ${esc(d.investor_narrative.pricing_thesis)}
            <span class="attribution">Pricing Thesis</span>
        </div>` : ''}
        ${trackSource('PricePoint Defensibility Analysis')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Comparable Company Pricing
         ═══════════════════════════════════════════════ -->
    ${isInvestor && (arr(d.investor_narrative?.comparable_companies).length > 0 || arr(d.investor_narrative?.comparable_company_pricing).length > 0) ? `
    ${pageStart('Comparable Companies')}
        <h2 class="section-title">Comparable Company Pricing</h2>
        <p class="section-subtitle">Pricing strategies from comparable companies in your market</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Comparable Company Analysis')}</div>
            ${arr(d.investor_narrative.comparable_company_pricing || d.investor_narrative.comparable_companies).map((comp: any, i: number) => `
            <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;${i > 0 ? `border-top:1px solid ${V.border};` : ''}">
                <div style="min-width:40px;height:40px;border-radius:50%;background:${V.teal}15;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:${V.teal};">${i + 1}</div>
                <div style="flex:1;">
                    <strong style="color: var(--voya-dark); font-size: 15px;">${esc(comp.company || '')} &mdash; <span class="text-orange">${esc(comp.pricing_model || '')}</span></strong>
                    ${comp.price_range ? `<div style="margin-top:4px;"><span class="badge badge-teal">${esc(comp.price_range)}</span></div>` : ''}
                    <p class="paragraph" style="margin-top: 6px; font-size: 13px;">${esc(comp.key_lesson || comp.lesson || '')}</p>
                    ${comp.relevance ? `<p class="footnote" style="margin-top: 4px;"><em>Relevance: ${esc(comp.relevance)}</em></p>` : ''}
                </div>
            </div>`).join('')}
            <p class="source-note">AI-generated comparable company analysis</p>
            ${trackSource('AI-generated comparable company analysis')}
        </div>
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Red Flags to Address
         ═══════════════════════════════════════════════ -->
    ${isInvestor && arr(d.investor_narrative?.red_flags_to_address).length > 0 ? `
    ${pageStart('Red Flags')}
        <h2 class="section-title">Red Flags to Address</h2>
        <p class="section-subtitle">Critical issues that investors will scrutinise — with prepared responses</p>

        ${arr(d.investor_narrative.red_flags_to_address).map((flag: any, i: number) => `
        <div class="exhibit-box" style="margin-bottom:12px; border-left: 4px solid ${V.red};">
            <div style="display:flex;gap:10px;align-items:flex-start;">
                <span style="color:${V.red};font-size:18px;min-width:24px;">&#9888;</span>
                <div>
                    <p class="paragraph" style="margin:0;color:${V.red};font-weight:600;">${esc(typeof flag === 'string' ? flag : flag.flag || flag.issue || '')}</p>
                    ${typeof flag === 'object' && flag.mitigation ? `<p class="paragraph" style="margin:6px 0 0 0;font-size:13px;">${esc(flag.mitigation)}</p>` : ''}
                </div>
            </div>
        </div>`).join('')}
        ${trackSource('PricePoint Red Flag Analysis')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Investor Questions (Q&A)
         ═══════════════════════════════════════════════ -->
    ${isInvestor && arr(d.investor_narrative?.investor_questions_to_prepare).length > 0 ? `
    ${pageStart('Investor Questions')}
        <h2 class="section-title">Investor Questions to Prepare For</h2>
        <p class="section-subtitle">Anticipated investor questions with prepared answers</p>

        ${arr(d.investor_narrative.investor_questions_to_prepare).map((q: any, i: number) => `
        <div class="qa-card">
            <div class="qa-q"><span class="badge badge-teal" style="margin-right:8px;">Q${i + 1}</span>${esc(typeof q === 'string' ? q : q.question || '')}</div>
            ${typeof q === 'object' && q.prepared_answer ? `<div class="qa-a">${esc(q.prepared_answer)}</div>` : ''}
        </div>`).join('')}
        ${trackSource('PricePoint Investor Q&A Preparation')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Financial Scenarios + Visual Analytics
         ═══════════════════════════════════════════════ -->
    ${isInvestor && d.chart_data ? `
    ${pageStart('Visual Analytics')}
        <h2 class="section-title">Visual Analytics</h2>
        <p class="section-subtitle">Data-driven visual insights for investor-grade analysis</p>

        ${d.chart_data.price_range_bar ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Price Range Analysis')}</div>
            <div class="chart-container">${generateBarChartSVG(arr(d.chart_data.price_range_bar.labels), arr(d.chart_data.price_range_bar.values), 3)}</div>
            <p class="source-note">${esc(txt(d.chart_data.price_range_bar.description, 'Price range distribution from algorithmic analysis'))}</p>
            ${trackSource(txt(d.chart_data.price_range_bar.description, 'Price range distribution from algorithmic analysis'))}
        </div>` : ''}

        ${d.chart_data.ltv_cac_waterfall ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Unit Economics Waterfall')}</div>
            <div class="chart-container">${generateWaterfallSVG(arr(d.chart_data.ltv_cac_waterfall.labels), arr(d.chart_data.ltv_cac_waterfall.values))}</div>
            <p class="source-note">${esc(txt(d.chart_data.ltv_cac_waterfall.description, 'LTV:CAC waterfall breakdown'))}</p>
            ${trackSource(txt(d.chart_data.ltv_cac_waterfall.description, 'LTV:CAC waterfall breakdown'))}
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         INVESTOR + AUDIT: Audit Findings
         ═══════════════════════════════════════════════ -->
    ${isInvestor && isAudit && d.audit_findings ? `
    ${pageStart('Audit Findings')}
        <h2 class="section-title">Audit Findings</h2>
        <p class="section-subtitle">Comprehensive pricing health assessment and recommendations</p>

        <div style="display:flex;gap:24px;align-items:center;margin-bottom:20px;">
            <div>
                ${generateGaugeSVG(num(d.audit_findings.pricing_health_score), 100, 'Pricing Health Score', '')}
            </div>
            <div style="flex:1;">
                <h3 class="subsection-title" style="margin-top:0;">Current Price Assessment</h3>
                <p class="paragraph">${esc(txt(d.audit_findings.current_price_assessment))}</p>
            </div>
        </div>

        <div class="callout red">
            <div class="callout-label" style="color: ${V.red};">Revenue Leakage Estimate</div>
            <p style="font-size: 18px; font-weight: 700; margin: 6px 0 0 0; color: ${V.red};">${esc(txt(d.audit_findings.revenue_leakage_estimate))}</p>
        </div>

        ${arr(d.audit_findings.quick_wins).length > 0 ? `
        <div class="exhibit-box" style="margin-top:16px;">
            <div class="exhibit-header">${nextExhibit('Quick Wins')}</div>
            ${arr(d.audit_findings.quick_wins).map((w: string, i: number) => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;${i > 0 ? `border-top:1px solid ${V.border};` : ''}">
                <span style="color:${V.green};font-size:16px;font-weight:700;">&#10003;</span>
                <p class="paragraph" style="margin:0;font-size:13px;">${esc(w)}</p>
            </div>`).join('')}
            <p class="source-note">PricePoint Audit Module — actionable recommendations</p>
            ${trackSource('PricePoint Audit Module — actionable recommendations')}
        </div>` : ''}

        ${arr(d.audit_findings.structural_changes).length > 0 ? `
        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Structural Changes Required')}</div>
            ${arr(d.audit_findings.structural_changes).map((c: string, i: number) => `
            <div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;${i > 0 ? `border-top:1px solid ${V.border};` : ''}">
                <span style="color:${V.orange};font-size:14px;">&#8594;</span>
                <p class="paragraph" style="margin:0;font-size:13px;">${esc(c)}</p>
            </div>`).join('')}
            <p class="source-note">PricePoint Structural Analysis</p>
            ${trackSource('PricePoint Structural Analysis')}
        </div>` : ''}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         ALL TIERS: Full Input Audit
         ═══════════════════════════════════════════════ -->
    ${pageStart('Input Audit')}
        <h2 class="section-title">Full Input Audit</h2>
        <p class="section-subtitle">Complete record of all data inputs used to generate this report</p>

        <div class="exhibit-box">
            <div class="exhibit-header">${nextExhibit('Input Data Audit')}</div>
            <table class="audit-table">
                ${answerEntries.map((entry: any) => `
                <tr>
                    <td>${esc(entry.question)}</td>
                    <td>${esc(entry.answer === '__NA__' || entry.answer === 'undefined' || entry.answer === 'null' ? 'Not provided' : entry.answer)}</td>
                </tr>`).join('')}
            </table>
        </div>

        <div class="callout" style="margin-top: 14px;">
            <div class="callout-label">Data Integrity Note</div>
            <p style="margin: 6px 0 0 0; font-size: 12px;">All values above were provided by the user during the PricePoint session. The pricing engine and AI analysis used these inputs as the foundation for all calculations and recommendations in this report.</p>
        </div>
        ${trackSource('PricePoint Session Input Data')}
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         INVESTOR ONLY: Glossary of Pricing Terms
         ═══════════════════════════════════════════════ -->
    ${isInvestor && arr(d.glossary).length > 0 ? `
    ${pageStart('Glossary')}
        <h2 class="section-title">Glossary of Pricing Terms</h2>
        <p class="section-subtitle">Key pricing and business terminology used throughout this report</p>

        <div class="glossary-grid">
            ${arr(d.glossary).map((item: any) => `
            <div class="glossary-item">
                <div class="glossary-term">${esc(item.term || '')}</div>
                <div class="glossary-def">${esc(item.definition || '')}</div>
            </div>`).join('')}
        </div>
        ${trackSource('PricePoint Glossary')}
    ${pageEnd}
    ` : ''}

    <!-- ═══════════════════════════════════════════════
         ALL TIERS: Sources & References
         ═══════════════════════════════════════════════ -->
    ${pageStart('Sources &amp; References')}
        <h2 class="section-title">Sources &amp; References</h2>
        <p class="section-subtitle">All data sources and methodologies referenced throughout this report</p>

        <div class="exhibit-box">
            <div class="exhibit-header">Report Sources</div>
            <table class="voya-table">
                <thead><tr>
                    <th style="width:8%">#</th><th style="width:92%">Source</th>
                </tr></thead>
                <tbody>
                    ${sourceReferences.map((src, i) => `
                    <tr>
                        <td style="font-weight:600;color:${V.teal};">[${i + 1}]</td>
                        <td style="font-weight:400;">${esc(src)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="callout teal">
            <div class="callout-label">Data Provenance Note</div>
            <p style="font-size: 13px; margin: 6px 0 0 0;">All sources listed above were used in the generation of this report. Quantitative data originates from the PricePoint Pricing Engine's algorithmic analysis, while qualitative insights are synthesized by AI from user-provided inputs and market intelligence data.</p>
        </div>
    ${pageEnd}

    <!-- ═══════════════════════════════════════════════
         ALL TIERS: Methodology Appendix + Legal
         ═══════════════════════════════════════════════ -->
    ${pageStart('Appendices &amp; Legal')}
        <h2 class="section-title">Appendices &amp; Legal</h2>
        <p class="section-subtitle">Methodology, AI analysis details, and legal disclaimers</p>

        <div class="disclaimer-box">
            <div class="disclaimer-title">Section A: Methodology Appendix</div>
            <p class="disclaimer-body">
                The pricing intelligence contained herein was algorithmically generated utilizing proprietary frameworks including: <strong>(1)</strong> Van Westendorp Price Sensitivity Modeling &mdash; a 4-line intersection methodology deriving PMC, OPP, IPP, and PME from consumer willingness-to-pay data; <strong>(2)</strong> Cost-Plus Calculation &mdash; Total Unit Cost &times; (1 + Desired Margin%) &times; (1 + Tax Rate%); <strong>(3)</strong> Value-Based Multiplier Scoring &mdash; a composite 1.2x&ndash;2.0x multiplier from USP Strength (35%), Retention Rate (25%), WTP Premium (25%), and Brand Recognition (15%); <strong>(4)</strong> Market Modifiers &mdash; Blue Ocean Bonus (+20%), High Saturation Penalty (-15%), Competitor Gravity (70/30 weighted blend), and Margin Protection.
            </p>
        </div>

        <div class="disclaimer-box orange">
            <div class="disclaimer-title">Section B: AI Analysis Methodology</div>
            <p class="disclaimer-body">
                The analytical narrative in this report was generated by a large language model (Claude 4.5 Sonnet) acting under the persona of a McKinsey Pricing Auditor. The AI was provided with the complete dataset including all user responses, algorithmic outputs, and applied market modifiers. All claims are derived from the user&rsquo;s actual input data and the proprietary pricing engine&rsquo;s calculations.
            </p>
        </div>

        <div class="disclaimer-box red">
            <div class="disclaimer-title" style="color: ${V.red};">Section C: Legal Disclaimer</div>
            <p class="disclaimer-body">
                CONFIDENTIAL AND PROPRIETARY. This report is provided for informational and strategic planning purposes only. It does NOT constitute financial, legal, or investment advice. PricePoint and its affiliates shall not be held liable for any commercial losses resulting from decisions made based on this report. All market data is based on user-provided inputs and algorithmic projections. Unauthorized distribution or reverse-engineering of the pricing algorithms is prohibited.
            </p>
        </div>

        <div style="margin-top: 28px; padding: 20px; border: 2px solid var(--voya-orange); text-align: center; border-radius: 6px; background: ${V.orange}04;">
            <div style="font-size: 12px; font-weight: 700; color: var(--voya-orange); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Verification Seal</div>
            <div style="width:50px;height:2px;background:var(--voya-orange);margin:0 auto 10px;"></div>
            <p style="font-size: 13px; color: var(--voya-dark); font-weight: 600; margin: 0;">Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })}</p>
            <p style="font-size: 11px; color: var(--voya-gray); margin: 4px 0 0 0;">PricePoint Intelligence Platform &bull; Powered by AI</p>
        </div>
    ${pageEnd}

</body>
</html>
    `;
}
