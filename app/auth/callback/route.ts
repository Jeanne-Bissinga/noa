import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // If signup required email confirmation, the company/recruiter rows
      // were never created (the RPC needs auth.uid(), which didn't exist
      // yet at signup time). Create them now from the metadata stashed on
      // the auth user during signup, so the recruiter row always exists by
      // the time the user lands on a protected page.
      if (user) {
        const { data: existingRecruiter } = await supabase
          .from('recruiters')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existingRecruiter) {
          const metadata = user.user_metadata ?? {}
          if (metadata.company_name && metadata.first_name && metadata.last_name) {
            await supabase.rpc('create_company_and_recruiter', {
              p_company_name: metadata.company_name,
              p_siret: metadata.siret ?? null,
              p_sector: null,
              p_team_size: metadata.team_size ?? null,
              p_main_objective: metadata.main_objective ?? null,
              p_first_name: metadata.first_name,
              p_last_name: metadata.last_name,
              p_email: user.email ?? '',
              p_job_title: metadata.job_title ?? null,
            })
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
