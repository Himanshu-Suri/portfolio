"use client";

import dynamic from "next/dynamic";
import {
  Children,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBriefcase,
  IconCode,
  IconHome,
  IconMail,
  IconSchool,
  IconSearch,
  IconTrophy,
  IconX,
} from "@tabler/icons-react";
import { AsciiScene } from "@/components/ascii-scene";
import { FloatingDock } from "@/components/ui/floating-dock";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import {
  awards,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/lib/data";

// Both load in their own chunks, after the page itself, so they don't
// slow down the first paint.
const IntroTerminal = dynamic(
  () => import("@/components/ui/terminal").then((m) => m.Terminal),
  { ssr: false },
);
const CloudShader = dynamic(
  () => import("@/components/ui/cloud-shader").then((m) => m.CloudShader),
  { ssr: false },
);

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => window.matchMedia(MOTION_QUERY).matches;

// ---------------------------------------------------------------------------
// Intro splash. Plays on every load and reload; click Skip (or anywhere) to
// dismiss early. Skipped for people who prefer reduced motion. Calls
// onReveal as soon as it starts fading, so the page behind can start up.
function Splash({ onReveal }: { onReveal: () => void }) {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    if (prefersReducedMotion()) setPhase("gone");
  }, []);

  useEffect(() => {
    if (phase !== "show") onReveal();
  }, [phase, onReveal]);

  useEffect(() => {
    document.body.style.overflow = phase === "gone" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "show") return;
    const t = setTimeout(() => setPhase("fade"), 4500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "fade") return;
    const t = setTimeout(() => setPhase("gone"), 600);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      onClick={() => setPhase("fade")}
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black px-4 transition-opacity duration-500 ${
        phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <IntroTerminal
        username="himanshu"
        className="w-full max-w-2xl"
        commands={["whoami", "cat focus.txt", "./launch portfolio"]}
        outputs={{
          0: ["himanshu-suri"],
          1: [
            "LLM quantization and efficient inference",
            "RF signal classification with CNNs",
            "Full-stack: MERN, Next.js",
          ],
          2: ["Loading portfolio...", "Ready."],
        }}
        typingSpeed={25}
        delayBetweenCommands={350}
        initialDelay={200}
        enableSound={false}
      />
      <button
        type="button"
        onClick={() => setPhase("fade")}
        className="absolute bottom-8 right-8 rounded-full border border-white/20 px-4 py-1.5 text-sm text-neutral-300 transition hover:bg-white/10 hover:text-white"
      >
        Skip
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Classified internship card.

// Letters and digits only. Symbols like / | \ % $ are line-break
// opportunities, so flickering them in and out makes the text rewrap and
// the cards change height (most visible on narrow mobile screens).
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Only letters and digits get scrambled. Spaces, hyphens and punctuation
// stay where they are, so the places a line can break never move.
const isCipherable = (ch: string) => /[A-Za-z0-9]/.test(ch);

// Each line mixes numbers (that many characters of permanently scrambled
// filler) with strings (buzzwords that decrypt and stay readable). No real
// details are stored in here, so nothing confidential ends up in the
// page's JavaScript bundle.
const CLASSIFIED_DOC: (string | number)[][] = [
  [12, "LLM QUANTIZATION", 20],
  [46],
  [7, "WEIGHT-ACTIVATION", 9, "MIXED PRECISION"],
  [19, "HADAMARD ROTATIONS", 11],
  [5, "CALIBRATION", 16, "ERROR ANALYSIS", 3],
  [33],
  [14, "INTEGER-ONLY INFERENCE", 12],
  [9, "TILE-BASED QUANTIZATION", 15],
  [22, "LOW-BIT INFERENCE", 8],
  [38],
];

// The only words that are ever shown in the clear (also used by search).
const CLASSIFIED_KEYWORDS = CLASSIFIED_DOC.flat().filter(
  (seg): seg is string => typeof seg === "string",
);

// Every segment in one flat list, so each maps to one span on the page.
const SEGMENTS = CLASSIFIED_DOC.flatMap((line, li) =>
  line.map((seg, si) => ({ seg, li, si })),
);
const LINE_START = CLASSIFIED_DOC.map((_, li) =>
  CLASSIFIED_DOC.slice(0, li).reduce((n, line) => n + line.length, 0),
);

const randomChar = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const block = () => "█";

// Filler has a space at fixed positions so it looks like words but never
// rewraps while it flickers.
const filler = (length: number, char: () => string) =>
  Array.from({ length }, (_, i) => (i % 6 === 5 ? " " : char())).join("");

const placeholder = (seg: string | number) =>
  filler(typeof seg === "number" ? seg : seg.length, block);

// The text of every segment, `elapsed` ms after the card came into view.
const cipherFrame = (elapsed: number) =>
  SEGMENTS.map(({ seg, li, si }) => {
    if (typeof seg === "number") return filler(seg, randomChar);
    const shown = Math.floor((elapsed - (li * 220 + si * 120)) / 35);
    if (shown >= seg.length) return seg;
    return Array.from(seg, (ch, ci) =>
      ci < shown || !isCipherable(ch) ? ch : randomChar(),
    ).join("");
  });

// Static version for reduced motion: redaction bars plus buzzwords.
const calmFrame = () =>
  SEGMENTS.map(({ seg }) =>
    typeof seg === "number" ? filler(seg, block) : seg,
  );

function ClassifiedDoc() {
  const ref = useRef<HTMLDivElement>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Write straight into the spans instead of going through React state,
    // so the animation never re-renders the component.
    const paint = (frame: string[]) =>
      frame.forEach((text, k) => {
        const span = spans.current[k];
        if (span && span.textContent !== text) span.textContent = text;
      });

    if (prefersReducedMotion()) {
      paint(calmFrame());
      return;
    }

    let start: number | null = null;
    let last = 0;
    let raf = 0;

    // requestAnimationFrame also pauses by itself in background tabs.
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < 70) return;
      last = now;
      start ??= now;
      paint(cipherFrame(now - start));
    };

    // Only animate while the card is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="mt-5 rounded-xl border border-white/10 bg-black/60 p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-mono text-xs tracking-widest text-neutral-400">
          CLASSIFIED // RESEARCH LOG
        </span>
        <span className="animate-pulse text-xs text-red-400">
          ● RESTRICTED
        </span>
      </div>

      <div
        aria-hidden="true"
        className="select-none space-y-1 whitespace-pre-wrap break-words font-mono text-sm leading-7"
      >
        {CLASSIFIED_DOC.map((line, li) => (
          <p key={li}>
            {line.map((seg, si) => {
              const k = LINE_START[li] + si;
              return (
                <span key={si}>
                  {si > 0 && " "}
                  <span
                    ref={(node) => {
                      spans.current[k] = node;
                    }}
                    className={
                      typeof seg === "number"
                        ? "text-neutral-700"
                        : "rounded bg-white/10 px-1 font-semibold text-white"
                    }
                  >
                    {placeholder(seg)}
                  </span>
                </span>
              );
            })}
          </p>
        ))}
      </div>

      <p className="sr-only">
        Details of this internship are confidential. Areas of work:{" "}
        {CLASSIFIED_KEYWORDS.join(", ").toLowerCase()}.
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-xs text-neutral-500">DATA REDACTED</span>
        <span className="font-mono text-xs text-neutral-600">
          ENCRYPTION ACTIVE
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search. The data never changes, so each entry's searchable text is built
// once when the page loads instead of on every keystroke.

const isClassifiedExperience = (entry: (typeof experience)[number]) =>
  "classified" in entry && entry.classified === true;

const haystack = (...parts: (string | string[] | undefined)[]) =>
  parts
    .flat()
    .filter((p): p is string => typeof p === "string")
    .join(" ")
    .toLowerCase();

const ALL = { experience, projects, education, skills, awards };

const SEARCH_INDEX = {
  experience: experience.map((e) => ({
    item: e,
    text: isClassifiedExperience(e)
      ? // Only the visible buzzwords are searchable, never the org.
        haystack(e.role, e.period, CLASSIFIED_KEYWORDS)
      : haystack(
          e.period,
          e.place,
          e.role,
          e.org,
          e.project,
          e.summary,
          e.points,
          e.tags,
        ),
  })),
  projects: projects.map((p) => ({
    item: p,
    text: haystack(p.title, p.tags, p.points, p.period),
  })),
  education: education.map((e) => ({
    item: e,
    text: haystack(e.school, e.detail, e.score, e.extra, e.period),
  })),
  skills: skills.map((s) => ({ item: s, text: haystack(s.group, s.items) })),
  awards: awards.map((a) => ({ item: a, text: haystack(a.title, a.note) })),
};

function searchIn<T>(list: { item: T; text: string }[], q: string) {
  return list.filter((entry) => entry.text.includes(q)).map((e) => e.item);
}

// ---------------------------------------------------------------------------
// Layout pieces.

const display = "font-[family-name:var(--font-grotesk)]";

const CARD =
  "relative h-full w-full rounded-[1.75rem] border border-white/10 bg-[#07081a]/75 p-6 md:p-8";

// Phones and tablets can't hover, so the tilt never shows there. They get
// a plain card instead, which skips the 3D layers and mouse tracking.
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";
const subscribeHover = (cb: () => void) => {
  const mq = window.matchMedia(HOVER_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useCanHover = () =>
  useSyncExternalStore(
    subscribeHover,
    () => window.matchMedia(HOVER_QUERY).matches,
    () => false,
  );

// A 3D tilt card. Each direct child floats a little higher than the one
// before it, so titles, text and tags separate as you hover.
function TiltCard({ children }: { children: ReactNode }) {
  const canHover = useCanHover();

  if (!canHover) return <div className={CARD}>{children}</div>;

  return (
    <CardContainer containerClassName="h-full w-full py-0" className="h-full w-full">
      <CardBody
        className={`${CARD} transition-shadow duration-200 hover:shadow-2xl hover:shadow-indigo-500/20`}
      >
        {Children.toArray(children).map((part, i) => (
          <CardItem key={i} translateZ={20 + i * 15} className="w-full">
            {part}
          </CardItem>
        ))}
      </CardBody>
    </CardContainer>
  );
}

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2
      id={id}
      className={`${display} mb-8 scroll-mt-24 text-3xl font-semibold tracking-tight text-white md:text-4xl`}
    >
      {children}
    </h2>
  );
}

function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-sm font-medium text-neutral-100">
      {children}
    </span>
  );
}

// The colour the hero fades into and the rest of the page starts from.
const SKY = "13,14,38"; // #0d0e26, same as the shader's skyBottomColor

// All the hero's light and shade in one layer, painted once. The first
// gradient in the list is drawn on top.
const HERO_LIGHT: CSSProperties = {
  backgroundImage: [
    // On top of everything: the bottom eases into the plain sky colour so
    // it meets the rest of the page with no visible edge. The uneven
    // steps make an ease-in curve instead of a straight ramp.
    `linear-gradient(to bottom, rgba(${SKY},0) 50%, rgba(${SKY},0.04) 58%, rgba(${SKY},0.12) 65%, rgba(${SKY},0.26) 72%, rgba(${SKY},0.45) 79%, rgba(${SKY},0.66) 86%, rgba(${SKY},0.84) 93%, rgb(${SKY}) 100%)`,
    // Moonlight behind the clouds, top right
    "radial-gradient(circle at 80% 18%, rgba(199,210,254,0.2), transparent 32%)",
    // Faint indigo glow low on the right
    "radial-gradient(ellipse at 65% 85%, rgba(99,102,241,0.12), transparent 50%)",
    // Keep the left side, where the text sits, a touch darker
    "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 50%, transparent)",
    // A little darker at the very top
    "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent 45%)",
  ].join(", "),
};

// The rest of the page continues the night sky from where the hero ends,
// slowly getting darker towards the bottom, with two faint glows on the way.
// Both glows sit well below the top edge, so the colour where the page
// meets the hero is the same flat sky colour all the way across.
const PAGE_SKY: CSSProperties = {
  backgroundImage: [
    "radial-gradient(ellipse 70% 14% at 85% 35%, rgba(99,102,241,0.08), transparent)",
    "radial-gradient(ellipse 60% 14% at 10% 65%, rgba(129,140,248,0.06), transparent)",
    "linear-gradient(to bottom, #0d0e26 0%, #0a0b1f 35%, #07071a 70%, #050509 100%)",
  ].join(", "),
};

// ---------------------------------------------------------------------------
// A little silhouette of me (with glasses) working on a laptop with an SDR, sitting on the S of my
// last name with legs hanging over the front of the letter.

const NAME_WORDS = profile.name.split(" ");
const LAST_NAME = NAME_WORDS.at(-1) ?? "";
const FIRST_NAMES = NAME_WORDS.slice(0, -1).join(" ");

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () =>
  useSyncExternalStore(subscribeMotion, prefersReducedMotion, () => false);

// One lower leg, swinging slowly from the knee.
function Leg({
  d,
  knee,
  begin,
  swing,
}: {
  d: string;
  knee: string;
  begin: string;
  swing: boolean;
}) {
  return (
    <path d={d}>
      {swing && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={`0 ${knee};-8 ${knee};0 ${knee};3 ${knee};0 ${knee}`}
          keyTimes="0;0.3;0.55;0.8;1"
          dur="3.4s"
          begin={begin}
          repeatCount="indefinite"
        />
      )}
    </path>
  );
}

// The arm is jointed: the upper arm turns at the shoulder and the forearm
// turns at the elbow. A wave eases the arm up off the keyboard, waves the
// forearm a couple of times, then eases it back down onto the keys.
const SHOULDER = "40.5 49.5";
const ELBOW = "49 61";
const WAVE_MS = 2600;
const WAVE_TIMES = "0;0.18;0.32;0.46;0.6;0.72;1";
// Gentle ease-out going up, smooth back-and-forth, gentle ease-in-out down.
const WAVE_SPLINES = [
  "0.3 0 0.2 1",
  "0.45 0 0.55 1",
  "0.45 0 0.55 1",
  "0.45 0 0.55 1",
  "0.45 0 0.55 1",
  "0.4 0 0.3 1",
].join(";");
const rotations = (angles: number[], centre: string) =>
  angles.map((a) => `${a} ${centre}`).join(";");
const SHOULDER_ANGLES = rotations([0, -74, -74, -74, -74, -74, 0], SHOULDER);
const ELBOW_ANGLES = rotations([0, -26, -40, -12, -40, -26, 0], ELBOW);

// Every arm animation (in both the outline and the filled copy) is marked
// with data-wave and started from code at the same moment, so the copies
// always move together.
function Arm({ wave }: { wave: boolean }) {
  const timing = {
    attributeName: "transform",
    type: "rotate",
    dur: `${WAVE_MS}ms`,
    keyTimes: WAVE_TIMES,
    keySplines: WAVE_SPLINES,
    calcMode: "spline",
    fill: "remove",
    restart: "whenNotActive",
    begin: "indefinite",
    "data-wave": "",
  } as const;

  return (
    <g>
      {wave && (
        <animateTransform {...timing} values={SHOULDER_ANGLES} />
      )}
      {/* Upper arm and elbow */}
      <path d="M37.8 51.6 Q42 58 46.8 63 L51.2 59.4 Q46.4 54.4 43.2 47.6 Z" />
      <circle cx="49" cy="61" r="2.8" />
      <g>
        {wave && (
          <animateTransform {...timing} values={ELBOW_ANGLES} />
        )}
        {/* Forearm and hand */}
        <path d="M47.6 63.4 L61.2 70.4 L63.2 66.8 L50.2 58.8 Z" />
        <path d="M60.4 66.2 Q64.6 65.4 65 67.8 Q65 70.6 61.6 70.8 Z" />
      </g>
    </g>
  );
}

// The whole figure as one shape. It's drawn twice: once as a wide outline
// and once filled on top, so only the outer edge shows.
const figureBody = (swing: boolean, wave: boolean) => (
  <>
    <path d="M30 79 Q28.5 61 33 49 Q37 42 43 42 Q50 44 51 55 L50 79 Z" />
    <path d="M40 36 L46 36 L46 44 L40 44 Z" />
    <circle cx="43.5" cy="30" r="7.6" />
    <path d="M35.6 31.5 Q34.6 26 36.5 23.6 Q36 21.4 39 21.6 Q41 19.6 44.5 20.6 Q47.5 19.8 49 22.4 Q51.6 24 50.8 27.6 Q47 25.6 42.5 27 Q39.4 28 38.8 33 Z" />
    <path d="M31 71.5 L62 71.5 Q67 71.5 67 76 L67 80 L31 80 Z" />
    <Leg
      d="M54 77 Q55.5 92 57 104.5 L63.5 104.5 Q66.5 107.5 63 109 L53.8 109 Q52 92 49 78 Z"
      knee="51.5 78"
      begin="-1.7s"
      swing={swing}
    />
    <Leg
      d="M60.5 76 Q61.5 94 62.5 108.5 L70.5 108.5 Q74 111.5 70 113.5 L57.5 113.5 Q56.5 95 54.5 78 Z"
      knee="58 77"
      begin="0s"
      swing={swing}
    />
    <Arm wave={wave} />
  </>
);

// A faint ring rippling off the antenna tip, then a pause.
function Ripple({ begin }: { begin: string }) {
  return (
    <circle
      cx="81.7"
      cy="53.2"
      r="1"
      fill="none"
      stroke="#a5b4fc"
      strokeWidth="0.5"
      strokeOpacity="0"
    >
      <animate
        attributeName="r"
        values="1;8;8"
        keyTimes="0;0.45;1"
        dur="3.6s"
        begin={begin}
        repeatCount="indefinite"
      />
      <animate
        attributeName="stroke-opacity"
        values="0.7;0;0"
        keyTimes="0;0.45;1"
        dur="3.6s"
        begin={begin}
        repeatCount="indefinite"
      />
    </circle>
  );
}

// Sizes are in em, so the figure scales with the headline. The drawing is
// 56 x 100 units at 0.008em per unit; the seat is 0.288em above the
// drawing's bottom edge and lines up with the top of the capital S (1cap).
// To nudge it: change `left` to move sideways, or the 0.288em to move up/down.
//
// Hover near him (desktop) or tap him (phones) and he waves.
function PerchedMe() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glowId = `me-glow-${uid}`;
  const motion = !useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const busy = useRef<number | undefined>(undefined);

  // Start one wave; ignore new triggers until it has finished.
  const startWave = () => {
    if (!motion || busy.current !== undefined) return;
    svgRef.current
      ?.querySelectorAll<SVGAnimationElement>("[data-wave]")
      .forEach((anim) => anim.beginElement());
    busy.current = window.setTimeout(() => {
      busy.current = undefined;
    }, WAVE_MS);
  };

  useEffect(() => () => window.clearTimeout(busy.current), []);

  return (
    <svg
      ref={svgRef}
      viewBox="26 16 56 100"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute left-[0.17em] h-[0.8em] w-[0.448em] overflow-visible bottom-[calc(0.7em-0.288em)] [@supports(top:1cap)]:bottom-[calc(1cap-0.288em)]"
    >
      <defs>
        <radialGradient id={glowId} cx="60" cy="56" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Light from the laptop screen */}
      <circle cx="60" cy="56" r="22" fill={`url(#${glowId})`} />
      <g
        fill="none"
        stroke="#a5b4fc"
        strokeOpacity="0.45"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        {figureBody(motion, motion)}
      </g>
      <g fill="#05050f">{figureBody(motion, motion)}</g>
      {/* Glasses: the arm back to the ear, and a lens lit by the screen */}
      <path
        d="M43.8 28.9 L50.2 28.6"
        fill="none"
        stroke="#c7d2fe"
        strokeOpacity="0.75"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      <rect
        x="49.6"
        y="27.1"
        width="3.4"
        height="3.4"
        rx="1.1"
        fill="#a5b4fc"
        fillOpacity="0.35"
        stroke="#e0e7ff"
        strokeWidth="0.7"
      />
      <path
        d="M51.2 27.9 L52.1 27.9"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      {/* Laptop */}
      <path
        d="M51 69.2 L78 69.2 L78 71.8 L51 71.8 Z"
        fill="#05050f"
        stroke="#a5b4fc"
        strokeOpacity="0.6"
        strokeWidth="0.6"
      />
      <path
        d="M75.6 70 L69.8 48.6 L72.2 48 L78 69.6 Z"
        fill="#05050f"
        stroke="#c7d2fe"
        strokeOpacity="0.8"
        strokeWidth="0.6"
      />
      {/* SDR dongle in the side of the laptop, with its antenna */}
      <path
        d="M80.6 69.6 L81.7 53.2"
        stroke="#c7d2fe"
        strokeOpacity="0.75"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <rect
        x="77.8"
        y="69.4"
        width="3.8"
        height="2"
        rx="0.5"
        fill="#05050f"
        stroke="#a5b4fc"
        strokeOpacity="0.7"
        strokeWidth="0.5"
      />
      <circle cx="81.7" cy="53.2" r="0.9" fill="#e0e7ff" />
      {motion && (
        <>
          <Ripple begin="0s" />
          <Ripple begin="0.45s" />
        </>
      )}
      {/* Invisible area around him that listens for hover and taps */}
      <rect
        x="24"
        y="14"
        width="64"
        height="102"
        fill="transparent"
        pointerEvents="all"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") startWave();
        }}
        onClick={startWave}
      />
    </svg>
  );
}

const ICON = "h-full w-full text-neutral-300 transition-colors";

// The dock component ships light grey circles and labels, and only switches
// to dark ones when the visitor's OS is in dark mode. These override its
// colours from the outside so it always matches the night sky.
const DOCK_THEME = [
  // Icon circles: a faint lighter navy, brighter on hover
  "[&_.bg-gray-200]:bg-white/[0.07]",
  "[&_a:hover_.bg-gray-200]:bg-white/15",
  "[&_a:hover_svg]:text-white",
  // The little name labels that appear on hover
  "[&_.bg-gray-100]:bg-[#0d0e26]",
  "[&_.bg-gray-100]:text-neutral-100",
  "[&_.border-gray-200]:border-white/10",
  // The pop-out menu on phones
  "[&_.bg-gray-50]:bg-[#0d0e26]/80",
  "[&_.bg-gray-50]:backdrop-blur-md",
].join(" ");

const DOCK_ITEMS = [
  { title: "Home", href: "#top", icon: <IconHome className={ICON} /> },
  { title: "Search", href: "#search", icon: <IconSearch className={ICON} /> },
  {
    title: "Experience",
    href: "#experience",
    icon: <IconBriefcase className={ICON} />,
  },
  { title: "Projects", href: "#projects", icon: <IconCode className={ICON} /> },
  {
    title: "Education",
    href: "#education",
    icon: <IconSchool className={ICON} />,
  },
  { title: "Awards", href: "#awards", icon: <IconTrophy className={ICON} /> },
  {
    title: "GitHub",
    href: profile.github,
    icon: <IconBrandGithub className={ICON} />,
  },
  {
    title: "LinkedIn",
    href: profile.linkedin.startsWith("http")
      ? profile.linkedin
      : `https://${profile.linkedin}`,
    icon: <IconBrandLinkedin className={ICON} />,
  },
  {
    title: "Email",
    href: `mailto:${profile.email}`,
    icon: <IconMail className={ICON} />,
  },
];

// ---------------------------------------------------------------------------

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  // The cloud shader starts 2.5 s into the intro (or straight away if the
  // intro is skipped), so it's already drawing when the hero appears but
  // isn't competing with the terminal's first few seconds of typing.
  const [skyOn, setSkyOn] = useState(false);
  const revealSky = useCallback(() => setSkyOn(true), []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Download the shader's code (and the ASCII scene's) straight away, then
  // start them at 2.5 s.
  useEffect(() => {
    void import("@/components/ui/cloud-shader");
    void import("@/lib/ascii-scene");
    const t = setTimeout(() => setSkyOn(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  useEffect(() => {
    // The dock's Search item links to #search; open the search bar instead.
    const openFromHash = () => {
      if (window.location.hash === "#search") {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        setSearchOpen(true);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("hashchange", openFromHash);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const shown = useMemo(
    () =>
      q
        ? {
            experience: searchIn(SEARCH_INDEX.experience, q),
            projects: searchIn(SEARCH_INDEX.projects, q),
            education: searchIn(SEARCH_INDEX.education, q),
            skills: searchIn(SEARCH_INDEX.skills, q),
            awards: searchIn(SEARCH_INDEX.awards, q),
          }
        : ALL,
    [q],
  );

  const total =
    shown.experience.length +
    shown.projects.length +
    shown.education.length +
    shown.skills.length +
    shown.awards.length;

  return (
    <main id="top" className="relative min-h-screen bg-[#050509] text-white">
      <Splash onReveal={revealSky} />

      {/* Full-width hero with the cloud shader */}
      {!searching && (
        <section className="relative z-10 flex min-h-[92vh] w-full items-center overflow-hidden bg-gradient-to-b from-[#050509] to-[#0d0e26]">
          {/* Night-sky colours so the white hero text stays readable. The
              section's own gradient matches the sky until the shader starts. */}
          {skyOn && (
            <CloudShader
              className="absolute inset-0 min-h-0"
              speed={0.8}
              count={6}
              cloudColor="#3d4060"
              skyTopColor="#050509"
              skyBottomColor="#0d0e26"
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={HERO_LIGHT}
          />

          <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-[1.15fr_0.85fr] md:py-24">
            <div>
            <p className="mb-3 text-sm font-medium tracking-wide text-neutral-300 md:text-base">
              {profile.location}
            </p>
            <h1
              className={`${display} max-w-5xl text-5xl font-semibold leading-[1.02] tracking-tight text-white [text-wrap:balance] md:text-6xl lg:text-7xl`}
            >
              Hi, I&apos;m {FIRST_NAMES}{" "}
              {/* The last name keeps extra room above it for the figure,
                  even when it wraps onto its own line on phones. */}
              <span className="inline-block whitespace-nowrap pt-[0.5em]">
                {/* Zero-size marker sitting on the baseline, just before
                    the S; the figure is positioned from here. */}
                <span className="relative inline-block h-0 w-0 align-baseline">
                  <PerchedMe />
                </span>
                {LAST_NAME}.
              </span>
            </h1>
            <div className="mt-8 max-w-3xl text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
              I build things at the edge of
              <PointerHighlight>
                <span className="px-1">radio signals and software</span>
              </PointerHighlight>
            </div>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
              {profile.role}.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#experience"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                See my work
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get in touch
              </a>
            </div>
            </div>

            {/* Fixed-height box so the layout doesn't jump when the scene
                starts. It sits over the shader, which shows through. */}
            <div className="relative h-[420px] w-full md:h-[640px]">
              {skyOn && <AsciiScene lift={1.8} className="h-full w-full" />}
            </div>
          </div>
        </section>
      )}

      <div style={PAGE_SKY}>
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-44 pt-24">
        {searching && (
          <p className="mb-10 text-base text-neutral-200">
            {total === 0
              ? `No results for "${query}". Try a keyword like PyTorch, React or SDR.`
              : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
          </p>
        )}

        {/* Experience */}
        {shown.experience.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="experience">Experience</SectionTitle>
            <div className="grid gap-4">
              {shown.experience.map((e) =>
                isClassifiedExperience(e) ? (
                  <TiltCard key={e.id}>
                    <p className="font-mono text-sm text-neutral-400">
                      {e.period} · CLASSIFIED
                    </p>
                    <h3 className={`${display} mt-2 text-2xl font-semibold`}>
                      {e.role || "Research Intern"}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-400">
                      Confidential Research Division
                    </p>
                    <ClassifiedDoc />
                  </TiltCard>
                ) : (
                  <TiltCard key={e.id}>
                    <p className="text-sm font-medium text-neutral-300">
                      {e.period} · {e.place}
                    </p>
                    <h3 className={`${display} mt-2 text-2xl font-semibold`}>
                      {e.role}, {e.org}
                    </h3>
                    {e.project && (
                      <p className="mt-1 text-base font-medium text-neutral-100">
                        {e.project}
                      </p>
                    )}
                    <p className="mt-3 text-base leading-relaxed text-neutral-200">
                      {e.summary}
                    </p>
                    {e.points.length > 0 && (
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-neutral-200">
                        {e.points.map((pt) => (
                          <li key={pt}>{pt}</li>
                        ))}
                      </ul>
                    )}
                    {e.tags.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </div>
                    )}
                  </TiltCard>
                ),
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {shown.projects.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="projects">Projects</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {shown.projects.map((p) => (
                <TiltCard key={p.id}>
                  <p className="text-sm font-medium text-neutral-300">
                    {p.period}
                  </p>
                  <h3 className={`${display} mt-2 text-2xl font-semibold`}>
                    {p.title}
                  </h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-neutral-200">
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {shown.skills.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="skills">Skills</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {shown.skills.map((s) => (
                <TiltCard key={s.id}>
                  <h3 className={`${display} text-lg font-semibold`}>
                    {s.group}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.items.map((i) => (
                      <Tag key={i}>{i}</Tag>
                    ))}
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {shown.education.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="education">Education</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {shown.education.map((e) => (
                <TiltCard key={e.id}>
                  <p className="text-sm font-medium text-neutral-300">
                    {e.period}
                  </p>
                  <h3 className={`${display} mt-2 text-xl font-semibold`}>
                    {e.school}
                  </h3>
                  <p className="mt-2 text-base text-neutral-100">{e.detail}</p>
                  <p className="mt-3 text-base font-semibold text-white">
                    {e.score}
                  </p>
                  <p className="text-sm text-neutral-300">{e.place}</p>
                  {e.extra && (
                    <p className="mt-4 text-sm leading-relaxed text-neutral-200">
                      <span className="font-semibold text-white">
                        Coursework:{" "}
                      </span>
                      {e.extra}
                    </p>
                  )}
                </TiltCard>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {shown.awards.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="awards">Awards</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {shown.awards.map((a) => (
                <TiltCard key={a.id}>
                  <h3 className={`${display} text-lg font-semibold`}>
                    {a.title}
                  </h3>
                  <p className="mt-2 text-base text-neutral-200">{a.note}</p>
                </TiltCard>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>

      {/* Search bar, opened from the dock (or Ctrl/Cmd+K) */}
      {searchOpen && (
        <div className="fixed inset-x-0 bottom-28 z-50 flex justify-center px-4">
          <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/15 bg-neutral-950/90 py-2.5 pl-5 pr-3 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <IconSearch className="h-5 w-5 shrink-0 text-neutral-300" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keywords, e.g. PyTorch, React, SDR"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-neutral-400 [font-family:inherit]"
            />
            {searching && (
              <span className="shrink-0 text-sm text-neutral-300">
                {total} found
              </span>
            )}
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-neutral-300 transition hover:bg-white/10 hover:text-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating dock */}
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center">
        <FloatingDock
          items={DOCK_ITEMS}
          desktopClassName={`rounded-full border border-white/10 bg-[#0d0e26]/70 dark:bg-[#0d0e26]/70 backdrop-blur-md shadow-lg shadow-black/40 ${DOCK_THEME}`}
          mobileClassName={`fixed bottom-6 right-6 ${DOCK_THEME}`}
        />
      </div>
    </main>
  );
}
