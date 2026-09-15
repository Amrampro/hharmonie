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

  const html = renderAdminOrderNotificationEmail({
    action,
    orderBefore,
    orderAfter,
    address,
    changes,
  });

  await mailer.sendMail({
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to,
    subject,
    html,
  });

  return { sent: true };
}
