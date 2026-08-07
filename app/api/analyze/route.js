import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { cleanRows } from '@/lib/clean';
import { generateInsights } from '@/lib/insights';

export async function POST(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token && verifySession(token);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { csvText } = await req.json();
  if (!csvText || !csvText.trim()) {
    return NextResponse.json({ error: 'Please provide some data to analyze.' }, { status: 400 });
  }

  const parsed = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: false });
  const fields = parsed.meta.fields || [];
  if (!fields.length || !parsed.data.length) {
    return NextResponse.json({ error: 'Could not find any rows in the data provided.' }, { status: 400 });
  }

  const { cleanedRows, columns, stats } = cleanRows(parsed.data, fields);
  const insights = generateInsights(cleanedRows, columns, stats);

  return NextResponse.json({ cleanedRows, columns, stats, insights });
}
