import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Eye, MapPin, Users } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

interface HeroSectionProps {
  user: User | null
}

export function HeroSection({ user }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Shield className="h-4 w-4" />
            Community-powered safety network
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
            Help Find Missing{' '}
            <span className="text-primary">Children & Items</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Report missing persons, vehicles, or property. Share sightings with your community.
            Together, we can help bring them home safely.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {user ? (
              <Button asChild size="lg">
                <Link href="/reports/new">
                  Report Missing Person or Item
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
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

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Report Sightings</h3>
            <p className="text-sm text-muted-foreground">
              Seen something? Report it instantly with location and photos
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Track on Map</h3>
            <p className="text-sm text-muted-foreground">
              View all reports and sightings on an interactive community map
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Community Network</h3>
            <p className="text-sm text-muted-foreground">
              {"Join neighbors keeping watch and helping each other stay safe"}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
