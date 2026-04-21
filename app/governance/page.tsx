import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { ProposalForm } from '@/components/governance/proposal-form'
import { ProposalList } from '@/components/governance/proposal-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { XionWalletConnect } from '@/components/ui/xion-wallet-connect'
import { Balance, Users, Vote } from 'lucide-react'

export default async function GovernancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Community Governance</h1>
            <p className="text-muted-foreground">
              Participate in community decisions through blockchain-based voting
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center">
            <XionWalletConnect />
          </div>

          {/* Governance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-2">
                <Balance className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Active Proposals</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600 mt-2">3</p>
              <p className="text-sm text-muted-foreground">Currently voting</p>
            </div>
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Participants</h3>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">127</p>
              <p className="text-sm text-muted-foreground">Active voters</p>
            </div>
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Total Votes</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-2">1,842</p>
              <p className="text-sm text-muted-foreground">Cast this month</p>
            </div>
          </div>

          {/* Governance Interface */}
          <Tabs defaultValue="proposals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="proposals">Active Proposals</TabsTrigger>
              <TabsTrigger value="create">Create Proposal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="proposals" className="space-y-6">
              <ProposalList />
            </TabsContent>
            
            <TabsContent value="create" className="space-y-6">
              <ProposalForm onSuccess={() => {
                // Switch to proposals tab after successful creation
                const tabsList = document.querySelector('[data-value="proposals"]') as HTMLElement
                tabsList?.click()
              }} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
