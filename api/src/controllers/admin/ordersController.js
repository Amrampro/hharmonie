import { sendApiError } from "../../utils/apiError.js";
// api/src/controllers/admin/ordersController.js
import { adminOrdersService } from "../../services/admin/adminOrders.service.js";
import { sendAdminOrderNotificationEmail } from "../../services/email/adminOrderNotifications.service.js";

function sendError(res, error) {
  console.error("Admin request error:", error);
  return sendApiError(res, error);
}

function safeVal(v) {
  if (v === null || v === undefined || v === "") return null;
  return String(v);
}

function buildChanges(before, after, fields) {
  const changes = [];
  for (const f of fields) {
    const b = safeVal(before?.[f.key]);
    const a = safeVal(after?.[f.key]);
    if (b !== a) {
      changes.push({
        label: f.label,
        before: b ?? "-",
        after: a ?? "-",
      });
    }
  }
  return changes;
}

async function trySend(orderBefore, orderAfter, action, changes) {
  const address = orderAfter?.address || orderBefore?.address || null;
  const to =
    address?.email ||
    orderAfter?.customer_email ||
    orderBefore?.customer_email ||
    null;

  if (!to) return;

  const orderId = orderAfter?.id || orderBefore?.id || "";
  const subject =
    action === "deleted"
      ? `Votre commande ${orderId} a été supprimée`
      : action === "update_status"
      ? `Mise à jour du statut de votre commande ${orderId}`
      : `Mise à jour de la livraison - commande ${orderId}`;

  try {
    await sendAdminOrderNotificationEmail({
      to,
      subject,
      action,
      orderBefore,
      orderAfter,
      address,
      changes,
    });
  } catch (e) {
    console.error("[adminOrders] email failed:", e?.message);
  }
}

export const getAllOrders = async (req, res) => {
  try {
    const result = await adminOrdersService.list(req.query);
    return res.json(result);
  } catch (error) {
    console.error("Admin getAllOrders error:", error);
    return sendError(res, error);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await adminOrdersService.getById(req.params.id);
    return res.json({ order });
  } catch (error) {
    console.error("Admin getOrderById error:", error);
    return sendError(res, error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: "status is required" });

    const before = await adminOrdersService.getById(req.params.id);
    const after = await adminOrdersService.updateStatus(req.params.id, status);

    const changes = buildChanges(before, after, [
      { key: "status", label: "Statut commande" },
    ]);

    await trySend(before, after, "update_status", changes);

    return res.json({ message: "Order status updated successfully", order: after });
  } catch (error) {
    console.error("Admin updateOrderStatus error:", error);
    return sendError(res, error);
  }
};

export const updateOrderShipping = async (req, res) => {
  try {
    const before = await adminOrdersService.getById(req.params.id);
    const after = await adminOrdersService.updateShipping(req.params.id, req.body || {});

    const changes = buildChanges(before, after, [
      { key: "shipping_method", label: "Méthode de livraison" },
      { key: "shipping_status", label: "Statut de livraison" },
      { key: "shipping_tracking_number", label: "Numéro de suivi" },
      { key: "shipping_tracking_url", label: "Lien de suivi" },
    ]);

    await trySend(before, after, "update_shipping", changes);

    return res.json({ message: "Order shipping updated successfully", order: after });
  } catch (error) {
    console.error("Admin updateOrderShipping error:", error);
    return sendError(res, error);
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const before = await adminOrdersService.getById(req.params.id);

    await adminOrdersService.delete(req.params.id);

    await trySend(before, null, "deleted", []);

    return res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Admin deleteOrder error:", error);
    return sendError(res, error);
  }
};
