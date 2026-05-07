import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    // Instantiate redirect response first so we can attach session cookies to it
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Set cookies in cookie store
                cookieStore.set(name, value, options)
                // Set cookies on the redirect response itself to ensure they persist
                response.cookies.set(name, value, options)
              })
            } catch (err) {
              console.error('[Auth Callback] setAll cookie error:', err)
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }

    console.error('[Auth Callback] exchangeCodeForSession error:', error.message)
  }

  // Redirect to an error state so the user knows something went wrong
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not authenticate user')}`
  )
}
