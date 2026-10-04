import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { BRAND_MARK, BRAND_MARK_SIZE } from "@/lib/app-config";
import { cn } from "@/lib/utils";
import { useStill } from "./ui";

/**
 * The brand mark (BRAND_MARK in lib/app-config) in black, set in a Didone (Bodoni Moda at its largest
 * optical size: heavy stems, hairline strokes, flat serifs): its first letter alone in the slides,
 * the whole word (`full`) as the logo of the header and covers.
 * Its outline draws itself, it fills in, then floats very slightly; hovering it draws it again.
 */
export function BrandMark({
  className,
  delay = 0,
  full = false,
}: {
  className?: string;
  delay?: number;
  full?: boolean;
}) {
  const still = useStill();
  // Hover: once drawn, the mark draws itself again (remount of the text, without the initial delay).
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState(false);
  const replay = () => {
    if (!ready || still) return;
    setReady(false);
    setRun((n) => n + 1);
  };
  const start = run ? 0 : delay;
  const text = full ? BRAND_MARK : BRAND_MARK.charAt(0);
  const word = useWordGeometry(full ? BRAND_MARK : null);
  const width = full ? word.width : 80;
  const length = full ? word.length : 260;
  const glyph = {
    x: width / 2,
    y: 66,
    textAnchor: "middle" as const,
    fontSize: 84,
    fontWeight: 400,
    letterSpacing: 1,
    className: "font-monogram",
    style: { fontVariationSettings: '"opsz" 96' },
  };
  return (
    <motion.svg
      viewBox={`0 0 ${width} 80`}
      className={cn(
        "pointer-events-auto overflow-visible text-[#111]",
        className,
      )}
      aria-label={text}
      role="img"
      onMouseEnter={replay}
      animate={{ y: [0, -1.5, 0] }}
      transition={{
        duration: 6,
        ease: "easeInOut",
        repeat: Infinity,
        delay: delay + 2.4,
      }}
    >
      <motion.text
        key={run}
        ref={word.ref}
        {...glyph}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray={length}
        initial={still ? false : { strokeDashoffset: length, fillOpacity: 0 }}
        animate={{ strokeDashoffset: 0, fillOpacity: 1 }}
        transition={{
          strokeDashoffset: {
            duration: 2.2,
            ease: [0.45, 0, 0.2, 1],
            delay: start,
          },
          fillOpacity: { duration: 1.4, delay: start + 1.3 },
        }}
        onAnimationComplete={() => setReady(true)}
      >
        {text}
      </motion.text>
    </motion.svg>
  );
}

/**
 * Size of the whole word: BRAND_MARK_SIZE when set, otherwise measured once the font is
 * loaded (width of the text + margin, outline ≈ 3.5 × the text width).
 */
function useWordGeometry(word: string | null) {
  const ref = useRef<SVGTextElement>(null);
  const tuned = word ? (BRAND_MARK_SIZE ?? undefined) : undefined;
  const [measured, setMeasured] = useState(() => ({
    width: Math.max(80, (word?.length ?? 1) * 55),
    length: (word?.length ?? 1) * 175,
  }));
  useLayoutEffect(() => {
    if (!word || tuned) return;
    const measure = () => {
      const textWidth = ref.current?.getComputedTextLength() ?? 0;
      if (textWidth > 0)
        setMeasured({
          width: Math.ceil(textWidth + 20),
          length: Math.ceil(textWidth * 3.5),
        });
    };
    measure();
    void document.fonts?.ready.then(measure);
  }, [word, tuned]);
  return { ref, ...(tuned ?? measured) };
}
