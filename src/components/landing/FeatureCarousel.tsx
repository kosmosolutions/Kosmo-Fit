"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  image: string;
  alt: string;
};

// Hand-picked Unsplash photography that maps to each in-app surface.
// All URLs are direct Unsplash CDN links (whitelisted in next.config.ts).
const SLIDES: Slide[] = [
  {
    eyebrow: "Daily Overview",
    title: "Your day at a glance.",
    body: "Rings for calories, protein, steps and water. Tap any ring to drill into the day.",
    accent: "#00a8e8",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    alt: "Athlete writing the day's plan in a training journal",
  },
  {
    eyebrow: "Workouts",
    title: "Home & gym, side by side.",
    body: "A polished 6-day split with dumbbell swaps for home. Every move has a demo and a search link.",
    accent: "#00a8e8",
    image:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    alt: "Athlete training with dumbbells in a gym",
  },
  {
    eyebrow: "Diet",
    title: "Track what you eat. Save what you love.",
    body: "Split meals across breakfast, snack, lunch and dinner. Save any meal as a one-tap recipe.",
    accent: "#00a8e8",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    alt: "Colorful balanced meal bowl with chicken, grains and vegetables",
  },
  {
    eyebrow: "Wellness",
    title: "Warm up, stretch, breathe.",
    body: "Three difficulties per routine — 5, 10 or 15 minutes. Tap to play. No subscription wall.",
    accent: "#00a8e8",
    image:
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
    alt: "Person stretching during a wellness routine",
  },
  {
    eyebrow: "Plan",
    title: "The math, made for you.",
    body: "BMR, TDEE, deficit and macro targets — computed from your body, refreshed on every change.",
    accent: "#00a8e8",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    alt: "Athlete checking fitness metrics on phone after a run",
  },
];

export function FeatureCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slides.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const i = Number(visible.target.getAttribute("data-slide"));
          if (!Number.isNaN(i)) setIndex(i);
        }
      },
      { root: track, threshold: [0.5, 0.75, 1] },
    );
    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>("[data-slide]");
    const step = slide?.getBoundingClientRect().width ?? track.clientWidth * 0.85;
    track.scrollBy({ left: dir * (step + 16), behavior: "smooth" });
  };

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>(`[data-slide="${i}"]`);
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((s, i) => (
          <article
            key={s.eyebrow}
            data-slide={i}
            className="card-elev group flex w-[85%] shrink-0 snap-center flex-col gap-5 overflow-hidden p-0 sm:w-[440px]"
          >
            <div
              className="relative aspect-[4/5] w-full overflow-hidden"
              style={{
                boxShadow: `inset 0 -80px 80px -40px rgba(0,0,0,0.7)`,
              }}
            >
              <Image
                src={s.image}
                alt={s.alt}
                fill
                sizes="(max-width: 640px) 85vw, 440px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={i === 0}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div
                  className="text-[10px] font-bold uppercase tracking-[3px]"
                  style={{ color: s.accent }}
                >
                  {s.eyebrow}
                </div>
                <h3 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
                  {s.title}
                </h3>
              </div>
            </div>
            <p className="px-5 pb-5 text-sm leading-relaxed text-chalk-300">
              {s.body}
            </p>
          </article>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-chalk-200 transition hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === i ? "w-6 bg-accent-blue" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy(1)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-chalk-200 transition hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
