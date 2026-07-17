import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Server Components can't write cookies, so requireRecruiter() can't call
// supabase.auth.signOut() directly when it needs to force a logout (e.g. an
// account with no recoverable recruiter row). Route Handlers can, so it
// redirects here instead.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(`${origin}${next}`);
}
