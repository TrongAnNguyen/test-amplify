'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export default function BudgetUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMessage('');
      setProgress({ current: 0, total: 0, success: 0, failed: 0 });
    }
  };

  const processUpload = async () => {
    if (!file) return;
    
    setStatus('parsing');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        setStatus('uploading');
        setProgress(prev => ({ ...prev, total: rows.length }));
        
        let successCount = 0;
        let failedCount = 0;

        // Process sequentially to avoid overwhelming the API
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProgress(prev => ({ ...prev, current: i + 1 }));
          
          try {
            // Map CSV columns to Schema fields
            await client.models.Budget.create({
              category: String(row.category || ''),
              company: String(row.company || ''),
              budgetName: String(row.budgetName || ''),
              amount: parseFloat(row.amount) || 0,
              omnicom: String(row.omnicom).toLowerCase() === 'true' || String(row.omnicom) === '1'
            });
            successCount++;
          } catch (error) {
            console.error('Error creating row:', row, error);
            failedCount++;
          }
          setProgress(prev => ({ ...prev, success: successCount, failed: failedCount }));
        }

        setStatus('success');
      },
      error: (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Upload CSV File
        </label>
        <p className="text-xs text-muted-foreground mb-4">
          Expected headers: category, company, budgetName, amount, omnicom
        </p>
        <input 
          type="file" 
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90"
        />
      </div>

      <button
        onClick={processUpload}
        disabled={!file || status === 'parsing' || status === 'uploading'}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 font-medium hover:bg-blue-700 transition-colors"
      >
        {status === 'idle' && 'Upload Data'}
        {status === 'parsing' && 'Parsing CSV...'}
        {status === 'uploading' && `Uploading... ${progress.current}/${progress.total}`}
        {status === 'success' && 'Upload Complete'}
        {status === 'error' && 'Upload Failed'}
      </button>

      {(status === 'uploading' || status === 'success') && (
        <div className="mt-4 p-4 bg-muted rounded-md text-sm">
          <p>Status: {status}</p>
          <p>Total rows: {progress.total}</p>
          <p className="text-green-600">Successfully created: {progress.success}</p>
          {progress.failed > 0 && <p className="text-red-600">Failed: {progress.failed}</p>}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md text-sm">
          Error: {errorMessage}
        </div>
      )}
    </div>
  );
}
