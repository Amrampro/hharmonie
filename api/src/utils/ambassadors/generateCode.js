// api/src/utils/ambassadors/generateCode.js
import crypto from "node:crypto";

export function generateAmbassadorCode({ firstName = "", lastName = "" } = {}) {
  const base =
    `${firstName}${lastName}`.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) || "AMB";
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  return `${base}-${rand}`; // ex: AMRAMBASS-4F9A2C
}