import { motion } from "framer-motion";

type Props = {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export default function AnimatedInput({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}: Props) {
  return (
    <motion.input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      whileFocus={{ scale: 1.05 }}
      animate={
        error
          ? { x: [0, -6, 6, -6, 0] } // shake on error
          : { x: 0 }
      }
      style={{
        width: "100%",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "6px",
        border: error ? "2px solid red" : "1px solid #ccc",
        outline: "none",
      }}
    />
  );
}