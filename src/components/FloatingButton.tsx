import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FloatingButtonProps {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  loadingIcon?: ReactNode;
  badge?: number;
  className?: string;
}

const COLLAPSED_WIDTH = 56;
const MIN_EXPANDED_WIDTH = 140;

export const FloatingButton = ({
  icon,
  text,
  onClick,
  disabled = false,
  isLoading = false,
  loadingText,
  loadingIcon,
  badge,
  className = "",
}: FloatingButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [prevBadge, setPrevBadge] = useState(badge);
  const [shouldBounce, setShouldBounce] = useState(false);

  useEffect(() => {
    if (badge !== undefined && prevBadge !== undefined && badge > prevBadge) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevBadge(badge);
  }, [badge, prevBadge]);

  const displayText = isLoading && loadingText ? loadingText : text;
  const expandedWidth = Math.max(MIN_EXPANDED_WIDTH, displayText.length * 8 + 60);
  const displayIcon = isLoading && loadingIcon ? loadingIcon : icon;
  const isExpanded = isHovered || isLoading;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative flex items-center bg-white border-2 border-neutral-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`}
      animate={{
        borderRadius: isExpanded ? "12px" : "50%",
        width: isExpanded ? expandedWidth : COLLAPSED_WIDTH,
        justifyContent: isExpanded ? "flex-start" : "center",
        paddingLeft: isExpanded ? "16px" : "0px",
        backgroundColor: isHovered && !disabled ? "#000000" : "#ffffff",
        borderColor: isHovered && !disabled ? "#000000" : "#e5e5e5",
      }}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ height: "56px" }}
      title={displayText}
    >
      <motion.div
        className="flex-shrink-0 relative z-10"
        animate={{
          rotate: isLoading ? 360 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{
          rotate: { duration: isLoading ? 1 : 0.3, repeat: isLoading ? Infinity : 0, ease: "linear" },
          scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        <motion.div
          animate={{ color: isHovered && !disabled ? "#ffffff" : "#000000" }}
          transition={{ duration: 0.3 }}
        >
          {displayIcon}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {badge !== undefined && badge > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              ...(shouldBounce && { y: [0, -8, 0, -4, 0] }),
            }}
            exit={{ scale: 0 }}
            transition={{
              scale: { type: "spring", stiffness: 500, damping: 30 },
              y: { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8] },
            }}
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-medium rounded-full border-2 border-white z-20"
          >
            {badge}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.2 }}
            className="absolute text-sm font-medium whitespace-nowrap pointer-events-none overflow-hidden"
            style={{
              color: isHovered && !disabled ? "#ffffff" : "#000000",
              right: "16px",
            }}
          >
            {displayText}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isHovered && !disabled && !isLoading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};
