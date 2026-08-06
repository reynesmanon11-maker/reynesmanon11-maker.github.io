import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Clock3, Instagram, Menu, MoveRight } from "lucide-react";

import IntroSequence from "@/components/IntroSequence";
import LineField from "@/components/LineField";
import type { LineFieldVariant } from "@/components/LineField";
import StarField from "@/components/StarField";
import { useImageFallback } from "@/components/useImageFallback";

import logo from "@/assets/logo.svg";
import vectorArrow from "@/assets/Vector.svg";
import noise from "@/assets/noise.png";
import ellipseArc from "@/assets/ellipse-arc.png";
import bgSilhouettes from "@/assets/bg-silhouettes.png";
import bgNikon from "@/assets/bg-nikon.png";
import bgFabric from "@/assets/bg-fabric.png";
import getInTouchBg from "@/assets/get-in-touch-bg.png";
import photoRalphPortrait from "@/assets/photo-ralph-portrait.png";
import photoBasketball from "@/assets/photo-basketball.png";
import photoHat from "@/assets/photo-hat.png";
import photoRed from "@/assets/photo-red.png";
import photoSculptureBw from "@/assets/photo-sculpture-bw.png";
import photoSculptureColor from "@/assets/photo-sculpture-color.png";
import photoTwins from "@/assets/photo-twins.png";
import photoBerries from "@/assets/photo-berries.png";
import photoFieldsBw from "@/assets/photo-fields-bw.png";
import photoFieldsColor from "@/assets/photo-fields-color.png";
import photoCar from "@/assets/photo-car.png";
import photoGirlGrass from "@/assets/photo-girl-grass.png";
import photoCamera from "@/assets/photo-camera.png";

const EASE = [0.22, 1, 0.36, 1] as const;
const INTRO_DELAY = 2.9;
const MATTE = "bg-[oklch(0.16_0.004_240)]";
const PLACEHOLDER = "oklch(0.18 0 0)";

const blurIn = {
  hidden: { opacity: 0, y: 24, filter: "blur(14px)" },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.1, delay: INTRO_DELAY + i * 0.08, ease: EASE },
  }),
};

const photoIn = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(12px)" },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.2, delay: INTRO_DELAY + 0.1 + i * 0.1, ease: EASE },
  }),
};

/**
 * Content photo. On load failure it swaps to a matching-size block so the
 * layout never shifts and no broken-image state is shown.
 */
function Photo({
  src,
  alt,
  className = "",
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { failed, imgProps } = useImageFallback();
  if (failed) {
    return (
      <div
        className={className}
        style={{ ...style, backgroundColor: PLACEHOLDER }}
        role="img"
        aria-label={alt}
      />
    );
  }
  return <img src={src} alt={alt} className={className} style={style} {...imgProps} />;
}

/** Decorative image: disappears entirely if it cannot be loaded. */
function Decor({
  src,
  className = "",
  style,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
}) {
  const { failed, imgProps } = useImageFallback();
  if (failed) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className={className}
      style={style}
      {...imgProps}
    />
  );
}

function NoiseOverlay() {
  return (
    <Decor
      src={noise}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-12 mix-blend-overlay"
      style={{ zIndex: 1 }}
    />
  );
}

function PinterestIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.379-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

/* --------------------------------- top bar -------------------------------- */

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Our photographer", href: "#photographer" },
  { label: "Projects", href: "#projects" },
  { label: "Get in touch", href: "#marvels" },
];

function TopBar() {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState("");
  const { failed: logoFailed, imgProps: logoProps } = useImageFallback();

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 px-6 pt-6 md:px-10">
      <div className="flex items-center justify-between gap-4">
        <motion.a
          href="#hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: INTRO_DELAY - 0.2, ease: EASE }}
          aria-label="VALMAX home"
        >
          {logoFailed ? (
            <span className="font-display block h-6 text-xl leading-6 font-black text-white">
              VALMAX
            </span>
          ) : (
            <img src={logo} alt="VALMAX" className="h-6 w-auto" {...logoProps} />
          )}
        </motion.a>

        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: INTRO_DELAY - 0.2, ease: EASE }}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:bg-white/[0.08] hover:text-white"
          >
            <Clock3 className="h-3.5 w-3.5 opacity-60" aria-hidden />
            <span className="tabular-nums">{time}</span>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <Menu className="h-4 w-4" aria-hidden />
          </button>

          <AnimatePresence>
            {open && (
              <motion.nav
                initial={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: EASE }}
                className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-xl"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between rounded-xl px-4 py-3 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight
                      className="h-4 w-4 opacity-40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </a>
                ))}

                <div className="mt-2 flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/50">
                  <span>Follow</span>
                  <a
                    href="https://instagram.com"
                    className="flex items-center gap-2 transition hover:text-white"
                  >
                    <Instagram className="h-3.5 w-3.5" aria-hidden />
                    Instagram
                  </a>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}

/* -------------------------------- hero ----------------------------------- */

type HeroCard = {
  src: string;
  alt: string;
  position: string;
  size: string;
  depth: number;
  badge?: "ig" | "pin";
  album?: boolean;
};

const HERO_CARDS: Array<HeroCard> = [
  {
    src: photoFieldsBw,
    alt: "Fields",
    position: "top-[2%] left-[34%]",
    size: "w-[150px] aspect-[4/3]",
    depth: 18,
    badge: "ig",
  },
  {
    src: photoBerries,
    alt: "Berries",
    position: "top-[2%] right-[2%]",
    size: "w-[260px] aspect-[16/9]",
    depth: 22,
  },
  {
    src: photoBasketball,
    alt: "Athlete",
    position: "top-[7%] left-[4%]",
    size: "w-[110px] aspect-[3/4]",
    depth: 28,
    badge: "ig",
  },
  {
    src: photoRed,
    alt: "Portrait red",
    position: "top-[10%] right-[12%]",
    size: "w-[200px] aspect-[3/4]",
    depth: 26,
    badge: "pin",
    album: true,
  },
  {
    src: photoHat,
    alt: "Hat",
    position: "top-[18%] left-[3%]",
    size: "w-[220px] aspect-[3/4]",
    depth: 20,
    badge: "ig",
  },
  {
    src: photoSculptureBw,
    alt: "Sculpture",
    position: "bottom-[calc(6%-10px)] left-[calc(34%-90px)]",
    size: "w-[160px] aspect-[4/5]",
    depth: 24,
    badge: "pin",
  },
  {
    src: photoTwins,
    alt: "Twins",
    position: "bottom-[6%] right-[22%]",
    size: "w-[230px] aspect-[16/10]",
    depth: 22,
  },
];

function Badge({ kind }: { kind: "ig" | "pin" }) {
  return (
    <div className="absolute right-2 bottom-2 grid h-6 w-6 place-items-center rounded-md bg-black/40 text-white/80 backdrop-blur-sm">
      {kind === "ig" ? (
        <Instagram className="h-3 w-3" aria-hidden />
      ) : (
        <PinterestIcon />
      )}
    </div>
  );
}

function ViewAlbumOverlay() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-4 flex items-center gap-2.5">
      <span className="relative grid place-items-center">
        <span
          className="absolute rounded-full bg-white/30 blur-[10px]"
          style={{ width: 55, height: 55 }}
          aria-hidden
        />
        <span
          className="absolute rounded-full bg-white/50 blur-[4px]"
          style={{ width: 38, height: 38 }}
          aria-hidden
        />
        <span
          className="block rounded-full bg-white"
          style={{
            width: 25,
            height: 25,
            boxShadow: "0 0 18px 4px rgba(255,255,255,0.7)",
          }}
          aria-hidden
        />
      </span>
      <span
        className="grid place-items-center rounded-full border border-white/15 bg-black/35 text-[13px] text-white backdrop-blur-md"
        style={{ width: 119, height: 39 }}
      >
        View album
      </span>
    </div>
  );
}

function HeroCollageCard({ card, index }: { card: HeroCard; index: number }) {
  return (
    <motion.div
      className={`absolute ${card.position} ${card.size}`}
      variants={photoIn}
      initial="hidden"
      animate="show"
      custom={index}
      style={{
        transform: `translate3d(calc(var(--mx, 0) * ${card.depth}px), calc(var(--my, 0) * ${card.depth}px), 0)`,
        transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div
        className="group relative h-full w-full overflow-hidden ring-1 ring-white/10"
        style={{ boxShadow: "0 30px 80px -30px rgba(0,0,0,0.9)" }}
      >
        <Photo
          src={card.src}
          alt={card.alt}
          className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
        />
        {card.badge && <Badge kind={card.badge} />}
        {card.album && <ViewAlbumOverlay />}
      </div>
    </motion.div>
  );
}

function RalphHero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const section = sectionRef.current;
    if (!section) return;
    const onMove = (event: MouseEvent) => {
      section.style.setProperty(
        "--mx",
        String(event.clientX / window.innerWidth - 0.5),
      );
      section.style.setProperty(
        "--my",
        String(event.clientY / window.innerHeight - 0.5),
      );
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className={`relative min-h-[110vh] overflow-hidden pt-32 pb-24 ${MATTE}`}
    >
      <StarField count={700} />
      <LineField variant="hero" />
      <NoiseOverlay />

      <Decor
        src={ellipseArc}
        className="pointer-events-none absolute max-w-none opacity-50"
        style={{ width: 1500, top: "10%", left: "50%", transform: "translateX(-78%)", zIndex: 0 }}
      />
      <Decor
        src={ellipseArc}
        className="pointer-events-none absolute max-w-none opacity-50"
        style={{ width: 1500, top: "10%", left: "50%", transform: "translateX(-22%)", zIndex: 0 }}
      />

      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl"
        style={{ zIndex: 1 }}
        aria-hidden
      />

      <div className="relative z-10 grid min-h-[80vh] place-items-center px-6 text-center">
        <div className="max-w-2xl">
          <motion.h1
            className="font-display text-7xl leading-[0.95] font-black tracking-tight md:text-[110px]"
            variants={blurIn}
            initial="hidden"
            animate="show"
            custom={1}
          >
            RALPH
            <br />
            EDWARDS
          </motion.h1>
          <motion.p
            className="mx-auto mt-8 max-w-md text-base leading-relaxed text-white/55 md:text-[15px]"
            variants={blurIn}
            initial="hidden"
            animate="show"
            custom={3}
          >
            Crafting digital experiences that captivate and inspire. Elevating your
            brand through design and innovation.
          </motion.p>
        </div>
      </div>

      {/*
        The collage cards are sized in fixed pixels, so below `md` they would
        bury the headline. There they drop behind the text as ambience; at `md`
        and up the composition is untouched.
      */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-25 md:z-20 md:opacity-100">
        <div className="pointer-events-auto relative h-full w-full">
          {HERO_CARDS.map((card, i) => (
            <HeroCollageCard key={card.alt} card={card} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- our photographer ---------------------------- */

function OurPhotographer() {
  return (
    <section
      id="photographer"
      className={`relative overflow-hidden px-6 py-32 md:px-12 ${MATTE}`}
    >
      <StarField count={500} />
      <LineField variant="photographer" />
      <NoiseOverlay />

      <Decor
        src={bgFabric}
        className="pointer-events-none absolute top-1/3 left-0 w-[280px] select-none opacity-[0.13] md:w-[340px]"
        style={{ zIndex: 1 }}
      />
      <Decor
        src={bgSilhouettes}
        className="pointer-events-none absolute top-[12%] right-0 w-[360px] select-none opacity-[0.16] md:w-[460px]"
        style={{ zIndex: 1 }}
      />
      <Decor
        src={bgNikon}
        className="pointer-events-none absolute right-[4%] bottom-0 w-[280px] select-none opacity-[0.14] md:w-[360px]"
        style={{ zIndex: 1 }}
      />

      <div
        className="pointer-events-none absolute top-1/2 -left-20 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-white/[0.02] blur-3xl"
        style={{ zIndex: 1 }}
        aria-hidden
      />

      <div
        className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 md:grid-cols-2"
        style={{ zIndex: 2 }}
      >
        <motion.div
          className="relative w-full max-w-[440px] justify-self-center p-4 pb-20 md:justify-self-end"
          style={{
            backgroundColor: "#efeae0",
            boxShadow: "0 40px 100px -30px rgba(0,0,0,0.8)",
          }}
          initial={{ opacity: 0, y: 60, filter: "blur(16px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: EASE }}
        >
          <motion.h2
            className="font-display absolute -top-16 left-[40rem] -translate-x-1/2 text-4xl leading-[0.95] font-medium whitespace-nowrap text-white uppercase max-md:left-0 max-md:translate-x-0 md:-top-19 md:text-5xl"
            initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            Our photographer
          </motion.h2>

          <Photo
            src={photoRalphPortrait}
            alt="Ralph Edwards"
            className="aspect-[3/4] w-full object-cover"
          />

          <div className="font-display absolute bottom-6 left-6 text-2xl leading-none font-black text-black">
            RALPH
            <br />
            EDWARDS
          </div>
        </motion.div>

        <div className="max-w-xl space-y-8">
          <motion.h2
            className="font-display mt-[-28px] w-[600px] text-4xl leading-[1.05] font-medium uppercase max-md:w-full md:text-5xl"
            initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            will select the
            <br />
            best images and ideas
            <br />
            for you
          </motion.h2>

          <motion.div
            className="space-y-4 text-[15px] leading-relaxed text-white/55"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
          >
            <p>
              Once upon a time, nestled in a quaint little town, there lived an
              author named Alice. She wasn't your typical writer; her stories
              weren't just ink on paper; they were portals to worlds beyond
              imagination. Alice had a peculiar gift — she could breathe life into
              her characters, making them dance off the pages and into the hearts
              of her readers.
            </p>
            <p>
              Alice's love for storytelling began in her childhood. She would spend
              hours in her attic, surrounded by dusty old books, dreaming up
              adventures for her imaginary friends. As she grew older, her passion
              for writing only intensified. She studied literature at university,
              honing her craft and delving deeper into the mysteries of
              storytelling.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- projects -------------------------------- */

type Project = {
  src: string;
  title: string;
  tall: boolean;
  mt: string;
  width: string;
};

const PROJECTS: Array<Project> = [
  { src: photoCar, title: "Company Photo", tall: false, mt: "md:mt-20", width: "w-[216px]" },
  { src: photoFieldsColor, title: "Landscape Series", tall: true, mt: "md:mt-25", width: "w-[220px]" },
  { src: photoGirlGrass, title: "Classy Photo Shoot", tall: false, mt: "md:mt-10", width: "w-[230px]" },
  { src: photoSculptureColor, title: "Photo Brand", tall: false, mt: "md:mt-4", width: "w-[200px]" },
];

function AllTypes() {
  return (
    <section
      id="projects"
      className={`relative overflow-hidden px-6 py-32 md:px-12 ${MATTE}`}
    >
      <StarField
        count={550}
        ring
        ringCount={260}
        ringRadiusFactor={0.37}
        ringBandWidth={50}
      />
      <LineField variant="projects" />
      <NoiseOverlay />

      <div className="relative z-2 mx-auto max-w-7xl">
        <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-2">
          <motion.h2
            className="font-display text-5xl leading-[0.95] font-black uppercase md:text-6xl"
            initial={{ opacity: 0, y: 30, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            All types of
            <br />
            projects
          </motion.h2>

          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
          >
            <p className="max-w-md text-[15px] text-white/55">
              Welcome to the Innovation Hub: Where Ideas Take Shape. Explore the
              Intersection of Creativity and Technology. Dive Into Our Portfolio and
              Witness the Power of Ingenuity.
            </p>
            <button
              type="button"
              className="group flex items-center gap-3 text-sm tracking-widest text-white/70 uppercase transition hover:text-white"
            >
              View the artwork
              <MoveRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 items-start gap-8 md:grid-cols-4 md:gap-12">
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.title}
              className={`${project.mt} ${project.width} max-w-full`}
              initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.1, delay: i * 0.12, ease: EASE }}
            >
              <div
                className="group overflow-hidden ring-1 ring-white/10"
                style={{ boxShadow: "0 30px 80px -30px rgba(0,0,0,0.8)" }}
              >
                <Photo
                  src={project.src}
                  alt={project.title}
                  className={`w-full ${project.tall ? "aspect-[3/4]" : "aspect-[4/5]"} object-cover transition-transform duration-[1500ms] group-hover:scale-110`}
                />
              </div>

              <div className="mt-4 space-y-3 text-center">
                <h3 className="font-display text-sm font-bold tracking-wider text-white uppercase">
                  {project.title}
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/5"
                >
                  photo shoot
                  <span className="grid h-4 w-4 place-items-center rounded-full border border-white/20">
                    <ArrowUpRight className="h-2.5 w-2.5" aria-hidden />
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- mechanical marvels -------------------------- */

function VectorArrow() {
  const { failed, imgProps } = useImageFallback();
  if (failed) {
    return <ArrowUpRight className="h-[5.53px] w-[5.86px]" aria-hidden />;
  }
  return (
    <img
      src={vectorArrow}
      alt=""
      aria-hidden
      className="h-[5.53px] w-[5.86px]"
      {...imgProps}
    />
  );
}

function MechanicalMarvels() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <section id="marvels" ref={sectionRef}>
      <div className="relative overflow-hidden px-6 pt-28 pb-12 md:px-12">
        <StarField count={450} />
        <LineField variant="marvels" />
        <NoiseOverlay />

        <div className="relative z-2">
          <motion.h2
            className="font-display max-w-[1200px] text-5xl leading-[0.95] font-medium tracking-tight uppercase md:text-[90px]"
            initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            Mechanical{" "}
            <span className="inline-flex items-center align-middle">
              {/*
                Sized by height, so it needs an explicit ratio — without one the
                fallback block has no intrinsic width and collapses.
              */}
              <Photo
                src={photoCamera}
                alt="Camera"
                className="aspect-[16/9] h-10 w-auto rounded-md object-cover md:h-20"
              />
            </span>{" "}
            Marvels: Unveiling the artistry of automation
          </motion.h2>

          <div className="mt-16 flex items-center justify-between text-xs tracking-widest text-white/50 uppercase">
            <button
              type="button"
              className="group flex items-center gap-3 transition hover:text-white"
            >
              View the artwork
              <MoveRight
                className="h-3.5 w-3.5 -rotate-45 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </button>
            <button
              type="button"
              className="group flex items-center gap-3 transition hover:text-white"
            >
              Scroll to view more
              <MoveRight
                className="h-3.5 w-3.5 rotate-90 transition-transform group-hover:translate-y-1"
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-[80vh] overflow-hidden">
        <motion.div
          className="absolute -top-[10%] -bottom-[10%] right-0 left-0"
          style={{ y: parallaxY }}
        >
          <Decor
            src={getInTouchBg}
            className="h-full w-full object-cover"
          />
        </motion.div>

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20"
          aria-hidden
        />
        <LineField variant="marvelsBottom" />

        <div className="relative grid h-full place-items-center px-6 text-center">
          <div>
            <motion.h3
              className="font-display text-4xl leading-[1] font-black tracking-tight uppercase md:text-7xl"
              initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: EASE }}
            >
              Get in touch to our
              <br />
              <span className="text-lime">Modern maintenance.</span>
            </motion.h3>

            <div className="flex items-center justify-center gap-1">
              <motion.button
                type="button"
                className="mt-10 inline-flex rounded-full bg-white px-6 py-2 text-sm font-medium text-black uppercase transition hover:bg-white/90"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
              >
                GET IN TOUCH
              </motion.button>
              <span
                className="mt-[4rem] flex h-[18.53px] w-[18.86px] items-center justify-center rounded-full border-[1px] border-white"
                aria-hidden
              >
                <VectorArrow />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- footer --------------------------------- */

function Footer() {
  return (
    <footer className="relative flex items-center justify-between border-t border-white/10 px-6 py-6 text-xs text-white/40 md:px-12">
      <span>All right reserved — 2024</span>
      <a href="#" className="transition hover:text-white">
        Privacy Policy
      </a>
    </footer>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function ValmaxLanding(): ReactNode {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <IntroSequence />
      <TopBar />
      <RalphHero />
      <OurPhotographer />
      <AllTypes />
      <MechanicalMarvels />
      <Footer />
    </main>
  );
}
