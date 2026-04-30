import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="group flex items-center gap-2 px-4 py-2 rounded-xl
                 bg-white/[0.04] border border-white/[0.08]
                 backdrop-blur-sm
                 hover:bg-red-500/10 hover:border-red-500/30
                 hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]
                 transition-all duration-200"
    >
      {/* Icon */}
      <span className="text-sm transition group-hover:-translate-x-0.5">
        ←
      </span>

      {/* Text */}
      <span className="text-sm text-white/80 group-hover:text-white">
        Logout
      </span>
    </button>
  );
}