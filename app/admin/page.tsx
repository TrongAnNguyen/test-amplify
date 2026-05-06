import BudgetUploader from './BudgetUploader';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Upload and manage budget data.</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">Budget Data Upload</h2>
          <BudgetUploader />
        </div>
      </div>
    </div>
  );
}
