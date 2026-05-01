import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

//banner component that shows a message at the top of the screen with an icon and a progress bar that disappears after 2 seconds
type BannerProps = {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
};

export default function Banner({
  message,
  type = "info",
  isVisible,

}: BannerProps) {
  //styles for different types of banners
  const styles = {
    success: {
      color: "text-green-300",
      border: "border-green-400/30",
      bg: "bg-green-500/10",
      glow: "shadow-green-500/20",
      icon: <CheckCircle size={18} />,
    },
    //error banner with red colors and an alert icon
    error: {
      color: "text-red-300",
      border: "border-red-400/30",
      bg: "bg-red-500/10",
      glow: "shadow-red-500/20",
      icon: <AlertCircle size={18} />,
    },
    //info banner with blue colors and an info icon
    info: {
      color: "text-blue-300",
      border: "border-blue-400/30",
      bg: "bg-blue-500/10",
      glow: "shadow-blue-500/20",
      icon: <Info size={18} />,
    },
  };

  const current = styles[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`
            fixed top-6 left-1/2 -translate-x-1/2
            px-5 py-3 rounded-xl border
            backdrop-blur-md
            flex items-center gap-3
            min-w-[260px] max-w-[420px]
            shadow-xl ${current.glow}
            ${current.bg} ${current.border} ${current.color}
            z-50
          `}
        >
          {/* ICON */}
          <div className="opacity-90">{current.icon}</div>

          {/* MESSAGE */}
          <p className="text-sm font-medium">{message}</p>

          {/* PROGRESS BAR */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 2, ease: "linear" }}
            className="absolute bottom-0 left-0 h-[2px] bg-white/40 rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}