/**
 * Receipt HTML Template Generator
 * Generates a clean, professional payment receipt matching PricePoint's neumorphic design.
 */

interface ReceiptData {
    documentId: string;
    tier: string;
    amountPaid: number | { toNumber(): number } | null;
    currency: string | null;
    createdAt: string; // ISO date string
    journeyType: string;
    userName: string | null;
    userEmail: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
    const {
        documentId,
        tier,
        amountPaid,
        currency,
        createdAt,
        journeyType,
        userName,
        userEmail,
    } = data;

    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const formattedTime = new Date(createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const priceText = amountPaid
        ? `${(currency || 'USD').toUpperCase()} ${Number(amountPaid).toFixed(2)}`
        : 'Complimentary';

    const receiptId = `PP-${documentId.slice(0, 8).toUpperCase()}`;

    const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
    const journeyLabel = journeyType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PricePoint Payment Receipt</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
            background: #E0E5EC;
            color: #4A5568;
            padding: 40px;
        }

        .receipt-container {
            max-width: 560px;
            margin: 0 auto;
            background: #E0E5EC;
            border-radius: 24px;
            box-shadow: 6px 6px 10px #c8ccd4, -6px -6px 10px #ffffff;
            overflow: hidden;
        }

        .receipt-header {
            padding: 40px 40px 28px;
            text-align: center;
        }

        .brand-badge {
            display: inline-block;
            background: #DFA81C;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 8px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        .receipt-title {
            font-size: 26px;
            font-weight: 800;
            color: #4A5568;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }

        .receipt-subtitle {
            font-size: 13px;
            color: #A0AEC0;
        }

        .success-icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 20px;
            background: rgba(16, 185, 129, 0.12);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: inset 3px 3px 3px #d0d0d0, inset -3px -3px 3px #f8f8f8;
        }

        .success-icon svg {
            width: 28px;
            height: 28px;
            color: #10B981;
        }

        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #CBD5E1, transparent);
            margin: 0 40px;
        }

        .receipt-body {
            padding: 28px 40px;
        }

        .detail-card {
            background: #E0E5EC;
            border-radius: 16px;
            box-shadow: inset 3px 3px 3px #d0d0d0, inset -3px -3px 3px #f8f8f8;
            padding: 24px;
            margin-bottom: 24px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }

        .detail-row:not(:last-child) {
            border-bottom: 1px solid rgba(203, 213, 225, 0.4);
        }

        .detail-label {
            font-size: 13px;
            color: #718096;
            font-weight: 500;
        }

        .detail-value {
            font-size: 13px;
            color: #4A5568;
            font-weight: 600;
            text-align: right;
        }

        .tier-badge {
            display: inline-block;
            background: #DFA81C;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: 6px;
        }

        .amount-section {
            background: #E0E5EC;
            border-radius: 16px;
            box-shadow: 3px 3px 3px #d0d0d0, -3px -3px 3px #f8f8f8;
            padding: 24px;
            text-align: center;
            margin-bottom: 24px;
        }

        .amount-label {
            font-size: 12px;
            color: #A0AEC0;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .amount-value {
            font-size: 32px;
            font-weight: 800;
            color: #4A5568;
            letter-spacing: -0.5px;
        }

        .amount-currency {
            font-size: 16px;
            color: #718096;
            font-weight: 600;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.12);
            color: #10B981;
            font-size: 12px;
            font-weight: 700;
            padding: 5px 14px;
            border-radius: 999px;
            margin-top: 12px;
        }

        .status-dot {
            width: 6px;
            height: 6px;
            background: #10B981;
            border-radius: 50%;
        }

        .receipt-footer {
            padding: 20px 40px 32px;
            text-align: center;
            border-top: 1px solid rgba(203, 213, 225, 0.4);
        }

        .footer-text {
            font-size: 11px;
            color: #A0AEC0;
            line-height: 1.8;
        }

        .footer-text a {
            color: #DFA81C;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
            <div class="brand-badge">PricePoint Intelligence</div>

            <div class="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </div>

            <h1 class="receipt-title">Payment Receipt</h1>
            <p class="receipt-subtitle">Transaction confirmed successfully</p>
        </div>

        <div class="divider"></div>

        <!-- Body -->
        <div class="receipt-body">
            <!-- Amount Card -->
            <div class="amount-section">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">
                    ${amountPaid ? `<span class="amount-currency">${(currency || 'USD').toUpperCase()}</span> ${Number(amountPaid).toFixed(2)}` : 'Complimentary'}
                </div>
                <div class="status-badge">
                    <span class="status-dot"></span>
                    Payment Successful
                </div>
            </div>

            <!-- Details Card -->
            <div class="detail-card">
                <div class="detail-row">
                    <span class="detail-label">Receipt No.</span>
                    <span class="detail-value">${receiptId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${formattedTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Plan</span>
                    <span class="detail-value"><span class="tier-badge">${tierLabel}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Report Type</span>
                    <span class="detail-value">${journeyLabel}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Customer</span>
                    <span class="detail-value">${userName || userEmail}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${userEmail}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
            <p class="footer-text">
                This receipt confirms your payment for a PricePoint Intelligence Report.<br />
                For questions or refunds, contact <a href="mailto:support@pricepoint.bot">support@pricepoint.bot</a><br /><br />
                © ${new Date().getFullYear()} PricePoint Intelligence System
            </p>
        </div>
    </div>
</body>
</html>`.trim();
}
