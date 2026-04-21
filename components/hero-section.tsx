import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Shield, Eye, MapPin, Users } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface HeroSectionProps {
  user: User | null
}

export function HeroSection({ user }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-primary/5 to-background py-20 md:py-32 rounded-b-3xl mb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
              Be Your Brother's Keeper.{' '}
              <span className="text-primary block mt-2">For a safer community</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-pretty">
              Empowering neighborhoods through crowdsourced reports, AI-driven insights, 
              and future autonomous drone surveillance to assist security agencies.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Link href="/reports/new">
                  Report Missing Person or Item
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                Connect XION Wallet
              </Button>
              {user ? null : (
                <>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/sign-up">
                      Join Community Watch
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/auth/login">
                      Sign in to Report
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] lg:aspect-square">
            <Image 
              src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=2670&auto=format&fit=crop"
              alt="Diverse community of dark-skinned people coming together"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* XION Blockchain Section - Prominent Display */}
        <div className="mt-12 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl p-8 border border-purple-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 rounded-full bg-purple-100 px-6 py-3 text-sm font-semibold text-purple-800 mb-4">
              <div className="h-3 w-3 rounded-full bg-purple-600 animate-pulse"></div>
              Powered by XION Blockchain
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Blockchain-Verified Community Safety
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Every report, sighting, and identity is secured on the XION blockchain. 
              Immutable verification, transparent governance, and decentralized trust 
              for community-powered safety networks.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/80 rounded-lg border border-purple-200">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-purple-900 mb-2">On-Chain Reports</h4>
              <p className="text-sm text-purple-700">
                All reports stored immutably on XION blockchain with cryptographic verification
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/80 rounded-lg border border-purple-200">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Decentralized Identity</h4>
              <p className="text-sm text-blue-700">
                User identities verified and secured through XION's decentralized identity system
              </p>
            </div>
            
            <div className="text-center p-6 bg-white/80 rounded-lg border border-purple-200">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-green-900 mb-2">Transparent Governance</h4>
              <p className="text-sm text-green-700">
                Community voting and governance powered by XION smart contracts
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>XION Network Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span>Smart Contracts Deployed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <span>Blockchain Verified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border bg-white/50 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Crowdsourced Alerts</h3>
            <p className="text-sm text-muted-foreground">
              Report and track incidents instantly with community-backed verified sightings.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border bg-white/50 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Live Incident Map</h3>
            <p className="text-sm text-muted-foreground">
              Visualize real-time safety patterns and active hotspots in your neighborhood.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border bg-white/50 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Guiding Eye Drones</h3>
            <p className="text-sm text-muted-foreground">
              Future integration: Deploying autonomous drones to scan locations for security agencies.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border bg-white/50 backdrop-blur-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">AI Camera Network</h3>
            <p className="text-sm text-muted-foreground">
              Connecting neighborhood AI security cameras to automatically flag suspicious activities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
