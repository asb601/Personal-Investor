'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META } from '@/lib/category-meta';
import type { CategoryName } from '@/lib/category-meta';
import { CATEGORY_ID_MAP } from '@/lib/category-map-id';
import type { Expense } from '../types';

type ParsedRow = {
  date: string;
  amount: number;
  type: 'expense' | 'income';
  category: CategoryName;
  note: string;
};

type Props = {
  onClose: () => void;
  onImport: (rows: ParsedRow[]) => Promise<void>;
};

/* ──────────────────────────────
   CSV parser (handles quoted fields)
────────────────────────────── */

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  });
}

/* ──────────────────────────────
   Try to detect a date from various formats
────────────────────────────── */

function parseDate(raw: string): string | null {
  // Try ISO "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // "DD/MM/YYYY" or "DD-MM-YYYY"
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // "MM/DD/YYYY"
  const mdy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mdy) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  // fallback: let JS try
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return null;
}

/* ──────────────────────────────
   Guess category from note/description
────────────────────────────── */

const CATEGORY_KEYWORDS: Record<CategoryName, string[]> = {
  Food: ['food', 'restaurant', 'zomato', 'swiggy', 'uber eats', 'dominos', 'mcdonald', 'cafe', 'lunch', 'dinner', 'breakfast', 'grocery', 'bigbasket'],
  Transport: ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro', 'bus', 'cab', 'auto', 'toll', 'parking'],
  Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'shop', 'store', 'purchase'],
  Entertainment: ['netflix', 'prime', 'hotstar', 'movie', 'spotify', 'game', 'youtube', 'subscription'],
  Bills: ['electricity', 'water', 'gas', 'rent', 'emi', 'insurance', 'recharge', 'broadband', 'wifi', 'phone', 'bill', 'tax'],
  Health: ['hospital', 'medical', 'pharmacy', 'doctor', 'medicine', 'health', 'gym', 'fitness'],
  'Regular Income': ['salary', 'income', 'credit', 'received'],
  Bonus: ['bonus', 'reward', 'cashback'],
  Profits: ['dividend', 'profit', 'interest', 'return'],
};

function guessCategory(note: string, amount: number): { category: CategoryName; type: 'expense' | 'income' } {
  const lower = note.toLowerCase();

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      const meta = CATEGORY_META[cat as CategoryName];
      return { category: cat as CategoryName, type: meta.type as 'expense' | 'income' };
    }
  }

  // Default: negative amounts → income, positive → expense
  if (amount < 0) {
    return { category: 'Regular Income', type: 'income' };
  }
  return { category: 'Food', type: 'expense' };
}

/* ──────────────────────────────
   Component
────────────────────────────── */

export function ImportModal({ onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState('');
  const [importCount, setImportCount] = useState(0);

  // Column mapping
  const [dateCol, setDateCol] = useState<number>(-1);
  const [amountCol, setAmountCol] = useState<number>(-1);
  const [noteCol, setNoteCol] = useState<number>(-1);

  const allCategories = Object.keys(CATEGORY_META) as CategoryName[];

  const handleFile = useCallback((file: File) => {
    setError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        setError('File must have a header row and at least one data row.');
        return;
      }

      const hdrs = rows[0];
      setHeaders(hdrs);

      // Auto-detect columns
      const dateCandidates = ['date', 'transaction date', 'txn date', 'value date', 'posting date'];
      const amountCandidates = ['amount', 'debit', 'withdrawal', 'txn amount', 'transaction amount'];
      const noteCandidates = ['description', 'narration', 'particulars', 'note', 'remarks', 'details'];

      const find = (candidates: string[]) =>
        hdrs.findIndex((h) => candidates.some((c) => h.toLowerCase().includes(c)));

      const di = find(dateCandidates);
      const ai = find(amountCandidates);
      const ni = find(noteCandidates);

      setDateCol(di >= 0 ? di : 0);
      setAmountCol(ai >= 0 ? ai : 1);
      setNoteCol(ni >= 0 ? ni : hdrs.length > 2 ? 2 : -1);

      // Parse the data rows
      const dataRows = rows.slice(1).filter((r) => r.some((c) => c.length > 0));
      const parsed: ParsedRow[] = [];

      for (const row of dataRows) {
        const rawDate = row[di >= 0 ? di : 0] ?? '';
        const rawAmount = row[ai >= 0 ? ai : 1] ?? '';
        const rawNote = row[ni >= 0 ? ni : 2] ?? '';

        const date = parseDate(rawDate);
        const amount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.\-]/g, '')));

        if (!date || isNaN(amount) || amount === 0) continue;

        const { category, type } = guessCategory(rawNote, parseFloat(rawAmount.replace(/[^0-9.\-]/g, '')));

        parsed.push({ date, amount, type, category, note: rawNote });
      }

      if (parsed.length === 0) {
        setError('Could not parse any valid transactions from this file.');
        return;
      }

      setParsedRows(parsed);
      setStep('preview');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = async () => {
    setStep('importing');
    try {
      await onImport(parsedRows);
      setImportCount(parsedRows.length);
      setStep('done');
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('preview');
    }
  };

  const updateRow = (index: number, field: keyof ParsedRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const removeRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card w-full sm:max-w-2xl max-h-[85vh] rounded-t-2xl sm:rounded-2xl border border-border shadow-xl flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2 pb-2 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {step === 'upload' && 'Import Bank Statement'}
            {step === 'preview' && `Preview — ${parsedRows.length} transactions`}
            {step === 'importing' && 'Importing...'}
            {step === 'done' && 'Import Complete'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* ── Upload Step ── */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drop your CSV file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse — supports most bank statement formats
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>

              <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Supported formats:</p>
                <p>• CSV files from most Indian banks (SBI, HDFC, ICICI, Axis, etc.)</p>
                <p>• Columns: Date, Amount, Description/Narration</p>
                <p>• Categories are auto-detected from descriptions</p>
              </div>
            </div>
          )}

          {/* ── Preview Step ── */}
          {step === 'preview' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Review and edit categories before importing. Detected from <span className="font-medium text-foreground">{fileName}</span>
              </p>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {parsedRows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
                  >
                    {/* Date */}
                    <span className="text-xs text-muted-foreground shrink-0 w-20">
                      {new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>

                    {/* Note */}
                    <span className="text-xs truncate flex-1 min-w-0" title={row.note}>
                      {row.note || '—'}
                    </span>

                    {/* Amount */}
                    <span
                      className={cn(
                        'text-xs font-mono font-semibold shrink-0',
                        row.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {row.type === 'income' ? '+' : '-'}₹{row.amount.toLocaleString('en-IN')}
                    </span>

                    {/* Category selector */}
                    <select
                      value={row.category}
                      onChange={(e) => {
                        const cat = e.target.value as CategoryName;
                        const meta = CATEGORY_META[cat];
                        updateRow(i, 'category', cat);
                        updateRow(i, 'type', meta.type);
                      }}
                      className="bg-secondary border border-border rounded-md px-1.5 py-1 text-xs shrink-0 w-28"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_META[c].icon} {c}
                        </option>
                      ))}
                    </select>

                    {/* Remove */}
                    <button
                      onClick={() => removeRow(i)}
                      className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Importing Step ── */}
          {step === 'importing' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Importing {parsedRows.length} transactions...
              </p>
            </div>
          )}

          {/* ── Done Step ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm font-medium">
                Successfully imported {importCount} transactions!
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                Done
              </button>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && parsedRows.length > 0 && (
          <div className="px-4 pb-6 pt-2 border-t border-border shrink-0 flex gap-2">
            <button
              onClick={() => { setStep('upload'); setParsedRows([]); setHeaders([]); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import {parsedRows.length} Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
