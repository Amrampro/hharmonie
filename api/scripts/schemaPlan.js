import { readFileSync } from "node:fs";

// Read CREATE statements only. Never execute schema.sql's DROP/USE statements.
export function readExpectedSchema() {
  const source = readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
  return [...source.matchAll(/CREATE TABLE (\w+) \(([\s\S]*?)\) ENGINE=[^;]+;/g)].map((match) => ({
    name: match[1],
    create: match[0].replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS "),
    columns: [...match[2].matchAll(/^  (`?\w+`?) ((?:VARCHAR|CHAR|TEXT|LONGTEXT|MEDIUMBLOB|INT|TINYINT|DECIMAL|JSON|ENUM|DATETIME|TIMESTAMP|DATE|TIME)\b[^\r\n]*)/gm)].map((column) => ({
      name: column[1].replaceAll("`", ""),
      definition: column[2].replace(/,$/, ""),
    })),
  }));
}

export function planSchema(expected, actual) {
  const statements = [];
  const manual = [];
  for (const table of expected) {
    const existing = actual.filter((column) => column.TABLE_NAME === table.name);
    if (!existing.length) {
      statements.push(table.create);
      continue;
    }
    for (const column of table.columns) {
      const found = existing.find((item) => item.COLUMN_NAME === column.name);
      if (!found) {
        // Only add columns with an explicit default. Never invent existing data.
        if (/\bDEFAULT\b/.test(column.definition) && !/PRIMARY KEY|UNIQUE/.test(column.definition)) {
          statements.push(`ALTER TABLE \`${table.name}\` ADD COLUMN \`${column.name}\` ${column.definition};`);
        } else {
          manual.push(`${table.name}.${column.name}: colonne obligatoire absente, intervention manuelle nécessaire.`);
        }
      } else if (column.name === "id") {
        const uuidExpected = column.definition.startsWith("VARCHAR(36)");
        const supportedAutoId = table.name === "newsletter_subscribers" && String(found.EXTRA).includes("auto_increment");
        if (uuidExpected && !supportedAutoId && (!/^(var)?char$/i.test(found.DATA_TYPE) || Number(found.CHARACTER_MAXIMUM_LENGTH) < 36)) {
          manual.push(`${table.name}.id: type incompatible avec les UUID de l’API (${found.COLUMN_TYPE}).`);
        }
      }
    }
  }
  return { statements, manual };
}
