import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}