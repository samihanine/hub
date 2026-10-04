import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/features/presentation/monogram";

/**
 * Full-screen loading screen: the first letter of the house mark draws itself again and again
 * (same animation as the presentations), then the screen fades out once `show` turns false.
 */
export function LoadingScreen({
  show,
  label = "Loading",
}: {
  show: boolean;
  label?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 grid place-items-center bg-background"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-6">
            <LoopingMark />
            <p className="eyebrow animate-pulse">{label}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Remounts the monogram every cycle so its outline draws itself again. */
function LoopingMark() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCycle((n) => n + 1), 3200);
    return () => clearInterval(id);
  }, []);
  return <BrandMark key={cycle} className="h-24 w-24" />;
}
