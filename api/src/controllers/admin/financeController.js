import { sendApiError } from "../../utils/apiError.js";
// api/src/controllers/admin/financeController.js
import { adminFinanceService } from "../../services/admin/adminFinance.service.js";

function sendError(res, error) {
  console.error("Admin request error:", error);
  return sendApiError(res, error);
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
