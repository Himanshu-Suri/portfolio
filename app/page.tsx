"use client";

import dynamic from "next/dynamic";
import {
  Children,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
import { FloatingDock } from "@/components/ui/floating-dock";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { CloudShader } from "@/components/ui/cloud-shader";
import {
  awards,
  education,
  experience,
  profile,
  projects,
  skills,
} from "@/lib/data";

const IntroTerminal = dynamic(
  () => import("@/components/ui/terminal").then((m) => m.Terminal),
  { ssr: false },
);

// Plays on every load and reload. Click Skip (or anywhere) to dismiss early.
function Splash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    document.body.style.overflow = phase === "gone" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  useEffect(() => {
    const t = setTimeout(() => setPhase("fade"), 4500);
    return () => clearTimeout(t);
  }, []);

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
// Redacted text: every character stays scrambled forever, except the
// buzzwords below, which decrypt once the text scrolls into view.
// Edit this list to choose what visitors are allowed to read.
const BUZZWORDS = [
  "LLM",
  "quantization",
  "Hadamard",
  "mixed precision",
  "mixed-precision",
  "calibration",
  "low-bit",
  "integer-only",
  "W8A8",
  "inference",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first so "mixed precision" wins over shorter overlaps.
const BUZZ_RE = new RegExp(
  `\\b(${[...BUZZWORDS]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join("|")})`,
  "gi",
);

// The buzzwords that actually appear in some text (used for search).
const buzzwordsIn = (...parts: (string | string[] | undefined)[]) =>
  parts
    .flat()
    .filter((p): p is string => typeof p === "string")
    .flatMap((p) => p.match(BUZZ_RE) ?? []);

// One shared clock for all redacted text, so there's a single timer.
let tick = 0;
let tickTimer: number | undefined;
const tickListeners = new Set<() => void>();
const subscribeTick = (cb: () => void) => {
  tickListeners.add(cb);
  if (tickTimer === undefined) {
    tickTimer = window.setInterval(() => {
      tick += 1;
      tickListeners.forEach((l) => l());
    }, 80);
  }
  return () => {
    tickListeners.delete(cb);
    if (tickListeners.size === 0) {
      window.clearInterval(tickTimer);
      tickTimer = undefined;
    }
  };
};
const useTick = () =>
  useSyncExternalStore(subscribeTick, () => tick, () => 0);

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia(MOTION_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false,
  );

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\|";
// Deterministic pseudo-random glyph for a character position at a tick,
// so the server and the first client render match.
const glyph = (pos: number, t: number) => {
  let h = Math.imul(pos ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(t + 1, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h, 0x27d4eb2d);
  h ^= h >>> 15;
  return GLYPHS[(h >>> 0) % GLYPHS.length];
};

function Redacted({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const now = useTick();
  const calm = useReducedMotion();
  const [start, setStart] = useState<number | null>(null);
  // Even indices are hidden text, odd indices are buzzwords.
  const parts = useMemo(() => text.split(BUZZ_RE), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStart((s) => s ?? tick);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scramble = (s: string, from: number, keep: number) =>
    Array.from(s, (ch, j) =>
      ch === " " || j < keep ? ch : calm ? "█" : glyph(from + j, now),
    ).join("");

  let pos = 0;
  let order = 0;
  const visible = parts.filter((_, i) => i % 2 === 1);

  return (
    <span ref={ref} className="font-mono">
      <span aria-hidden="true">
        {parts.map((part, i) => {
          const from = pos;
          pos += part.length;
          if (i % 2 === 0) {
            return (
              <span key={i} className="text-neutral-700">
                {scramble(part, from, 0)}
              </span>
            );
          }
          const delay = 4 + order++ * 4;
          const shown = calm
            ? part.length
            : start === null
              ? 0
              : Math.max(0, now - start - delay);
          return (
            <span
              key={i}
              className="rounded bg-white/10 px-0.5 font-semibold text-white"
            >
              {scramble(part, from, shown)}
            </span>
          );
        })}
      </span>
      <span className="sr-only">
        {visible.length > 0 ? `Redacted. Mentions ${visible.join(", ")}.` : "Redacted."}
      </span>
    </span>
  );
}

// The classified internship "document". Each line mixes numbers (that many
// characters of permanently scrambled filler) with strings (buzzwords that
// decrypt and stay readable). No real details are stored anywhere in here,
// so nothing confidential ends up in the page's JavaScript bundle.
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

const CIPHER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*<>/\\|";
const randomChar = () => CIPHER[Math.floor(Math.random() * CIPHER.length)];

// Filler has a space at fixed positions so it looks like words but never
// rewraps while it flickers.
const filler = (length: number, char: () => string) =>
  Array.from({ length }, (_, i) => (i % 6 === 5 ? " " : char())).join("");

const blocks = () => "█";

// One animation frame of the document, `elapsed` ms after it scrolled into view.
function cipherFrame(elapsed: number) {
  return CLASSIFIED_DOC.map((line, li) =>
    line.map((seg, si) => {
      if (typeof seg === "number") return filler(seg, randomChar);
      const shown = Math.floor((elapsed - (li * 220 + si * 120)) / 35);
      return Array.from(seg, (ch, ci) =>
        ci < shown || ch === " " ? ch : randomChar(),
      ).join("");
    }),
  );
}

// Static version for people who prefer reduced motion: redaction bars plus buzzwords.
const calmFrame = () =>
  CLASSIFIED_DOC.map((line) =>
    line.map((seg) => (typeof seg === "number" ? filler(seg, blocks) : seg)),
  );

function ClassifiedDoc() {
  const ref = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<string[][] | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFrame(calmFrame());
      return;
    }

    let start: number | null = null;
    let timer: number | undefined;

    // Only animate while the card is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && timer === undefined) {
        start ??= performance.now();
        timer = window.setInterval(() => {
          setFrame(cipherFrame(performance.now() - (start ?? 0)));
        }, 70);
      } else if (!entry.isIntersecting && timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    });
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearInterval(timer);
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
              const text =
                frame?.[li]?.[si] ??
                filler(typeof seg === "number" ? seg : seg.length, blocks);
              return (
                <span key={si}>
                  {si > 0 && " "}
                  {typeof seg === "number" ? (
                    <span className="text-neutral-700">{text}</span>
                  ) : (
                    <span className="rounded bg-white/10 px-1 font-semibold text-white">
                      {text}
                    </span>
                  )}
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

const display = "font-[family-name:var(--font-grotesk)]";

const matches = (query: string, ...parts: (string | string[])[]) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.flat().join(" ").toLowerCase().includes(q);
};

const isClassifiedExperience = (entry: (typeof experience)[number]) =>
  "classified" in entry && entry.classified === true;

// A 3D tilt card. Each direct child floats a little higher than the one
// before it, so titles, text and tags separate as you hover.
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const parts = Children.toArray(children);

  return (
    <CardContainer containerClassName="h-full w-full py-0" className="h-full w-full">
      <CardBody
        className={`relative h-full w-full rounded-[1.75rem] border border-white/10 bg-neutral-950/80 p-6 backdrop-blur-sm transition-shadow duration-200 hover:shadow-2xl hover:shadow-indigo-500/20 md:p-8 ${className}`}
      >
        {parts.map((part, i) => (
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

function Tag({
  children,
  encrypted = false,
}: {
  children: string;
  encrypted?: boolean;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-sm font-medium text-neutral-100">
      {encrypted ? <Redacted text={children} /> : children}
    </span>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const shownExperience = useMemo(
    () =>
      experience.filter((e) =>
        isClassifiedExperience(e)
          ? // Only the visible buzzwords are searchable, never the org.
            matches(query, e.role, e.period, CLASSIFIED_KEYWORDS)
          : // The header is public; in the body only buzzwords are searchable.
            matches(
              query,
              e.period,
              e.place,
              e.role,
              e.org,
              e.project ?? "",
              buzzwordsIn(e.summary, e.points, e.tags),
            ),
      ),
    [query],
  );

  const shownProjects = useMemo(
    () =>
      projects.filter((p) => matches(query, p.title, p.tags, p.points, p.period)),
    [query],
  );

  const shownEducation = useMemo(
    () =>
      education.filter((e) =>
        matches(query, e.school, e.detail, e.score, e.extra ?? "", e.period),
      ),
    [query],
  );

  const shownSkills = useMemo(
    () => skills.filter((s) => matches(query, s.group, s.items)),
    [query],
  );

  const shownAwards = useMemo(
    () => awards.filter((a) => matches(query, a.title, a.note)),
    [query],
  );

  const total =
    shownExperience.length +
    shownProjects.length +
    shownEducation.length +
    shownSkills.length +
    shownAwards.length;

  const searching = query.trim().length > 0;

  const icon = "h-full w-full text-black";

  const dockItems = [
    { title: "Home", href: "#top", icon: <IconHome className={icon} /> },
    { title: "Search", href: "#search", icon: <IconSearch className={icon} /> },
    {
      title: "Experience",
      href: "#experience",
      icon: <IconBriefcase className={icon} />,
    },
    { title: "Projects", href: "#projects", icon: <IconCode className={icon} /> },
    {
      title: "Education",
      href: "#education",
      icon: <IconSchool className={icon} />,
    },
    { title: "Awards", href: "#awards", icon: <IconTrophy className={icon} /> },
    {
      title: "GitHub",
      href: profile.github,
      icon: <IconBrandGithub className={icon} />,
    },
    {
      title: "LinkedIn",
      href: profile.linkedin.startsWith("http")
        ? profile.linkedin
        : `https://${profile.linkedin}`,
      icon: <IconBrandLinkedin className={icon} />,
    },
    {
      title: "Email",
      href: `mailto:${profile.email}`,
      icon: <IconMail className={icon} />,
    },
  ];

  return (
    <main id="top" className="relative min-h-screen bg-black text-white">
      <Splash />

      {/* Full-width hero with the cloud shader */}
      {!searching && (
        <section className="relative z-10 flex min-h-[92vh] w-full items-center overflow-hidden border-b border-white/10 bg-black">
          {/* Night-sky colours so the white hero text stays readable */}
          <CloudShader
            className="absolute inset-0 min-h-0"
            speed={0.8}
            count={6}
            cloudColor="#3d4060"
            skyTopColor="#050509"
            skyBottomColor="#16173a"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black" />
          <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-28">
            <p className="mb-4 text-base font-medium text-neutral-300">
              {profile.location}
            </p>
            <h1
              className={`${display} text-5xl font-semibold tracking-tight text-white md:text-8xl`}
            >
              Hi, I&apos;m {profile.name}.
            </h1>
            <div className="mt-8 max-w-3xl text-2xl font-semibold tracking-tight text-neutral-100 md:text-3xl">
              I build things at the edge of
              <PointerHighlight>
                <span className="px-1">radio signals and software</span>
              </PointerHighlight>
            </div>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-neutral-200">
              {profile.role}.
            </p>
          </div>
        </section>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-44 pt-24">
        {searching && (
          <p className="mb-10 text-base text-neutral-200">
            {total === 0
              ? `No results for "${query}". Try a keyword like PyTorch, React or SDR.`
              : `${total} result${total === 1 ? "" : "s"} for "${query}"`}
          </p>
        )}

        {/* Experience */}
        {shownExperience.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="experience">Experience</SectionTitle>
            <div className="grid gap-4">
              {shownExperience.map((e) =>
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
                      <Redacted text={e.summary} />
                    </p>
                    {e.points.length > 0 && (
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-neutral-200">
                        {e.points.map((pt) => (
                          <li key={pt}>
                            <Redacted text={pt} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.tags.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <Tag key={t} encrypted>
                            {t}
                          </Tag>
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
        {shownProjects.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="projects">Projects</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {shownProjects.map((p) => (
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
        {shownSkills.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="skills">Skills</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {shownSkills.map((s) => (
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
        {shownEducation.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="education">Education</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              {shownEducation.map((e) => (
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
        {shownAwards.length > 0 && (
          <section className="mb-24">
            <SectionTitle id="awards">Awards</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {shownAwards.map((a) => (
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
          items={dockItems}
          desktopClassName="rounded-full border border-white/20 bg-black dark:bg-black shadow-lg shadow-black/60"
          mobileClassName="fixed bottom-6 right-6"
        />
      </div>
    </main>
  );
}