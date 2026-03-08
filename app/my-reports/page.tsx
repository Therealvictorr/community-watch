import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockReports } from '@/lib/mock-data'

export default async function MyReportsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main className="container mx-auto px-4 py-8 space-y-6">
          <h1 className="text-3xl font-bold">My Reports</h1>
          {mockReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${report.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </main>
      </div>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={null} />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Please sign in to view your reports.</p>
        </main>
      </div>
    )
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">My Reports</h1>
        {reports?.length ? (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>{report.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/reports/${report.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground">You have not created any reports yet.</p>
        )}
      </main>
    </div>
  )
}
