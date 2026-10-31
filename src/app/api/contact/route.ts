import { NextResponse } from "next/server";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { insertRow, isStoreConfigured } from "@/lib/server/store";

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", fields: fieldErrors(parsed.error) }, { status: 422 });
  }

  if (!isStoreConfigured()) {
    return NextResponse.json({ mode: "demo" });
  }

  try {
    await insertRow("contact_messages", { ...parsed.data, subject: parsed.data.subject || null });
    return NextResponse.json({ mode: "live" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 502 });
  }
}
