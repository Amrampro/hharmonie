import pool from "../src/config/database.js";
import { readExpectedSchema, planSchema } from "./schemaPlan.js";

const apply = process.argv.includes("--apply");
try {
  const [environment] = await pool.query("SELECT VERSION() AS version, @@sql_mode AS sql_mode, DATABASE() AS db");
  console.log("Base contrôlée :", environment[0]);
  const inspect = async () => {
    const [columns] = await pool.execute(
      "SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()"
    );
    return planSchema(readExpectedSchema(), columns);
  };
  const plan = await inspect();
  for (const message of plan.manual) console.error(message);
  for (const sql of plan.statements) console.log(sql);
  if (apply && plan.manual.length) {
    throw new Error("Migration arrêtée : incompatibilités nécessitant une vérification manuelle.");
  }
  if (apply) {
    for (const sql of plan.statements) await pool.query(sql);
    const remaining = await inspect();
    if (remaining.statements.length || remaining.manual.length) throw new Error("Schéma encore incomplet après migration.");
    console.log("Migration additive terminée. Aucune donnée existante supprimée.");
  } else if (plan.statements.length || plan.manual.length) {
    console.log("Écarts détectés. Après sauvegarde, lancer npm run db:migrate pour appliquer les ajouts affichés.");
    process.exitCode = 1;
  } else {
    console.log("Toutes les tables et colonnes attendues sont présentes.");
  }
} catch (error) {
  console.error("Contrôle/migration interrompu :", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
