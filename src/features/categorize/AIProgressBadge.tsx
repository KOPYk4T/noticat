import { motion, useMotionValue, useSpring, useMotionValueEvent } from 'motion/react';
import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AIProgressBadgeProps {
  current: number;
  total: number;
}

//TODO: Animations and microinteractionss
export const AIProgressBadge = ({ current, total }: AIProgressBadgeProps) => {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  const [displayCount, setDisplayCount] = useState(0);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplayCount(Math.round(latest));
  });

  useEffect(() => {
    motionValue.set(current);
  }, [current, motionValue]);


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 transition-colors duration-300 overflow-visible"
    >


      <Sparkles className="w-3 h-3 text-neutral-900" />
      <motion.span
        key={displayCount}
        initial={{ scale: 1.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-xs font-medium text-neutral-900 tabular-nums"
      >
        {displayCount}
      </motion.span>
      <span className="text-xs text-neutral-400">/</span>
      <span className="text-xs font-medium text-neutral-900 tabular-nums">{total}</span>
    </motion.div>
  );
};
