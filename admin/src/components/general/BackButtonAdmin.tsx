import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

//back button component with a glow effect and an arrow that moves slightly on hover
export default function BackButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(-1)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex items-center gap-3 px-4 py-2 rounded-xl 
                 bg-white/5 backdrop-blur-md border border-white/10
                 shadow-[0_0_0_0_rgba(255,255,255,0.1)]
                 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]
                 transition-all duration-300"
    >
      {/* Glow background */}
      <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition" />

      {/* Arrow */}
      <motion.span
        initial={{ x: 0 }}
        whileHover={{ x: -4 }}
        className="text-lg"
      >
        ←
      </motion.span>

      {/* Text */}
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition">
        Back
      </span>
    </motion.button>
  );
}