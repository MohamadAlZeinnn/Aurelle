import { NextResponse } from "next/server";
import { fieldErrors, newsletterSchema } from "@/lib/validation";
import { insertRow, isStoreConfigured } from "@/lib/server/store";

export async function POST(request: Request) {
  const parsed = newsletterSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", fields: fieldErrors(parsed.error) }, { status: 422 });
  }

  if (!isStoreConfigured()) {
    return NextResponse.json({ mode: "demo" });
  }

  try {
    await insertRow(
      "newsletter_subscribers",
      { email: parsed.data.email, consent_at: new Date().toISOString(), source: "website" },
      { ignoreDuplicates: true },
    );
    return NextResponse.json({ mode: "live" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 });
  }
}
