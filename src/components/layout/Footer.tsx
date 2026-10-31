import Link from "next/link";
import { navigation, siteConfig } from "@/data/site-config";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { generalEnquiryUrl } from "@/lib/whatsapp";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="theme-dark !bg-plum-deep">
      <div className="container-site pt-20 pb-10 md:pt-28">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="wordmark text-4xl md:text-5xl" aria-label="AURELLE — home">
              Aurelle
            </Link>
            <p className="mt-5 font-serif text-2xl italic text-stone">{siteConfig.tagline}</p>
            <p className="mt-8 flex items-center gap-3 text-xs tracking-[0.18em] text-stone uppercase">
              <span className="h-px w-8 bg-taupe" aria-hidden />
              Now delivering across {siteConfig.market}
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <p className="eyebrow mb-6">Explore</p>
            <ul className="space-y-3 text-[0.95rem]">
              {navigation.footer.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Policies" className="md:col-span-2">
            <p className="eyebrow mb-6">Policies</p>
            <ul className="space-y-3 text-[0.95rem]">
              {navigation.policies.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-stone transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="eyebrow mb-6">Connect</p>
            <ul className="space-y-3 text-[0.95rem]">
              <li>
                <a href={generalEnquiryUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-stone hover:text-ink">
                  <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a href={siteConfig.social.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-stone hover:text-ink">
                  <InstagramIcon className="h-4 w-4" /> Instagram
                </a>
              </li>
              <li>
                <a href={siteConfig.social.tiktok} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-stone hover:text-ink">
                  <TikTokIcon className="h-4 w-4" /> TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-3 border-t border-ink/10 pt-8 text-xs text-stone md:flex-row md:items-center md:justify-between">
          <p>© {year} AURELLE. All rights reserved.</p>
          <p className="tracking-[0.14em] uppercase">Market · {siteConfig.market} · Prices in USD</p>
        </div>
      </div>
    </footer>
  );
}
