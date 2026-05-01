import { motion } from "framer-motion";

type Props = {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};
//animated input component that scales up slightly on focus and shakes if there is an error
export default function AnimatedInput({
  type = "text",
  placeholder,
  value,
  onChange,
  error,
}: Props) {
  return (
    //motion input that scales up on focus and shakes if there is an error, with a transparent background and white text
    <motion.input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      whileFocus={{ scale: 1.02 }}
      animate={error ? { x: [0, -6, 6, -6, 0] } : { x: 0 }}
      autoComplete={
        type === "password" ? "current-password" : "email"
      }
      //styles for the input with a red text color if there is an error
      className={`
        w-full
        bg-transparent
        px-4 py-3
        text-white
        placeholder:text-zinc-400
        outline-none
        appearance-none
        ${error ? "text-red-300" : ""}
      `}
    />
  );
}