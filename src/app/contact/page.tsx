import type { Metadata } from "next";
import { siteConfig } from "@/data/site-config";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderTag } from "@/components/ui/primitives";
import { InstagramIcon, TikTokIcon } from "@/components/ui/SocialIcons";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with AURELLE — questions about your order, our products or delivery in Lebanon.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const { contact, social } = siteConfig;
  return (
    <>
      <PageHeader eyebrow="Contact" title="We'd Love to Hear From You" intro="Questions about your ritual, an order or delivery? Send us a note and we will reply as soon as we can." />
      <section className="py-16 md:py-24">
        <div className="container-site grid gap-16 md:grid-cols-12">
          <aside className="space-y-10 md:col-span-4">
            <div>
              <p className="eyebrow mb-3 flex items-center gap-2">
                Email {contact.isPlaceholder && <PlaceholderTag />}
              </p>
              <a href={`mailto:${contact.email}`} className="font-serif text-2xl hover:text-clay">
                {contact.email}
              </a>
            </div>
            {contact.phone && (
              <div>
                <p className="eyebrow mb-3">Phone / WhatsApp</p>
                <a href={`tel:${contact.phone}`} className="font-serif text-2xl hover:text-clay">
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.hours && (
              <div>
                <p className="eyebrow mb-3">Hours</p>
                <p className="text-stone">{contact.hours}</p>
              </div>
            )}
            <div>
              <p className="eyebrow mb-3">Follow</p>
              <div className="flex gap-5">
                <a href={social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-stone hover:text-ink">
                  <InstagramIcon className="h-4 w-4" /> Instagram
                </a>
                <a href={social.tiktok} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-stone hover:text-ink">
                  <TikTokIcon className="h-4 w-4" /> TikTok
                </a>
              </div>
            </div>
            <p className="text-sm text-stone">Serving customers across {siteConfig.market}.</p>
          </aside>
          <div className="md:col-span-7 md:col-start-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
