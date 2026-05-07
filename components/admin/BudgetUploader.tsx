'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { apiClient } from '@/utils/apiClient'

export default function BudgetUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<
    'idle' | 'parsing' | 'uploading' | 'success' | 'error' | 'cancelled'
  >('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [errorMessage, setErrorMessage] = useState('')
  const [columnMatch, setColumnMatch] = useState<{
    matched: number
    total: number
    missing: string[]
  } | null>(null)
  const isCancelled = useRef(false)

  const EXPECTED_HEADERS = ['category', 'company', 'budgetName', 'amount', 'omnicom']

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
      setErrorMessage('')
      setProgress({ current: 0, total: 0, success: 0, failed: 0 })
      setColumnMatch(null)
    }
  }

  const processUpload = async () => {
    if (!file) return

    setStatus('parsing')
    isCancelled.current = false

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (isCancelled.current) {
          setStatus('cancelled')
          return
        }

        // Check column matches
        const headers = results.meta.fields || []
        const matched = EXPECTED_HEADERS.filter((h) => headers.includes(h))
        const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h))
        setColumnMatch({
          matched: matched.length,
          total: EXPECTED_HEADERS.length,
          missing,
        })

        const rows = results.data as any[]
        setStatus('uploading')

        await new Promise((resolve) => setTimeout(resolve, 2000))

        setProgress((prev) => ({ ...prev, total: rows.length }))

        let successCount = 0
        let failedCount = 0

        const BATCH_SIZE = 3
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          if (isCancelled.current) {
            setStatus('cancelled')
            return
          }

          const batch = rows.slice(i, i + BATCH_SIZE)

          await Promise.all(
            batch.map(async (row) => {
              if (isCancelled.current) return

              try {
                // Map CSV columns to Schema fields
                await apiClient.models.Budget.create({
                  category: String(row.category || ''),
                  company: String(row.company || ''),
                  budgetName: String(row.budgetName || ''),
                  amount: parseFloat(row.amount) || 0,
                  omnicom:
                    String(row.omnicom).toLowerCase() === 'true' || String(row.omnicom) === '1',
                })
                successCount++
              } catch (error) {
                console.error('Error creating row:', row, error)
                failedCount++
              }
            }),
          )

          setProgress((prev) => ({
            ...prev,
            current: Math.min(i + BATCH_SIZE, rows.length),
            success: successCount,
            failed: failedCount,
          }))
        }

        setStatus('success')
      },
      error: (error) => {
        setStatus('error')
        setErrorMessage(error.message)
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-foreground mb-2 block text-sm font-medium">Upload CSV File</label>
        <p className="text-muted-foreground mb-4 text-xs">
          Expected headers: category, company, budgetName, amount, omnicom
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="text-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 block w-full cursor-pointer text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={processUpload}
          disabled={!file || status === 'parsing' || status === 'uploading'}
          className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
        >
          {status === 'idle' && 'Upload Data'}
          {status === 'parsing' && 'Parsing CSV...'}
          {status === 'uploading' && `Uploading... ${progress.current}/${progress.total}`}
          {status === 'success' && 'Upload Complete'}
          {status === 'error' && 'Upload Failed'}
          {status === 'cancelled' && 'Upload Cancelled'}
        </button>

        {(status === 'parsing' || status === 'uploading') && (
          <button
            onClick={() => (isCancelled.current = true)}
            className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
        )}
      </div>

      {columnMatch && (
        <div
          className={`mt-4 rounded-md p-4 text-sm ${
            columnMatch.matched === columnMatch.total
              ? 'bg-green-50 text-green-800'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          <p className="font-semibold">
            Column Match: {columnMatch.matched}/{columnMatch.total} fields found
          </p>
          {columnMatch.missing.length > 0 && (
            <p className="mt-1 text-xs">Missing: {columnMatch.missing.join(', ')}</p>
          )}
        </div>
      )}

      {(status === 'uploading' || status === 'success' || status === 'cancelled') && (
        <div className="bg-muted mt-4 rounded-md p-4 text-sm">
          <p>Status: {status}</p>
          <p>Total rows: {progress.total}</p>
          <p className="text-green-600">Successfully created: {progress.success}</p>
          {progress.failed > 0 && <p className="text-red-600">Failed: {progress.failed}</p>}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
          Error: {errorMessage}
        </div>
      )}
    </div>
  )
}
