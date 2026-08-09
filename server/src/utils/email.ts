import { Resend } from 'resend';

// Lazy-init Resend client
let _resend: Resend | null = null;
const getResend = () => {
    if (!_resend) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn('[Email] RESEND_API_KEY not set — emails will be skipped.');
            return null;
        }
        _resend = new Resend(apiKey);
    }
    return _resend;
};

const FROM_EMAIL = () => process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

interface ReportEmailPayload {
    to: string;
    userName?: string;
    documentId: string;
    tier: string;
    amountPaid?: number | { toNumber(): number } | null;
    currency?: string | null;
    reportDate: string; // ISO string
    appUrl?: string;
}

export async function sendReportEmail(payload: ReportEmailPayload): Promise<boolean> {
    const resend = getResend();
    if (!resend) {
        console.warn('[Email] Resend client not initialized — skipping email.');
        return false;
    }

    const { to, userName, documentId, tier, amountPaid, currency, reportDate, appUrl } = payload;
    const greeting = userName ? `Hi ${userName}` : 'Hi there';
    const formattedDate = new Date(reportDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const priceText = amountPaid
        ? `${currency || 'USD'} ${Number(amountPaid).toFixed(2)}`
        : 'Paid';
    const siteUrl = appUrl || process.env.APP_URL || 'http://localhost:5173';

    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL(),
            to: [to],
            subject: `Your PricePoint ${tier} Intelligence Report is Ready`,
            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#E0E5EC;font-family:'Plus Jakarta Sans',Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E0E5EC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#E0E5EC;border-radius:24px;box-shadow:6px 6px 10px #c8ccd4,-6px -6px 10px #ffffff;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 20px;text-align:center;">
              <div style="display:inline-block;background:#DFA81C;color:white;font-size:11px;font-weight:700;padding:6px 14px;border-radius:8px;letter-spacing:1px;text-transform:uppercase;">PricePoint Intelligence</div>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:8px 40px 32px;">
              <h1 style="color:#4A5568;font-size:24px;font-weight:800;margin:0 0 16px;text-align:center;">Your Report is Ready ✨</h1>
              <p style="color:#718096;font-size:15px;line-height:1.7;margin:0 0 24px;">${greeting},</p>
              <p style="color:#718096;font-size:15px;line-height:1.7;margin:0 0 24px;">Your <strong style="color:#4A5568;">${tier}</strong> pricing intelligence report has been generated successfully. Here are the details:</p>
              
              <!-- Report Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#E0E5EC;border-radius:16px;box-shadow:inset 3px 3px 3px #d0d0d0,inset -3px -3px 3px #f8f8f8;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#718096;font-size:13px;padding:6px 0;">Report ID</td>
                        <td style="color:#4A5568;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">${documentId.slice(0, 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color:#718096;font-size:13px;padding:6px 0;">Plan</td>
                        <td style="text-align:right;padding:6px 0;"><span style="background:#DFA81C;color:white;font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;">${tier}</span></td>
                      </tr>
                      <tr>
                        <td style="color:#718096;font-size:13px;padding:6px 0;">Amount</td>
                        <td style="color:#4A5568;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">${priceText}</td>
                      </tr>
                      <tr>
                        <td style="color:#718096;font-size:13px;padding:6px 0;">Date</td>
                        <td style="color:#4A5568;font-size:13px;font-weight:600;text-align:right;padding:6px 0;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/profile" style="display:inline-block;background:#DFA81C;color:white;font-size:15px;font-weight:700;padding:14px 40px;border-radius:999px;text-decoration:none;box-shadow:3px 3px 3px #c8ccd4,-3px -3px 3px #ffffff;">View & Download Report</a>
                  </td>
                </tr>
              </table>

              <p style="color:#A0AEC0;font-size:13px;line-height:1.6;margin:28px 0 0;text-align:center;">You can always access your reports from the <a href="${siteUrl}/profile" style="color:#DFA81C;text-decoration:none;font-weight:600;">profile page</a> in PricePoint.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #d0d5dd;">
              <p style="color:#A0AEC0;font-size:12px;margin:0;">© ${new Date().getFullYear()} PricePoint Intelligence System</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `.trim(),
        });

        if (error) {
            console.error('[Email] Resend error:', error);
            return false;
        }

        console.log(`[Email] ✅ Report email sent to ${to} (id: ${data?.id})`);
        return true;
    } catch (err) {
        console.error('[Email] Failed to send report email:', err);
        return false;
    }
}
