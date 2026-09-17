// mysql2 sends JS numbers as DOUBLE in prepared statements. Some server versions
// reject that type for LIMIT/OFFSET. Only inline validated pagination integers;
// all filters and user content stay bound parameters.
export function preparePagination(sql, params = []) {
  const match = sql.match(/\bLIMIT\s+\?(?:\s+OFFSET\s+\?)?\s*;?\s*$/i);
  if (!match) return { sql, params };
  const count = /OFFSET/i.test(match[0]) ? 2 : 1;
  const values = params.slice(-count);
  if (params.length < count || values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
    throw Object.assign(new Error("Pagination invalide : utilisez des entiers positifs ou nuls."), { statusCode: 400 });
  }
  let index = 0;
  const clause = match[0].replace(/\?/g, () => String(values[index++]));
  return { sql: sql.slice(0, match.index) + clause, params: params.slice(0, -count) };
}
