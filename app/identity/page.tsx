import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/header'
import { IdentityProfile } from '@/components/identity/identity-profile'
import { XionWalletConnect } from '@/components/ui/xion-wallet-connect'
import { BlockchainStatus } from '@/components/ui/blockchain-status'

export default async function IdentityPage() {
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
            <h1 className="text-3xl font-bold text-foreground">Blockchain Identity</h1>
            <p className="text-muted-foreground">
              Manage your on-chain identity and reputation in the community watch system
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center">
            <XionWalletConnect />
          </div>

          {/* Identity Profile */}
          <IdentityProfile />

          {/* Blockchain Status */}
          <BlockchainStatus />
        </div>
      </main>
    </div>
  )
}
