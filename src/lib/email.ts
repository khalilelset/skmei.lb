import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SKMEI.LB <onboarding@resend.dev>";
const ADMIN_EMAIL = "skmei.lb@gmail.com";
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "96179170387";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skmeilb.com";

interface OrderEmailData {
  orderId: string;
  orderNumber: number | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  items: {
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  address: { street?: string; building?: string; area?: string; city?: string } | null;
  notes: string | null;
}

function formatPrice(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function orderLabel(data: OrderEmailData) {
  return data.orderNumber
    ? `SK-${data.orderNumber}`
    : `SK-${data.orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

// ─── Customer Confirmation Email ────────────────────────────────────────────

// ─── Admin Notification Email ────────────────────────────────────────────────

function buildAdminEmail(data: OrderEmailData): string {
  const label = orderLabel(data);
  const date = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;">${item.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">×${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order ${label}</title>
  <style>
    @media only screen and (max-width:640px) {
      .email-wrap { padding: 16px 8px !important; }
      .email-body { width: 100% !important; max-width: 100% !important; }
      .email-cell { padding: 20px !important; }
      .email-header { padding: 16px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-wrap" style="background:#f5f5f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="660" cellpadding="0" cellspacing="0" class="email-body" style="max-width:660px;width:100%;">

        <!-- Header -->
        <tr>
          <td class="email-header" style="background:#ffffff;border-radius:16px 16px 0 0;padding:18px 32px;border-bottom:3px solid #e63946;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><img src="https://res.cloudinary.com/dsp2vhsfb/image/upload/v1773575439/black_qjfuft.png" alt="SKMEI.LB" width="110" height="36" style="display:block;max-width:110px;height:auto;" /></td>
                <td style="text-align:right;"><span style="background:#e63946;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">NEW ORDER</span></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="email-cell" style="background:#ffffff;padding:32px 40px;border-left:1px solid #eee;border-right:1px solid #eee;">
            <h2 style="margin:0 0 4px;font-size:24px;font-weight:900;color:#0f0f0f;">Order ${label}</h2>
            <p style="margin:0 0 24px;font-size:13px;color:#999;">${date}</p>

            <!-- Customer -->
            <div style="background:#f8f8f8;border-radius:10px;padding:20px 20px;margin-bottom:20px;">
              <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Customer</p>
              <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#0f0f0f;">${data.customerName}</p>
              <p style="margin:0 0 20px;font-size:14px;color:#444;">📞 +961 ${data.customerPhone}</p>
              ${data.customerEmail ? `<p style="margin:0 0 20px;font-size:14px;color:#444;">✉️ ${data.customerEmail}</p>` : ""}
              ${data.address ? `<p style="margin:0;font-size:14px;color:#444;">📍 ${[data.address.area, data.address.city, data.address.street, "Lebanon"].filter(Boolean).join(", ")}</p>` : ""}
              ${data.notes ? `<p style="margin:12px 0 0;font-size:13px;color:#666;font-style:italic;">Note: ${data.notes}</p>` : ""}
            </div>

            <!-- Items -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f0f0f;text-transform:uppercase;letter-spacing:1px;">Items</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:10px;overflow:hidden;margin-bottom:20px;">
              <tbody>${itemRows}</tbody>
              <tfoot style="background:#f8f8f8;">
                <tr>
                  <td colspan="2" style="padding:8px 16px;font-size:13px;color:#666;">Subtotal</td>
                  <td style="padding:8px 16px;font-size:13px;text-align:right;">${formatPrice(data.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 16px;font-size:13px;color:#666;">Shipping</td>
                  <td style="padding:6px 16px;font-size:13px;text-align:right;">${data.shipping === 0 ? "FREE" : formatPrice(data.shipping)}</td>
                </tr>
                ${
                  data.discount > 0
                    ? `<tr>
                  <td colspan="2" style="padding:6px 16px;font-size:13px;color:#16a34a;">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td>
                  <td style="padding:6px 16px;font-size:13px;color:#16a34a;text-align:right;">-${formatPrice(data.discount)}</td>
                </tr>`
                    : ""
                }
                <tr style="border-top:2px solid #e5e5e5;">
                  <td colspan="2" style="padding:12px 16px;font-size:16px;font-weight:900;color:#0f0f0f;">Total</td>
                  <td style="padding:12px 16px;font-size:16px;font-weight:900;color:#e63946;text-align:right;">${formatPrice(data.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align:center;">
              <a href="${SITE_URL}/admin/orders" style="display:inline-block;background:#0f0f0f;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:700;">
                View in Admin Dashboard →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f0f0f;border-radius:0 0 16px 16px;padding:16px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">SKMEI.LB Admin Notification</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Status Change Emails ────────────────────────────────────────────────────

interface StatusEmailData {
  orderId: string;
  orderNumber: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  address?: { street?: string; building?: string; area?: string; city?: string } | null;
}

function statusLabel(d: StatusEmailData) {
  return d.orderNumber
    ? `SK-${d.orderNumber}`
    : `SK-${d.orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function statusEmailShell(bodyHtml: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<style>
  @media only screen and (max-width:640px){
    .ew{padding:16px 8px!important;}
    .eb{width:100%!important;max-width:100%!important;}
    .ec{padding:28px 20px!important;}
    .eh{padding:20px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" class="ew" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="660" cellpadding="0" cellspacing="0" class="eb" style="max-width:660px;width:100%;">
  <tr>
    <td class="eh" style="background:#fff;border-radius:16px 16px 0 0;padding:24px 40px;text-align:center;border-bottom:3px solid #e63946;">
      <img src="https://res.cloudinary.com/dsp2vhsfb/image/upload/v1773575439/black_qjfuft.png" alt="SKMEI.LB" width="130" height="42" style="display:inline-block;max-width:130px;height:auto;"/>
      <p style="margin:8px 0 0;font-size:11px;color:#999;letter-spacing:3px;text-transform:uppercase;">Official SKMEI Dealer in Lebanon</p>
    </td>
  </tr>
  ${bodyHtml}
  <tr>
    <td style="background:#0f0f0f;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.35);">© ${year} SKMEI.LB — Official Authorized Dealer in Lebanon</p>
      <p style="margin:0;font-size:11px;">
        <a href="${SITE_URL}" style="color:#e63946;text-decoration:none;">skmeilb.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:${ADMIN_EMAIL}" style="color:rgba(255,255,255,0.25);text-decoration:none;">${ADMIN_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildConfirmedStatusEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const itemRows = d.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;">${item.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">×${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join("");

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#fff;padding:40px;text-align:center;border-left:1px solid #eee;border-right:1px solid #eee;">
      <div style="width:72px;height:72px;background:#16a34a;border-radius:50%;margin:32px auto 24px;display:table;text-align:center;">
        <span style="display:table-cell;vertical-align:middle;font-size:34px;line-height:1;color:#fff;">✓</span>
      </div>
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f0f0f;line-height:1.3;">Order Confirmed!</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.8;">
        Great news, <strong style="color:#0f0f0f;">${firstName}</strong>! Your order
        <strong style="color:#0f0f0f;">${label}</strong> has been reviewed and confirmed by our team.
        We are now preparing your watch for shipment.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:24px;text-align:left;">
        <tbody>${itemRows}</tbody>
        <tfoot style="background:#f8f8f8;">
          <tr>
            <td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f0f0f;">Total</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:900;color:#e63946;text-align:right;">${formatPrice(d.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;margin-bottom:32px;text-align:left;">
        <p style="margin:0;font-size:14px;color:#15803d;line-height:1.8;">
          📦 <strong>What's next?</strong> Your order is being carefully packed.
          You'll receive another update once it's shipped.<br/>
          Estimated delivery: <strong>2–5 business days</strong>.
        </p>
      </div>

      <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.3px;margin-bottom:32px;">
        Contact via WhatsApp
      </a>
    </td>
  </tr>`);
}

function buildShippedEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const itemRows = d.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;">${item.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">×${item.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>`,
    )
    .join("");

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#fff;padding:40px;text-align:center;border-left:1px solid #eee;border-right:1px solid #eee;">
      <div style="width:72px;height:72px;background:#2563eb;border-radius:50%;margin:32px auto 24px;display:table;text-align:center;">
        <span style="display:table-cell;vertical-align:middle;font-size:34px;line-height:1;">🚚</span>
      </div>
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f0f0f;line-height:1.3;">It's On Its Way!</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.8;">
        Your SKMEI watch is heading to you, <strong style="color:#0f0f0f;">${firstName}</strong>!
        Order <strong style="color:#0f0f0f;">${label}</strong> has been handed to our delivery team
        and is on its way to you right now.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:24px;text-align:left;">
        <tbody>${itemRows}</tbody>
        <tfoot style="background:#f8f8f8;">
          <tr>
            <td colspan="2" style="padding:12px 16px;font-size:14px;font-weight:700;color:#0f0f0f;">Total</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:900;color:#e63946;text-align:right;">${formatPrice(d.total)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 20px;margin-bottom:32px;text-align:left;">
        <p style="margin:0;font-size:14px;color:#1d4ed8;line-height:1.8;">
          🕐 <strong>Estimated delivery:</strong> 2–4 business days.<br/>
          Our delivery team will contact you on <strong>+961 ${d.customerPhone}</strong> before arriving.${d.address ? `<br/>📍 <strong>Delivering to:</strong> ${[d.address.area, d.address.city, d.address.street, "Lebanon"].filter(Boolean).join(", ")}` : ""}
        </p>
      </div>

      <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.3px;margin-bottom:32px;">
        Track via WhatsApp
      </a>
    </td>
  </tr>`);
}

function buildCancelledEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#fff;padding:40px;text-align:center;border-left:1px solid #eee;border-right:1px solid #eee;">
      <div style="width:72px;height:72px;background:#ef4444;border-radius:50%;margin:32px auto 24px;display:table;text-align:center;">
        <span style="display:table-cell;vertical-align:middle;font-size:30px;line-height:1;color:#fff;font-weight:900;">✕</span>
      </div>
      <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f0f0f;line-height:1.3;">Order Cancelled</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.8;">
        We're sorry, <strong style="color:#0f0f0f;">${firstName}</strong>.
        Your order <strong style="color:#0f0f0f;">${label}</strong> has been cancelled.
        If this wasn't expected or you have any questions, please reach out to us.
      </p>

      <div style="background:#f8f8f8;border-radius:10px;padding:18px 20px;margin-bottom:16px;text-align:left;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1.5px;">Cancelled Order</p>
        <p style="margin:0;font-size:22px;font-weight:900;color:#0f0f0f;">${label}</p>
      </div>

      <div style="background:#fff8f8;border:1px solid #fde8e8;border-radius:10px;padding:18px 20px;margin-bottom:32px;text-align:left;">
        <p style="margin:0;font-size:14px;color:#991b1b;line-height:1.8;">
          If you believe this is a mistake or would like to place a new order, contact us on WhatsApp and we'll be happy to help!
        </p>
      </div>

      <a href="${waLink}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:14px;font-weight:700;letter-spacing:0.3px;margin-bottom:32px;">
        Contact via WhatsApp
      </a>
    </td>
  </tr>`);
}

export async function sendStatusChangeEmail(
  status: "confirmed" | "shipped" | "cancelled",
  d: StatusEmailData,
): Promise<void> {
  if (!d.customerEmail) return;

  const label = statusLabel(d);
  let subject: string;
  let html: string;

  switch (status) {
    case "confirmed":
      subject = `Your order ${label} is confirmed — SKMEI.LB`;
      html = buildConfirmedStatusEmail(d);
      break;
    case "shipped":
      subject = `🚚 Your order ${label} is on its way — SKMEI.LB`;
      html = buildShippedEmail(d);
      break;
    case "cancelled":
      subject = `Your order ${label} has been cancelled — SKMEI.LB`;
      html = buildCancelledEmail(d);
      break;
  }

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: d.customerEmail,
    subject: subject!,
    html: html!,
  });
  if (result.error) {
    console.error(`[email] Status email (${status}) failed:`, result.error);
  }
}

// ─── Send both emails ────────────────────────────────────────────────────────

export async function sendOrderEmails(data: OrderEmailData) {
  const label = orderLabel(data);

  // Send admin notification only — customer email is sent later when status changes
  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Order ${label} — ${data.customerName} — ${formatPrice(data.total)}`,
    html: buildAdminEmail(data),
  });

  if (result.error) {
    console.error("[email] Admin notification failed:", result.error);
  }
}
