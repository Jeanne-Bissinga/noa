import { NextResponse } from "next/server";
import { getCurrentRecruiter } from "@/lib/noa/queries";

export async function GET() {
  const recruiter = await getCurrentRecruiter();
  if (!recruiter) {
    return NextResponse.json({ firstName: null, lastName: null, jobTitle: null }, { status: 200 });
  }
  return NextResponse.json({
    firstName: recruiter.first_name,
    lastName: recruiter.last_name,
    jobTitle: recruiter.job_title,
  });
}
