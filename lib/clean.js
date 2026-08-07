export function cleanRows(rawRows, fields) {
  const originalCount = rawRows.length;

  const trimmed = rawRows.map((row) => {
    const clean = {};
    for (const key of fields) {
      const value = row[key];
      clean[key] = typeof value === 'string' ? value.trim() : value ?? '';
    }
    return clean;
  });

  const nonEmpty = trimmed.filter((row) => fields.some((f) => String(row[f] ?? '').length > 0));
  const emptyRowsRemoved = trimmed.length - nonEmpty.length;

  const seen = new Set();
  const deduped = [];
  for (const row of nonEmpty) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(row);
    }
  }
  const duplicatesRemoved = nonEmpty.length - deduped.length;

  const columns = fields.map((field) => analyzeColumn(deduped, field));

  return {
    cleanedRows: deduped,
    columns,
    stats: {
      originalRowCount: originalCount,
      cleanedRowCount: deduped.length,
      emptyRowsRemoved,
      duplicatesRemoved,
    },
  };
}

function analyzeColumn(rows, field) {
  const values = rows.map((r) => r[field]);
  const nonEmptyValues = values.filter((v) => String(v ?? '').length > 0);
  const missingCount = values.length - nonEmptyValues.length;

  const numericValues = nonEmptyValues
    .map((v) => Number(String(v).replace(/[$,]/g, '')))
    .filter((n) => !Number.isNaN(n));
  const isNumeric = nonEmptyValues.length > 0 && numericValues.length === nonEmptyValues.length;

  const dateValues = nonEmptyValues
    .map((v) => new Date(v))
    .filter((d) => !Number.isNaN(d.getTime()));
  const isDate = !isNumeric && nonEmptyValues.length > 0 && dateValues.length === nonEmptyValues.length;

  const column = {
    name: field,
    missingCount,
    missingRate: values.length ? missingCount / values.length : 0,
    type: isNumeric ? 'numeric' : isDate ? 'date' : 'text',
  };

  if (isNumeric && numericValues.length) {
    column.min = Math.min(...numericValues);
    column.max = Math.max(...numericValues);
    column.sum = numericValues.reduce((a, b) => a + b, 0);
    column.avg = column.sum / numericValues.length;
  }

  if (isDate && dateValues.length) {
    const times = dateValues.map((d) => d.getTime());
    column.earliest = new Date(Math.min(...times)).toISOString();
    column.latest = new Date(Math.max(...times)).toISOString();
    column.daysSinceLatest = Math.floor((Date.now() - Math.max(...times)) / 86400000);
  }

  if (!isNumeric && !isDate) {
    const counts = {};
    for (const v of nonEmptyValues) counts[v] = (counts[v] || 0) + 1;
    column.topValues = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value, count]) => ({ value, count }));
    column.uniqueCount = Object.keys(counts).length;
  }

  return column;
}
