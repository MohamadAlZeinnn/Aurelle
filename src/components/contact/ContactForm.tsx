"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { contactSchema, fieldErrors } from "@/lib/validation";

type Status = "idle" | "sending" | "sent" | "demo" | "error";

export function ContactForm() {
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.fields ?? {});
        setServerError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus(data.mode === "demo" ? "demo" : "sent");
    } catch {
      setServerError("We couldn't reach the server. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent" || status === "demo") {
    return (
      <div role="status" className="border border-ink/10 bg-linen p-10">
        <p className="font-serif text-3xl">Thank you for writing to us.</p>
        {status === "sent" ? (
          <p className="mt-4 text-stone">We have received your message and will be in touch soon.</p>
        ) : (
          <p className="mt-4 text-xs tracking-[0.14em] text-stone uppercase">
            Demo mode · Message storage is not configured, so this message was not sent.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 sm:grid-cols-2">
      <Field label="Name" error={errors.name}>
        {(p) => <input {...p} className="field-input" autoComplete="name" value={values.name} onChange={set("name")} />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(p) => <input {...p} type="email" inputMode="email" className="field-input" autoComplete="email" value={values.email} onChange={set("email")} />}
      </Field>
      <Field label="Subject" optional error={errors.subject} className="sm:col-span-2">
        {(p) => <input {...p} className="field-input" value={values.subject} onChange={set("subject")} />}
      </Field>
      <Field label="Message" error={errors.message} className="sm:col-span-2">
        {(p) => <textarea {...p} rows={6} className="field-input" value={values.message} onChange={set("message")} />}
      </Field>
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send Message"}
        </button>
        {status === "error" && serverError && (
          <p role="alert" className="mt-4 text-sm text-error">
            {serverError}
          </p>
        )}
      </div>
    </form>
  );
}
