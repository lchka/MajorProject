import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import axios from "axios";
import { motion } from "framer-motion";
import AnimatedInput from "../components/AnimatedInput";
import lumiereLogo from "../assets/main.png";
import Banner from "../components/general/Banner";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [banner, setBanner] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  // auto-hide banner
  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setBanner({
        message: "Please fill in all fields",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const { token } = res.data;

      if (!token) {
        setBanner({
          message: "No token received",
          type: "error",
          visible: true,
        });
        return;
      }

      localStorage.setItem("token", token);

      // ✅ SUCCESS BANNER
      setBanner({
        message: "Login successful ✨",
        type: "success",
        visible: true,
      });

      // delay so user sees it
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setBanner({
          message: err.response?.data?.message || "Login failed",
          type: "error",
          visible: true,
        });
      } else {
        setBanner({
          message: "Login failed",
          type: "error",
          visible: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔔 BANNER */}
      <Banner
        message={banner.message}
        type={banner.type}
        isVisible={banner.visible}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6">
        
        {/* MAIN CONTAINER */}
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          
          {/* LEFT SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col justify-center items-start"
          >
            <img
              src={lumiereLogo}
              alt="Lumiere"
              className="w-84 mb-6 -ml-[80px]" // 👈 untouched as requested
            />

            <h1 className="text-4xl font-semibold mb-4 leading-tight">
              Lumiere Admin
            </h1>

            <p className="text-zinc-400 max-w-sm">
              Manage users, allergens, conditions and system data in one place.
            </p>
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.form
            onSubmit={handleLogin}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto p-8 rounded-2xl 
                       bg-white/[0.05] backdrop-blur-xl 
                       border border-white/[0.08] 
                       shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                       space-y-5"
          >
            {/* MOBILE LOGO */}
            <div className="md:hidden flex justify-center">
              <img src={lumiereLogo} className="w-20 mb-2" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold">Welcome back</h2>
              <p className="text-zinc-400 text-sm">
                Sign in to your admin panel
              </p>
            </div>

            {/* INPUTS */}
            <div className="space-y-3">
              
              <div className="bg-white/10 rounded-lg border border-white/10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 transition">
                <AnimatedInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={setEmail}
                  error={false}
                />
              </div>

              <div className="bg-white/10 rounded-lg border border-white/10 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 transition">
                <AnimatedInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  error={false}
                />
              </div>

            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              disabled={loading}
              className="w-full py-3 rounded-xl 
                         bg-gradient-to-r from-indigo-500 to-purple-500 
                         text-white font-medium 
                         hover:opacity-90 transition
                         shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>  

            <p className="text-xs text-center text-zinc-500 pt-2">
              © Lumiere {new Date().getFullYear()}
            </p>
          </motion.form>

        </div>
      </div>
    </>
  );
}