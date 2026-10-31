import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const icons = {
  warmth: (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      <path {...stroke} d="M16 36c-3-4 3-6 0-10s3-6 0-10M24 36c-3-4 3-6 0-10s3-6 0-10M32 36c-3-4 3-6 0-10s3-6 0-10" />
      <path {...stroke} d="M10 40h28" opacity="0.5" />
    </svg>
  ),
  unwind: (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      <path {...stroke} d="M30 9a15 15 0 1 0 9 22A13 13 0 0 1 30 9Z" />
      <circle cx="36" cy="13" r="0.8" fill="currentColor" />
    </svg>
  ),
  effortless: (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      <circle {...stroke} cx="24" cy="24" r="14" />
      <path {...stroke} d="M17 25c3 3 11 3 14 0" />
    </svg>
  ),
  ritual: (
    <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden>
      <rect {...stroke} x="18" y="20" width="12" height="20" />
      <path {...stroke} d="M24 20v-3M24 14c-2-2-1-5 0-6 1 1 2 4 0 6Z" />
      <path {...stroke} d="M12 40h24" opacity="0.5" />
    </svg>
  ),
};

const benefits = [
  { icon: icons.warmth, title: "Gentle Warmth", text: "Experience a comforting warmth around the eye area." },
  { icon: icons.unwind, title: "A Moment to Unwind", text: "Create a peaceful pause during your day or evening." },
  {
    icon: icons.effortless,
    title: "Effortless Self-Care",
    text: "No complicated routine. Simply open, wear, and relax, following the product instructions.",
  },
  { icon: icons.ritual, title: "Your Personal Ritual", text: "Perfect for incorporating a little more relaxation into your daily routine." },
];

export function Benefits() {
  return (
    <section aria-labelledby="benefits-title" className="theme-dark py-[var(--spacing-section)]">
      <div className="container-site">
        <Reveal>
          <SectionHeading eyebrow="Why AURELLE" title={<span id="benefits-title">Small Ritual. Softer Moments.</span>} />
        </Reveal>
        <ul className="mt-16 grid gap-px bg-ink/10 sm:grid-cols-2 md:mt-24 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <li key={b.title} className="bg-linen">
              <Reveal delay={i * 0.12} className="flex h-full flex-col px-2 py-10 sm:px-8 lg:py-14">
                <div className="flex items-start justify-between text-clay">
                  {b.icon}
                  <span className="font-serif text-sm text-stone italic">0{i + 1}</span>
                </div>
                <h3 className="mt-10 font-serif text-[1.75rem] leading-tight">{b.title}</h3>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-stone">{b.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
