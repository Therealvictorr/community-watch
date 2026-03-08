import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ReportForm } from '@/components/report-form'

export default async function NewReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create a Report</h1>
          <p className="text-muted-foreground mb-8">
            Help your community by reporting a missing person, vehicle, or item
          </p>
          <ReportForm userId={user.id} />
        </div>
      </main>
    </div>
  )
}
