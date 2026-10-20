import { query, getConnection } from "../config/database.js";

export const METHODS = ["mondial_relay", "home_delivery"];
export function validateShippingConfig(methods) {
  if (!Array.isArray(methods) || methods.length !== 2 || new Set(methods.map(x => x.method)).size !== 2) throw new Error("Les deux modes de livraison sont requis.");
  return methods.map(({ method, free_shipping_threshold_cents: threshold, rates }) => {
    if (!METHODS.includes(method) || (threshold !== null && (!Number.isSafeInteger(threshold) || threshold < 0 || threshold > 100000000))) throw new Error("Seuil de livraison invalide.");
    if (!Array.isArray(rates) || rates.length > 250) throw new Error("Liste des pays invalide.");
    const countries = new Set();
    return { method, free_shipping_threshold_cents: threshold, rates: rates.map(rate => {
      const code = String(rate.country_code || "").trim().toUpperCase();
      const name = String(rate.country_name || "").trim();
      if (!/^[A-Z]{2}$/.test(code) || countries.has(code) || !name || name.length > 100 || !Number.isSafeInteger(rate.amount_cents) || rate.amount_cents < 0 || rate.amount_cents > 100000000) throw new Error("Vérifiez les pays, leurs codes uniques et leurs tarifs.");
      countries.add(code);
      return { country_code: code, country_name: name, amount_cents: rate.amount_cents };
    }) };
  });
}
export async function getShippingConfig() {
  const methods = await query("SELECT * FROM shipping_methods ORDER BY method");
  const rates = await query("SELECT * FROM shipping_rates ORDER BY country_name");
  return methods.map(method => ({ ...method, rates: rates.filter(rate => rate.method === method.method) }));
}
export async function saveShippingConfig(input) {
  const methods = validateShippingConfig(input);
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    for (const method of methods) {
      await connection.execute("INSERT INTO shipping_methods (method,free_shipping_threshold_cents) VALUES (?,?) ON DUPLICATE KEY UPDATE free_shipping_threshold_cents=VALUES(free_shipping_threshold_cents)", [method.method, method.free_shipping_threshold_cents]);
      await connection.execute("DELETE FROM shipping_rates WHERE method = ?", [method.method]);
      for (const rate of method.rates) await connection.execute("INSERT INTO shipping_rates (method,country_code,country_name,amount_cents) VALUES (?,?,?,?)", [method.method, rate.country_code, rate.country_name, rate.amount_cents]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
export function validateShippingAddress(shipping) {
  if (!METHODS.includes(shipping?.method)) throw new Error("Mode de livraison invalide.");
  const a = shipping.address;
  const limits = { full_name: 190, email: 190, phone: 30, country: 2, city: 120, postal_code: 20, address1: 255 };
  for (const [key, max] of Object.entries(limits)) {
    if (typeof a?.[key] !== "string" || !a[key].trim() || a[key].trim().length > max) throw new Error("Renseignez le nom, l’e-mail, le téléphone et l’adresse complète de livraison.");
    a[key] = a[key].trim();
  }
  a.country = a.country.toUpperCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email) || a.phone.replace(/\D/g, "").length < 6) throw new Error("E-mail ou téléphone invalide.");
  if (shipping.method === "mondial_relay" && (!shipping.relay_point?.id || (shipping.relay_point.country && shipping.relay_point.country.toUpperCase() !== a.country))) throw new Error("Sélectionnez un point relais dans le pays de livraison.");
}
export async function calculateShipping(connection, method, country, subtotal) {
  const [[rate]] = await connection.execute("SELECT r.amount_cents, m.free_shipping_threshold_cents FROM shipping_rates r JOIN shipping_methods m ON m.method=r.method WHERE r.method=? AND r.country_code=?", [method, country]);
  if (!rate) throw new Error("Ce mode de livraison n’est pas disponible pour ce pays.");
  return rate.free_shipping_threshold_cents !== null && subtotal >= Number(rate.free_shipping_threshold_cents) ? 0 : Number(rate.amount_cents);
}
