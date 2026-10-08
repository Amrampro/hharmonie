import { randomBytes } from "node:crypto";
import { query } from "../../config/database.js";
import { orderTrackingUrl, publicSiteUrl } from "../../utils/publicSite.js";
// api/src/services/email/adminOrderNotifications.service.js
import { mailer } from "../../config/mailer.js";
import { renderAdminOrderNotificationEmail } from "../../templates/adminOrderNotificationEmailTemplate.js";

export async function sendAdminOrderNotificationEmail({
  to,
  subject,
  action,
  orderBefore,
  orderAfter,
  address,
  changes,
}) {
  if (!to) return { skipped: true, reason: "missing_email" };

  const order = orderAfter || orderBefore;
  const [company] = await query("SELECT * FROM parameters ORDER BY created_at ASC LIMIT 1");
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  if (!fromEmail) throw new Error("MAIL_FROM_EMAIL is required");
  if (action !== "deleted" && !order.tracking_token) {
    await query("UPDATE orders SET tracking_token = COALESCE(tracking_token, ?) WHERE id = ?", [randomBytes(32).toString("hex"), order.id]);
    const [saved] = await query("SELECT tracking_token FROM orders WHERE id = ?", [order.id]);
    order.tracking_token = saved.tracking_token;
  }
  const orderUrl = action === "deleted" ? null : orderTrackingUrl(order);
  const html = renderAdminOrderNotificationEmail({
    action,
    orderBefore,
    orderAfter,
    address,
    changes, company: company || {}, orderUrl, siteUrl: publicSiteUrl(),
  });

  await mailer.sendMail({
    from: { name: company?.name || process.env.MAIL_FROM_NAME || "Hormones & Harmonie", address: fromEmail },
    replyTo: company?.email || fromEmail,
    to,
    subject,
    html,
  });

  return { sent: true };
}
