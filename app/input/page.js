'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SAMPLE = `date,customer,product,revenue
2026-07-01,Acme Co,Widget A,1200
2026-07-03,Acme Co,Widget B,450
2026-07-10,Globex,Widget A,900`;

export default function InputPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [email, setEmail] = useState('');
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setEmail(data.email);
        setCheckingSession(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!csvText.trim()) {
      setError('Paste or upload some data first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyze this data.');
      sessionStorage.setItem('clarity-result', JSON.stringify(data));
      router.push('/insights');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) return null;

  return (
    <main className="page">
      <header className="topbar">
        <span className="brand">Clarity</span>
        <div className="topbar-right">
          <span className="muted">{email}</span>
          <button type="button" className="link-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <div className="card">
        <h1>Add your data</h1>
        <p className="subtitle">
          Paste a CSV below, or upload a .csv file. We&apos;ll clean it up and tell you what to do next.
        </p>

        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Upload CSV file
        </button>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} hidden />

        <form onSubmit={handleSubmit}>
          <textarea
            rows={12}
            placeholder={SAMPLE}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Analyzing…' : 'Clean & analyze'}
          </button>
        </form>
      </div>
    </main>
  );
}
