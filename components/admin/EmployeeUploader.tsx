'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { apiClient } from '@/utils/apiClient'

export default function EmployeeUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'uploading' | 'success' | 'error'>(
    'idle',
  )
  const [progress, setProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [errorMessage, setErrorMessage] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
      setErrorMessage('')
      setProgress({ current: 0, total: 0, success: 0, failed: 0 })
    }
  }

  const processUpload = async () => {
    if (!file) return

    setStatus('parsing')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        setStatus('uploading')
        setProgress((prev) => ({ ...prev, total: rows.length }))

        let successCount = 0
        let failedCount = 0

        // Process sequentially to avoid overwhelming the API
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          setProgress((prev) => ({ ...prev, current: i + 1 }))

          try {
            // Map CSV columns to Employee Schema fields
            await apiClient.models.Employee.create({
              primaryContact: String(row.primaryContact || ''),
              category: String(row.category || ''),
              companyBrand: String(row.companyBrand || ''),
              clientName: String(row.clientName || ''),
              clientTitle: String(row.clientTitle || ''),
            })
            successCount++
          } catch (error) {
            console.error('Error creating row:', row, error)
            failedCount++
          }
          setProgress((prev) => ({ ...prev, success: successCount, failed: failedCount }))
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
        <label className="text-foreground mb-2 block text-sm font-medium">Upload Employee CSV File</label>
        <p className="text-muted-foreground mb-4 text-xs">
          Expected headers: primaryContact, category, companyBrand, clientName, clientTitle
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="text-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
        />
      </div>

      <button
        onClick={processUpload}
        disabled={!file || status === 'parsing' || status === 'uploading'}
        className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'idle' && 'Upload Data'}
        {status === 'parsing' && 'Parsing CSV...'}
        {status === 'uploading' && `Uploading... ${progress.current}/${progress.total}`}
        {status === 'success' && 'Upload Complete'}
        {status === 'error' && 'Upload Failed'}
      </button>

      {(status === 'uploading' || status === 'success') && (
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
