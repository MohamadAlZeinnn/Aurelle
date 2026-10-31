import Link from "next/link";
import { SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";

const line = { stroke: "#241c1f", strokeWidth: 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const MASK = "M8 44 C8 16 46 6 100 15 C154 6 192 16 192 44 C192 72 168 86 136 82 C118 80 110 64 100 64 C90 64 82 80 64 82 C32 86 8 72 8 44 Z";

// Simple line illustrations — no usage details are implied beyond the step titles.
const illustrations = [
  <svg key="unwrap" viewBox="0 0 200 200" className="h-full w-full" fill="none" aria-hidden>
    <circle cx="100" cy="100" r="82" fill="#eee5dc" />
    <g transform="rotate(-8 100 110)">
      <rect x="58" y="70" width="84" height="96" fill="#f5efe6" {...line} />
      <path d="M58 70 L68 52 H132 L142 70" {...line} strokeDasharray="3 3" />
      <text x="100" y="125" textAnchor="middle" fontSize="8" letterSpacing="3" fill="#241c1f" style={{ fontFamily: "var(--font-serif)" }}>
        AURELLE
      </text>
    </g>
  </svg>,
  <svg key="wear" viewBox="0 0 200 200" className="h-full w-full" fill="none" aria-hidden>
    <circle cx="100" cy="100" r="82" fill="#eee5dc" />
    <ellipse cx="100" cy="108" rx="44" ry="56" fill="#f5efe6" {...line} />
    <g transform="translate(54 72) scale(0.46)">
      <path d={MASK} fill="#e4d4c8" {...line} strokeWidth={2.2} />
    </g>
    <path d="M90 140 C96 144 104 144 110 140" {...line} opacity="0.6" />
  </svg>,
  <svg key="unwind" viewBox="0 0 200 200" className="h-full w-full" fill="none" aria-hidden>
    <circle cx="100" cy="100" r="82" fill="#eee5dc" />
    <path d="M114 58a42 42 0 1 0 26 62A36 36 0 0 1 114 58Z" fill="#f5efe6" {...line} />
    <path d="M60 150c-4-6 4-9 0-15M72 152c-4-6 4-9 0-15" {...line} opacity="0.5" />
  </svg>,
];

const steps = [
  { title: "Unwrap", text: "Open the individual packaging according to the manufacturer's instructions." },
  { title: "Wear", text: "Position the mask comfortably over your eyes, following its instructions." },
  { title: "Unwind", text: "Enjoy the warmth for the manufacturer's recommended duration." },
];

const numerals = ["I", "II", "III"];

export function HowToUse() {
  return (
    <section aria-labelledby="how-title" className="py-[var(--spacing-section)]">
      <div className="container-site">
        <Reveal>
          <SectionHeading eyebrow="How to Use" title={<span id="how-title">Your Ritual, In Three Simple Steps</span>} />
        </Reveal>
        <ol className="mt-16 grid gap-16 md:mt-24 md:grid-cols-3 md:gap-10 lg:gap-16">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.15} className="text-center">
                <div className="mx-auto aspect-square w-44 md:w-52">{illustrations[i]}</div>
                <p className="mt-8 font-serif text-lg italic text-clay">Step {numerals[i]}</p>
                <h3 className="mt-2 font-serif text-3xl">{s.title}</h3>
                <p className="mx-auto mt-4 max-w-[19rem] text-[0.95rem] leading-relaxed text-stone">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        <Reveal className="mt-16 text-center">
          <p className="text-sm text-stone">
            Always read and follow the instructions and safety information on the packaging.{" "}
            <Link href="/shop/steam-eye-mask#details" className="text-ink underline underline-offset-4">
              Product details
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
