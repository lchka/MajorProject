type UsageBadgeProps = {
  count?: number;
};
//usage badge component that shows the number of items in use with a glow effect and a border
export default function UsageBadge({ count }: UsageBadgeProps) {
  if (!count || count === 0) return null;

  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full 
                 bg-amber-500/10 text-amber-300 
                 border border-amber-400/20
                 font-medium tracking-wide"
    >
      In use ({count})
    </span>
  );
}