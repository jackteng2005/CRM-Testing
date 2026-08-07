'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const raw = sessionStorage.getItem('clarity-result');
        if (!raw) {
          router.replace('/input');
          return;
        }
        setResult(JSON.parse(raw));
        setChecking(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem('clarity-result');
    router.replace('/login');
  }

  function handleNewData() {
    sessionStorage.removeItem('clarity-result');
    router.push('/input');
  }

  if (checking || !result) return null;

  const { cleanedRows, columns, stats, insights } = result;
  const previewRows = cleanedRows.slice(0, 20);
  const fields = columns.map((c) => c.name);

  return (
    <main className="page">
      <header className="topbar">
        <span className="brand">Clarity</span>
        <div className="topbar-right">
          <button type="button" className="link-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="card recommendation-card">
        <span className="eyebrow">Recommended next step</span>
        <p>{insights.recommendation}</p>
      </div>

      <div className="card">
        <h2>Data quality</h2>
        <ul className="stat-list">
          <li>
            <strong>{stats.cleanedRowCount}</strong>
            clean rows (from {stats.originalRowCount})
          </li>
          <li>
            <strong>{stats.duplicatesRemoved}</strong>
            duplicates removed
          </li>
          <li>
            <strong>{stats.emptyRowsRemoved}</strong>
            empty rows removed
          </li>
        </ul>
        {insights.notes.length > 0 && (
          <ul className="notes-list">
            {insights.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>
          Cleaned data
          {cleanedRows.length > previewRows.length ? ` (first ${previewRows.length} of ${cleanedRows.length})` : ''}
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {fields.map((f) => (
                  <th key={f}>{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i}>
                  {fields.map((f) => (
                    <td key={f}>{row[f]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="button" className="btn btn-secondary" onClick={handleNewData}>
        Analyze new data
      </button>
    </main>
  );
}
