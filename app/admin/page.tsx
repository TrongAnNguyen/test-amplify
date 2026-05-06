import BudgetUploader from '@/components/admin/BudgetUploader'
import EmployeeUploader from '@/components/admin/EmployeeUploader'

export default function AdminPage() {
  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Upload and manage application data.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
            <h2 className="text-card-foreground mb-4 text-xl font-semibold">
              Employee Data Upload
            </h2>
            <EmployeeUploader />
          </div>

          <div className="bg-card border-border rounded-lg border p-6 shadow-sm">
            <h2 className="text-card-foreground mb-4 text-xl font-semibold">Budget Data Upload</h2>
            <BudgetUploader />
          </div>
        </div>
      </div>
    </div>
  )
}
