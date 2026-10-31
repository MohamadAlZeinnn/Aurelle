import { z } from "zod";

const email = () => z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address."));

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `Please enter your ${label}.`).max(max, `Your ${label} is too long.`);

export const newsletterSchema = z.object({
  email: email(),
  consent: z.literal(true, "Please confirm you would like to receive our emails."),
});

export const contactSchema = z.object({
  name: requiredText("name", 100),
  email: email(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(3000),
});

/** Flattens zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
