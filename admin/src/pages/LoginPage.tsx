import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import axios from "axios";
import { motion } from "framer-motion";
import AnimatedInput from "../components/AnimatedInput";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const { token } = res.data;

      if (!token) {
        setError("No token received");
        return;
      }

      localStorage.setItem("token", token);
      navigate("/dashboard");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-[340px] p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl space-y-4"
      >
        <h2 className="text-white text-xl font-semibold text-center">
          Admin Login
        </h2>

        <p className="text-zinc-400 text-sm text-center">
          Sign in to manage your app
        </p>

        <AnimatedInput
          type="email"
          placeholder="Email"
          value={email}
          onChange={setEmail}
          error={!!error && !email}
        />

        <AnimatedInput
          type="password"
          placeholder="Password"
          value={password}
          onChange={setPassword}
          error={!!error && !password}
        />

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </motion.button>
      </motion.form>
    </div>
  );
}