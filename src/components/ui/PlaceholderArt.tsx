import type { PlaceholderMotif } from "@/types/product";

/**
 * Art-directed stand-in for photography that has not been shot yet.
 * Deliberately illustrative (never photo-realistic) and always labelled, so it
 * cannot be mistaken for real product imagery.
 */

const INK = "#292824";
const LINE = { stroke: INK, strokeWidth: 1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, vectorEffect: "non-scaling-stroke" as const };

/** Eye mask silhouette in a 200×90 box, origin top-left. */
const MASK_PATH =
  "M8 44 C8 16 46 6 100 15 C154 6 192 16 192 44 C192 72 168 86 136 82 C118 80 110 64 100 64 C90 64 82 80 64 82 C32 86 8 72 8 44 Z";

function Mask({ x, y, scale = 1, fill = "#e9dcd3", stitch = true }: { x: number; y: number; scale?: number; fill?: string; stitch?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={MASK_PATH} fill={fill} {...LINE} style={{ fill }} />
      {stitch && (
        <path
          d={MASK_PATH}
          transform="translate(100 45) scale(0.9) translate(-100 -45)"
          {...LINE}
          strokeOpacity={0.35}
          strokeDasharray="2 4"
        />
      )}
    </g>
  );
}

function Wordmark({ x, y, size = 14, spacing = 6, sub }: { x: number; y: number; size?: number; spacing?: number; sub?: string }) {
  return (
    <g fill={INK} textAnchor="middle" style={{ fontFamily: "var(--font-serif)" }}>
      <text x={x} y={y} fontSize={size} letterSpacing={spacing}>
        AURELLE
      </text>
      {sub && (
        <text x={x} y={y + size * 1.4} fontSize={size * 0.38} letterSpacing={spacing * 0.5} fillOpacity={0.7} style={{ fontFamily: "var(--font-sans)" }}>
          {sub}
        </text>
      )}
    </g>
  );
}

const motifs: Record<PlaceholderMotif, React.ReactNode> = {
  portrait: (
    <g>
      <circle cx="318" cy="96" r="70" fill="#fff" fillOpacity="0.45" />
      <rect x="18" y="300" width="364" height="170" rx="85" fill="#efe8de" />
      {/* hair */}
      <path d="M112 236 C96 128 304 128 288 236 C300 280 318 300 352 318 M112 236 C100 280 82 300 48 318" {...LINE} strokeOpacity={0.55} />
      {/* face */}
      <ellipse cx="200" cy="232" rx="80" ry="100" fill="#f6efe7" {...LINE} style={{ fill: "#f6efe7" }} />
      <Mask x={112} y={178} scale={0.88} />
      {/* ear loops */}
      <path d="M118 205 C108 214 108 236 121 246 M282 205 C292 214 292 236 279 246" {...LINE} strokeOpacity={0.6} />
      <path d="M200 252 C196 268 194 274 205 277" {...LINE} strokeOpacity={0.7} />
      <path d="M184 300 C194 306 206 306 216 300 M186 300 C195 295 205 295 214 300" {...LINE} strokeOpacity={0.75} />
      <path d="M170 326 L168 360 C142 374 92 384 60 430 M230 326 L232 360 C258 374 308 384 340 430" {...LINE} strokeOpacity={0.55} />
    </g>
  ),
  mask: (
    <g>
      <circle cx="200" cy="250" r="150" fill="#fff" fillOpacity="0.35" />
      <ellipse cx="200" cy="356" rx="150" ry="10" fill={INK} fillOpacity="0.05" />
      <path d="M44 236 C10 236 10 286 44 288 M356 236 C390 236 390 286 356 288" {...LINE} strokeOpacity={0.6} />
      <Mask x={40} y={196} scale={1.6} />
      <text x="200" y="262" textAnchor="middle" fontSize="9" letterSpacing="4" fill={INK} fillOpacity="0.55" style={{ fontFamily: "var(--font-serif)" }}>
        AURELLE
      </text>
    </g>
  ),
  sachet: (
    <g>
      <ellipse cx="200" cy="408" rx="160" ry="12" fill={INK} fillOpacity="0.05" />
      <g transform="rotate(-9 150 250)">
        <rect x="60" y="120" width="170" height="250" fill="#ece3d8" {...LINE} style={{ fill: "#ece3d8" }} strokeOpacity={0.6} />
        <path d="M60 136 H230 M60 354 H230" {...LINE} strokeOpacity={0.3} strokeDasharray="3 3" />
      </g>
      <g transform="rotate(6 250 260)">
        <rect x="170" y="110" width="170" height="260" fill="#f7f2ea" {...LINE} style={{ fill: "#f7f2ea" }} />
        <path d="M170 128 H340 M170 352 H340" {...LINE} strokeOpacity={0.3} strokeDasharray="3 3" />
        <Mask x={205} y={190} scale={0.5} />
        <Wordmark x={255} y={290} size={15} spacing={5} sub="STEAM EYE MASK" />
      </g>
    </g>
  ),
  box: (
    <g>
      <ellipse cx="200" cy="404" rx="170" ry="14" fill={INK} fillOpacity="0.06" />
      {/* side + top faces for depth */}
      <path d="M290 150 L326 132 L326 380 L290 398 Z" fill="#ddd2c4" {...LINE} style={{ fill: "#ddd2c4" }} strokeOpacity={0.5} />
      <path d="M90 150 L126 132 L326 132 L290 150 Z" fill="#efe7dc" {...LINE} style={{ fill: "#efe7dc" }} strokeOpacity={0.5} />
      <rect x="90" y="150" width="200" height="248" fill="#f7f2ea" {...LINE} style={{ fill: "#f7f2ea" }} />
      <path d="M90 186 H290" {...LINE} strokeOpacity={0.25} />
      <Mask x={130} y={226} scale={0.6} />
      <Wordmark x={192} y={318} size={18} spacing={6} sub="STEAM EYE MASK" />
    </g>
  ),
  still: (
    <g>
      <path d="M110 420 V170 C110 100 290 100 290 170 V420" fill="#fff" fillOpacity="0.4" {...LINE} strokeOpacity={0.3} />
      <circle cx="200" cy="200" r="46" fill="#e9dcd3" fillOpacity="0.8" />
      <ellipse cx="200" cy="392" rx="140" ry="22" fill="#e4dcd0" {...LINE} style={{ fill: "#e4dcd0" }} strokeOpacity={0.5} />
      <g transform="rotate(-12 200 360)">
        <rect x="150" y="336" width="100" height="44" fill="#f7f2ea" {...LINE} style={{ fill: "#f7f2ea" }} />
        <text x="200" y="363" textAnchor="middle" fontSize="8" letterSpacing="3.5" fill={INK} style={{ fontFamily: "var(--font-serif)" }}>
          AURELLE
        </text>
      </g>
      <path d="M296 392 V318 C296 308 316 308 316 318 V392" fill="#f7f2ea" {...LINE} style={{ fill: "#f7f2ea" }} strokeOpacity={0.7} />
      <path d="M306 308 C302 298 310 292 306 284" {...LINE} strokeOpacity={0.4} />
    </g>
  ),
  steps: null,
};

const tones = {
  ivory: "linear-gradient(165deg, #f3eee6 0%, #e9e1d6 100%)",
  sand: "linear-gradient(165deg, #ece4d9 0%, #ddd2c3 100%)",
  rose: "linear-gradient(165deg, #f1e7e0 0%, #e3d5cb 100%)",
};

export type PlaceholderTone = keyof typeof tones;

interface Props {
  motif: PlaceholderMotif;
  brief: string;
  tone?: PlaceholderTone;
  /** Where the "placeholder" caption sits — use "top" when overlapping content covers the bottom. */
  captionPosition?: "top" | "bottom";
  /** Hide the caption on very small thumbnails. */
  compact?: boolean;
  className?: string;
}

export function PlaceholderArt({ motif, brief, tone = "ivory", compact = false, captionPosition = "bottom", className = "" }: Props) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} style={{ background: tones[tone] }}>
      <div className="grain absolute inset-0" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(120% 80% at 18% 8%, rgba(255,255,255,.55), transparent 55%)" }}
      />
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        {motifs[motif]}
      </svg>
      {!compact && (
        <p className={`absolute inset-x-4 ${captionPosition === "top" ? "top-4" : "bottom-4"} flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[10px] leading-snug tracking-[0.08em] text-stone`}>
          <span className="border border-stone/40 px-1.5 py-0.5 font-medium uppercase tracking-[0.18em]">
            Photography placeholder
          </span>
          <span className="max-w-[46ch]">{brief}</span>
        </p>
      )}
    </div>
  );
}
