const REVENUE_HINTS = ['revenue', 'sales', 'amount', 'price', 'value', 'total', 'income'];

export function generateInsights(rows, columns, stats) {
  const notes = [];
  const rowCount = stats.cleanedRowCount;

  if (stats.duplicatesRemoved > 0) {
    notes.push(`Removed ${stats.duplicatesRemoved} duplicate row${stats.duplicatesRemoved === 1 ? '' : 's'}.`);
  }
  if (stats.emptyRowsRemoved > 0) {
    notes.push(`Removed ${stats.emptyRowsRemoved} empty row${stats.emptyRowsRemoved === 1 ? '' : 's'}.`);
  }

  for (const col of columns.filter((c) => c.missingRate > 0)) {
    notes.push(`"${col.name}" is missing in ${Math.round(col.missingRate * 100)}% of rows.`);
  }

  for (const col of columns.filter((c) => c.type === 'numeric')) {
    notes.push(`"${col.name}": total ${formatNumber(col.sum)}, average ${formatNumber(col.avg)}.`);
  }

  for (const col of columns.filter((c) => c.type === 'date')) {
    notes.push(`"${col.name}" ranges from ${formatDate(col.earliest)} to ${formatDate(col.latest)}.`);
  }

  const recommendation = pickRecommendation({ rows, columns, stats, rowCount });

  return { notes, recommendation };
}

function pickRecommendation({ rows, columns, stats, rowCount }) {
  const duplicateRate = stats.originalRowCount ? stats.duplicatesRemoved / stats.originalRowCount : 0;
  if (duplicateRate > 0.05) {
    return `${Math.round(duplicateRate * 100)}% of your original records were duplicates. Tighten up how data enters your system (a single entry point, or a de-dup check) before trusting any analysis built on top of it.`;
  }

  const worstMissing = [...columns]
    .filter((c) => c.missingRate > 0.2)
    .sort((a, b) => b.missingRate - a.missingRate)[0];
  if (worstMissing) {
    return `"${worstMissing.name}" is missing in ${Math.round(worstMissing.missingRate * 100)}% of your records. Fix data collection there first — it's limiting what you can learn from the rest of this dataset.`;
  }

  const dateCol = columns.find((c) => c.type === 'date' && typeof c.daysSinceLatest === 'number');
  if (dateCol && dateCol.daysSinceLatest > 30) {
    return `Your most recent "${dateCol.name}" entry is ${dateCol.daysSinceLatest} days old. Refresh this data before making decisions from it — it may no longer reflect your business today.`;
  }

  const revenueCol = columns.find(
    (c) => c.type === 'numeric' && REVENUE_HINTS.some((h) => c.name.toLowerCase().includes(h))
  );
  const categoryCol = columns.find(
    (c) => c.type === 'text' && c.uniqueCount > 1 && c.uniqueCount <= Math.max(20, rowCount * 0.5)
  );
  if (revenueCol && categoryCol) {
    const totals = {};
    for (const row of rows) {
      const key = row[categoryCol.name] || '(blank)';
      const val = Number(String(row[revenueCol.name]).replace(/[$,]/g, '')) || 0;
      totals[key] = (totals[key] || 0) + val;
    }
    const [topKey, topValue] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] || [];
    if (topKey) {
      return `"${topKey}" is your top "${categoryCol.name}" by ${revenueCol.name}, at ${formatNumber(
        topValue
      )}. Consider doubling down here — more budget, attention, or outreach — since it's already outperforming the rest.`;
    }
  }

  if (revenueCol) {
    return `Your "${revenueCol.name}" averages ${formatNumber(
      revenueCol.avg
    )} across ${rowCount} records. Add a category column next time (customer, product, or region) so we can tell you exactly where to focus.`;
  }

  return `Your data is clean — ${rowCount} usable rows with no major gaps. To get sharper next-step recommendations, include a date column and a numeric metric that matters to your business (revenue, orders, signups, etc.).`;
}

function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}
