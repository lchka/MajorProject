import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../services/userService";
import { getAllergens } from "../services/allergenService";
import type { User } from "../services/userService";
import type { Allergen } from "../services/allergenService";
import LogoutButton from "../components/LogoutButton";

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, allergenData] = await Promise.all([
          getUsers(),
          getAllergens(),
        ]);
        setUsers(userData);
        setAllergens(allergenData);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const activeUsers = users.filter((u) => !u.deletedAt);
  const removedUsers = users.filter((u) => u.deletedAt);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden">

      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-sky-600/6 blur-[100px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400/80 mb-2">
              Admin Console
            </p>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              System overview &amp; quick actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            <LogoutButton />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-zinc-500">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading system data...
          </div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Active Users"
                value={activeUsers.length}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                }
                accent="indigo"
              />
              <StatCard
                title="Removed Users"
                value={removedUsers.length}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                }
                accent="rose"
              />
              <StatCard
                title="Allergens"
                value={allergens.length}
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                }
                accent="amber"
              />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-3 gap-6">

              {/* LEFT - RECENT ALLERGENS */}
              <div className="col-span-2 relative group">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-white">Recent Allergens</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Latest entries in the system</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                      {allergens.length} total
                    </span>
                  </div>

                  <div className="space-y-1">
                    {allergens.slice(0, 5).map((a, i) => (
                      <div
                        key={a.id}
                        className="flex justify-between items-center px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-colors duration-150 group/row"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-zinc-600 w-5 text-right">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white">{a.name}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {a.description || "No description provided"}
                            </p>
                          </div>
                        </div>
                        <svg
                          className="w-3.5 h-3.5 text-zinc-700 group-hover/row:text-zinc-400 transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <Link
  to="/allergens"
  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
>
  View all allergens
</Link>
                  </div>
                </div>
              </div>

              {/* RIGHT - QUICK ACTIONS */}
              <div className="relative group">
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                  <h2 className="text-base font-semibold text-white mb-1">Quick Actions</h2>
                  <p className="text-xs text-zinc-500 mb-5">Jump to a section</p>

                  <div className="flex flex-col gap-2">
                    <QuickAction href="/users" label="Manage Users" primary />
                    <QuickAction href="/allergens" label="Manage Allergens" />
                    <QuickAction href="/conditions" label="Manage Conditions" />
                    <QuickAction href="/preferences" label="Manage Preferences" />
                    <QuickAction  href="/prompts" label="Manage Prompts"/>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    <p className="text-xs text-zinc-600 mb-2">System running normally</p>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Stat Card ── */
const accentMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    icon: "text-indigo-400",
    glow: "from-indigo-500/15",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "text-rose-400",
    glow: "from-rose-500/15",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    glow: "from-amber-500/15",
  },
};

function StatCard({
  title,
  value,
  icon,
  accent = "indigo",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent?: keyof typeof accentMap;
}) {
  const a = accentMap[accent];
  return (
    <div className="relative group cursor-default">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${a.glow} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:bg-white/[0.05] transition-colors duration-200 shadow-[0_16px_32px_rgba(0,0,0,0.3)]">
        <div className="mb-4">
          <div className={`inline-flex p-2.5 rounded-xl ${a.bg} border ${a.border}`}>
            <svg
              className={`w-4 h-4 ${a.icon}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
            >
              {icon}
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight text-white tabular-nums">{value}</p>
        <p className="text-xs text-zinc-500 mt-1 font-medium">{title}</p>
      </div>
    </div>
  );
}

/* ── Quick Action Button ── */
function QuickAction({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      to={href}
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        primary
          ? "bg-white text-black hover:bg-zinc-100"
          : "bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}