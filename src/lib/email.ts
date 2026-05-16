import { Resend } from "resend";
import { formatPhoneDisplay } from "@/lib/utils";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SKMEI.LB <onboarding@resend.dev>";
const ADMIN_EMAIL = "skmei.lb@gmail.com";
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER ?? "96179170387";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skmeilb.com";
const BLACK_LOGO = `https://res.cloudinary.com/dsp2vhsfb/image/upload/v1773575439/black_qjfuft.png`;


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
    box?: { code: string; type: string; price: number; image?: string | null } | null;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
  couponCode: string | null;
  total: number;
  address: {
    street?: string;
    building?: string;
    area?: string;
    city?: string;
  } | null;
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
    .map((item) => {
      const img = item.image ?? null;
      const boxLine = item.box
        ? `<p style="margin:8px 0 0;font-size:0;line-height:0;">${item.box.image ? `<img src="${item.box.image}" width="32" height="32" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border-radius:6px;object-fit:cover;border:1px solid #333;margin-right:6px;" />` : ''}<span style="display:inline-block;vertical-align:middle;font-size:10px;color:#888;line-height:1.3;">📦 ${item.box.code}${item.box.price > 0 ? ` <span style="color:#e63946;">+${formatPrice(item.box.price)}</span>` : ' <span style="color:#22c55e;">Free</span>'}</span></p>`
        : '';
      return `
    <tr>
      <td style="padding:16px 14px;border-bottom:1px solid #2a2a2a;vertical-align:middle;" width="72">
        ${
          img
            ? `<img src="${img}" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid #333;" />`
            : `<div style="width:56px;height:56px;border-radius:10px;background:#2a2a2a;display:table;text-align:center;"><span style="display:table-cell;vertical-align:middle;font-size:24px;">⌚</span></div>`
        }
      </td>
      <td style="padding:16px 2px;border-bottom:1px solid #2a2a2a;vertical-align:middle;">
  <p style="margin:0;font-size:11px;font-weight:700;color:#ffffff;line-height:1.4;">
    ${item.name} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-weight:400;color:#666;">×${item.quantity}</span>
  </p>
  ${boxLine}
</td>
      <td style="padding:16px 14px;border-bottom:1px solid #2a2a2a;vertical-align:middle;text-align:right;white-space:nowrap;">
        <span style="font-size:14px;font-weight:700;color:#ffffff;">${formatPrice(item.price * item.quantity)}</span>
      </td>
    </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Order ${label}</title>
  <style>
    @media only screen and (max-width:640px) {
      .ew{padding:0!important;}
      .eb{width:100%!important;max-width:100%!important;}
      .ec{padding:24px 16px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" class="ew" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" class="eb" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:18px 28px;border-bottom:2px solid #e63946;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><img src="${BLACK_LOGO}" alt="SKMEI.LB" width="110" height="36" style="display:block;max-width:110px;height:auto;" /></td>
                <td style="text-align:right;"><span style="background:#e63946;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">NEW ORDER</span></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="ec" style="background:#1a1a1a;padding:28px;">
            <h2 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#ffffff;">Order ${label}</h2>
            <p style="margin:0 0 20px;font-size:13px;color:#666;">${date}</p>

            <!-- Customer -->
            <div style="background:#222;border-radius:12px;padding:18px 20px;margin-bottom:12px;">
              <p style="margin:0 0 18px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1.5px;">Customer</p>
              <p style="margin:0 0 18px;font-size:15px;font-weight:700;color:#ffffff;">${data.customerName}</p>
              <p style="margin:0 0 16px;font-size:14px;color:#aaa;">📞 ${formatPhoneDisplay(data.customerPhone)}</p>
              ${data.customerEmail ? `<p style="margin:0 0 16px;font-size:14px;color:#aaa;">✉️ ${data.customerEmail}</p>` : ""}
              ${data.address ? `<p style="margin:0 0 16px;font-size:14px;color:#aaa;">📍 ${[data.address.area, data.address.city, data.address.street, "Lebanon"].filter(Boolean).join(", ")}</p>` : ""}
              ${data.notes ? `<p style="margin:16px 0 0;font-size:13px;color:#888;font-style:italic;">Note: ${data.notes}</p>` : ""}
            </div>

            <!-- Items -->
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1.5px;">Items Ordered</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:0;">
              <tbody>${itemRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 14px 6px;font-size:13px;color:#666;background:#141414;">Subtotal</td>
                  <td style="padding:12px 14px 6px;font-size:13px;text-align:right;color:#aaa;background:#141414;">${formatPrice(data.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 14px;font-size:13px;color:#666;background:#141414;">Shipping</td>
                  <td style="padding:6px 14px;font-size:13px;text-align:right;color:#aaa;background:#141414;">${data.shipping === 0 ? "FREE" : formatPrice(data.shipping)}</td>
                </tr>
                ${
                  data.discount > 0
                    ? `<tr>
                  <td colspan="2" style="padding:6px 14px;font-size:13px;color:#22c55e;background:#141414;">Discount${data.couponCode ? ` (${data.couponCode})` : ""}</td>
                  <td style="padding:6px 14px;font-size:13px;color:#22c55e;text-align:right;background:#141414;">-${formatPrice(data.discount)}</td>
                </tr>`
                    : ""
                }
                <tr style="border-top:1px solid #2a2a2a;">
                  <td colspan="2" style="padding:16px 14px;font-size:16px;font-weight:900;color:#ffffff;background:#141414;">Total</td>
                  <td style="padding:16px 14px;font-size:20px;font-weight:900;color:#e63946;text-align:right;background:#141414;">${formatPrice(data.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="text-align:center;margin-top:24px;">
              <a href="${SITE_URL}/admin/orders" style="display:inline-block;background:#e63946;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;font-weight:700;">
                View in Admin Dashboard →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111;padding:20px 32px;text-align:center;border-top:1px solid #2a2a2a;">
            <p style="margin:0 0 10px;font-size:12px;color:#555;"><a href="https://www.skmeilb.com" style="color:#aaa;text-decoration:none;font-weight:600;">SKMEI.LB</a> — Admin Notification</p>
            <p style="margin:0;font-size:11px;"><a href="https://www.skmeilb.com" style="color:#e63946;text-decoration:none;">skmeilb.com</a></p>
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
  items: {
    name: string;
    price: number;
    quantity: number;
    image?: string | null;
    box?: { code: string; type: string; price: number; image?: string | null } | null;
  }[];
  total: number;
  address?: {
    street?: string;
    building?: string;
    area?: string;
    city?: string;
  } | null;
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
  @media only screen and (max-width:600px){
    .ew{padding:0!important;}
    .eb{width:100%!important;max-width:100%!important;}
    .ec{padding:28px 16px!important;}
    .eh{padding:18px 16px!important;}
    .btn-cell{display:block!important;width:100%!important;padding-right:0!important;padding-left:0!important;padding-bottom:10px!important;}
    .btn-cell-last{display:block!important;width:100%!important;padding:0!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" class="ew" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" class="eb" style="max-width:600px;width:100%;">
  <tr>
    <td class="eh" style="background:#ffffff;padding:22px 40px;text-align:center;border-bottom:2px solid #e63946;">
      <img src="${BLACK_LOGO}" alt="SKMEI.LB" width="120" height="40" style="display:inline-block;max-width:120px;height:auto;"/>
      <p style="margin:8px 0 0;font-size:11px;color:#999;letter-spacing:2px;text-transform:uppercase;">Official SKMEI Dealer in Lebanon</p>
    </td>
  </tr>
  ${bodyHtml}
  <tr>
    <td style="background:#111;padding:24px 40px;text-align:center;border-top:1px solid #2a2a2a;">
      <p style="margin:0 0 14px;font-size:12px;color:#555;">© ${year} <a href="https://www.skmeilb.com" style="color:#aaa;text-decoration:none;font-weight:600;">SKMEI.LB</a> — Official Authorized Dealer in Lebanon</p>
      <p style="margin:0;font-size:11px;">
        <a href="https://www.skmeilb.com" style="color:#e63946;text-decoration:none;">skmeilb.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:${ADMIN_EMAIL}" style="color:#555;text-decoration:none;">${ADMIN_EMAIL}</a>
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildItemRows(items: StatusEmailData["items"]): string {
  return items
    .map((item) => {
      const img = item.image ?? null;
      const boxLine = item.box
        ? `<p style="margin:8px 0 0;font-size:0;line-height:0;">${item.box.image ? `<img src="${item.box.image}" width="32" height="32" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border-radius:6px;object-fit:cover;border:1px solid #333;margin-right:6px;" />` : ''}<span style="display:inline-block;vertical-align:middle;font-size:10px;color:#888;line-height:1.3;">📦 ${item.box.code}${item.box.price > 0 ? ` <span style="color:#e63946;">+${formatPrice(item.box.price)}</span>` : ' <span style="color:#22c55e;">Free</span>'}</span></p>`
        : '';
      return `
    <tr>
      <td style="padding:16px 14px;border-bottom:1px solid #2a2a2a;vertical-align:middle;" width="72">
        ${
          img
            ? `<img src="${img}" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:10px;object-fit:cover;border:1px solid #333;" />`
            : `<div style="width:56px;height:56px;border-radius:10px;background:#2a2a2a;display:table;text-align:center;"><span style="display:table-cell;vertical-align:middle;font-size:24px;">⌚</span></div>`
        }
      </td>
      <td style="padding:16px 2px;border-bottom:1px solid #2a2a2a;vertical-align:middle;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#ffffff;line-height:1.4;">${item.name}&nbsp;&nbsp;&nbsp;&nbsp;<span style="font-weight:400;color:#666;">×${item.quantity}</span></p>
        ${boxLine}
      </td>
      <td style="padding:16px 14px;border-bottom:1px solid #2a2a2a;vertical-align:middle;text-align:right;white-space:nowrap;">
        <span style="font-size:15px;font-weight:700;color:#ffffff;">${formatPrice(item.price * item.quantity)}</span>
      </td>
    </tr>`;
    })
    .join("");
}

function buildTotalsFooter(
  d: StatusEmailData,
  accentColor = "#e63946",
): string {
  return `
  <tfoot>
    <tr>
      <td colspan="3" style="padding:0;background:#141414;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:14px 14px 6px;font-size:13px;color:#666;">Order Total</td>
            <td style="padding:14px 14px 6px;font-size:20px;font-weight:900;color:${accentColor};text-align:right;">${formatPrice(d.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </tfoot>`;
}

function buildConfirmedStatusEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const orderLink = `${SITE_URL}/store/orders/${d.orderId}`;

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#1a1a1a;padding:36px 40px;">

      <!-- Icon + Title -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#16a34a;border-radius:50%;margin:0 auto 20px;display:table;text-align:center;">
          <span style="display:table-cell;vertical-align:middle;font-size:34px;line-height:1;color:#fff;">✓</span>
        </div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#ffffff;">Order Confirmed!</h1>
        <p style="margin:0;font-size:15px;color:#888;line-height:1.7;">
          Great news, <strong style="color:#fff;">${firstName}</strong>! Your order
          <strong style="color:#fff;">${label}</strong> is confirmed.<br/>We're preparing your watch for shipment.
        </p>
      </div>

      <!-- Items table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tbody>${buildItemRows(d.items)}</tbody>
        ${buildTotalsFooter(d)}
      </table>

      <!-- Info box -->
      <div style="background:#1f2d1f;border:1px solid #2d4a2d;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#86efac;line-height:1.7;">
          📦 <strong>What's next?</strong> Your order is being carefully packed.<br/>
          You'll receive another update once it's shipped. Estimated delivery: <strong>2–5 business days</strong>.
        </p>
      </div>

      <!-- Buttons -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td class="btn-cell" style="padding-right:6px;width:50%;vertical-align:top;">
            <a href="${orderLink}" style="display:block;background:#e63946;color:#fff;text-decoration:none;padding:14px 16px;border-radius:50px;font-size:14px;font-weight:700;text-align:center;">
              View My Order
            </a>
          </td>
          <td class="btn-cell-last" style="padding-left:6px;width:50%;vertical-align:top;">
            <a href="${waLink}" style="display:block;background:#25d366;color:#fff;text-decoration:none;padding:14px 16px;border-radius:50px;font-size:14px;font-weight:700;text-align:center;">
              💬 WhatsApp Us
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>`);
}

function buildShippedEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const orderLink = `${SITE_URL}/store/orders/${d.orderId}`;

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#1a1a1a;padding:36px 40px;">

      <!-- Icon + Title -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#1d4ed8;border-radius:50%;margin:0 auto 20px;display:table;text-align:center;">
          <span style="display:table-cell;vertical-align:middle;font-size:34px;line-height:1;">🚚</span>
        </div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#ffffff;">It's On Its Way!</h1>
        <p style="margin:0;font-size:15px;color:#888;line-height:1.7;">
          Your SKMEI watch is heading to you, <strong style="color:#fff;">${firstName}</strong>!<br/>
          Order <strong style="color:#fff;">${label}</strong> has been handed to our delivery team.
        </p>
      </div>

      <!-- Items table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tbody>${buildItemRows(d.items)}</tbody>
        ${buildTotalsFooter(d)}
      </table>

      <!-- Info box -->
      <div style="background:#1a2540;border:1px solid #2a3d6a;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#93c5fd;line-height:1.7;">
          🕐 <strong>Estimated delivery:</strong> 2–4 business days.<br/>
          Our team will call you on <strong>${formatPhoneDisplay(d.customerPhone)}</strong> before arriving.${d.address ? `<br/>📍 <strong>Delivering to:</strong> ${[d.address.area, d.address.city, d.address.street, "Lebanon"].filter(Boolean).join(", ")}` : ""}
        </p>
      </div>

      <!-- Buttons -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
        <tr>
          <td class="btn-cell" style="padding-right:6px;width:50%;vertical-align:top;">
            <a href="${orderLink}" style="display:block;background:#e63946;color:#fff;text-decoration:none;padding:14px 16px;border-radius:50px;font-size:14px;font-weight:700;text-align:center;">
              View My Order
            </a>
          </td>
          <td class="btn-cell-last" style="padding-left:6px;width:50%;vertical-align:top;">
            <a href="${waLink}" style="display:block;background:#25d366;color:#fff;text-decoration:none;padding:14px 16px;border-radius:50px;font-size:14px;font-weight:700;text-align:center;">
              💬 WhatsApp Us
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>`);
}

function buildCancelledEmail(d: StatusEmailData): string {
  const label = statusLabel(d);
  const firstName = d.customerName.split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  return statusEmailShell(`
  <tr>
    <td class="ec" style="background:#1a1a1a;padding:36px 40px;">

      <!-- Icon + Title -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="width:72px;height:72px;background:#ef4444;border-radius:50%;margin:0 auto 20px;display:table;text-align:center;">
          <span style="display:table-cell;vertical-align:middle;font-size:30px;line-height:1;color:#fff;font-weight:900;">✕</span>
        </div>
        <h1 style="margin:0 0 10px;font-size:26px;font-weight:900;color:#ffffff;">Order Cancelled</h1>
        <p style="margin:0;font-size:15px;color:#888;line-height:1.7;">
          We're sorry, <strong style="color:#fff;">${firstName}</strong>.<br/>
          Your order <strong style="color:#fff;">${label}</strong> has been cancelled.
        </p>
      </div>

      <!-- Refunded Items -->
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:1.5px;">Refunded Items</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #3a1a1a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tbody>${buildItemRows(d.items)}</tbody>
        ${buildTotalsFooter(d, "#ef4444")}
      </table>

      <!-- Info box -->
      <div style="background:#2a1515;border:1px solid #3a1a1a;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
        <p style="margin:0;font-size:14px;color:#fca5a5;line-height:1.7;">
          If you believe this is a mistake or would like to place a new order, contact us on WhatsApp and we'll be happy to help!
        </p>
      </div>

      <a href="${waLink}" style="display:block;background:#25d366;color:#fff;text-decoration:none;padding:14px 20px;border-radius:50px;font-size:14px;font-weight:700;text-align:center;margin-bottom:8px;">
        💬 Contact via WhatsApp
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

  const resend = getResend();
  if (!resend) return;
  const result = await resend.emails.send({
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
  const resend = getResend();
  if (!resend) return;
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Order ${label} — ${data.customerName} — ${formatPrice(data.total)}`,
    html: buildAdminEmail(data),
  });

  if (result.error) {
    console.error("[email] Admin notification failed:", result.error);
  }
}
