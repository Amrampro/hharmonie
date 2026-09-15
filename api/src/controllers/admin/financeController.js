// api/src/controllers/admin/financeController.js
import { adminFinanceService } from "../../services/admin/adminFinance.service.js";

function sendError(res, error) {
  const code = error.statusCode || 500;
  const payload = { error: error.message || "Internal server error" };
  if (error.details) payload.details = error.details;
  return res.status(code).json(payload);
}

export const listFinance = async (req, res) => {
  try {
    const result = await adminFinanceService.list(req.query);
    return res.json(result);
  } catch (error) {
    console.error("Admin listFinance error:", error);
    return sendError(res, error);
  }
};
