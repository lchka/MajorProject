import { useEffect, useState } from "react";
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

    load();
  }, []);

  const activeUsers = users.filter((u) => !u.deletedAt);
  const removedUsers = users.filter((u) => u.deletedAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
     {/* HEADER */}
<div className="flex items-start justify-between mb-8">
  
  {/* LEFT */}
  <div>
    <h1 className="text-3xl font-semibold tracking-tight">
      Dashboard
    </h1>
    <p className="text-zinc-400 text-sm">
      Overview of your system
    </p>
  </div>

  {/* RIGHT */}
  <LogoutButton />
</div>

        {loading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatCard title="Active Users" value={activeUsers.length} />
              <StatCard title="Removed Users" value={removedUsers.length} />
              <StatCard title="Allergens" value={allergens.length} />
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-3 gap-6">
              
              {/* LEFT - RECENT ALLERGENS */}
              <div className="col-span-2 bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <h2 className="text-lg mb-4">Recent Allergens</h2>

                {allergens.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between items-center py-2 border-b border-white/10 last:border-none"
                  >
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-zinc-400">
                        {a.description || "No description"}
                      </p>
                    </div>
                  </div>
                ))}

                <a
                  href="/allergens"
                  className="text-sm text-blue-400 mt-4 inline-block hover:underline"
                >
                  View all →
                </a>
              </div>

              {/* RIGHT - QUICK ACTIONS */}
              <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <h2 className="text-lg mb-4">Quick Actions</h2>

                <div className="flex flex-col gap-3">
                  <a
                    href="/users"
                    className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                  >
                    Manage Users
                  </a>

                  <a
                    href="/allergens"
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Manage Allergens
                  </a>

                  <a
                    href="/conditions"
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Manage Conditions
                  </a>

                  <a
                    href="/preferences"
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition"
                  >
                    Manage Preferences
                  </a>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* 🔹 Stat Card */
function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl p-4 hover:bg-white/[0.06] hover:scale-[1.02] transition-all duration-200 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
      <p className="text-zinc-400 text-sm">{title}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}