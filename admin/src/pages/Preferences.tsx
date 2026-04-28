import { useEffect, useState } from "react";
import {
  getPreferences,
  createPreference,
  deletePreference,
} from "../services/preferenceService";
import type { Preference } from "../services/preferenceService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";
import UsageBadge from "../components/general/UsageBadge";

export default function Preferences() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [banner, setBanner] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  // auto hide banner
  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((p) => ({ ...p, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getPreferences();
      setPreferences(data);
      setPage(1);
    } catch {
      setBanner({
        message: "Failed to load preferences",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await load();
    };
    void run();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setBanner({
        message: "Name is required",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      await createPreference({
        name: newName,
        description: newDesc,
      });

      setNewName("");
      setNewDesc("");

      setBanner({
        message: "Preference created ✨",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Failed to create preference",
        type: "error",
        visible: true,
      });
    }
  };

  const handleDelete = async (id: string, usedCount?: number) => {
    if (usedCount && usedCount > 0) {
      setBanner({
        message: "Cannot delete: preference is in use",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      await deletePreference(id);

      setBanner({
        message: "Preference deleted",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Delete failed",
        type: "error",
        visible: true,
      });
    }
  };

  const totalPages = Math.ceil(preferences.length / ITEMS_PER_PAGE);

  const paginated = preferences.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <>
      <Banner
        message={banner.message}
        type={banner.type}
        isVisible={banner.visible}
      />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="max-w-5xl mx-auto px-6 py-8">

          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Preferences
                </h1>
                <p className="text-zinc-400 text-sm">
                  Manage preference data
                </p>
              </div>
            </div>
          </div>

          {/* CREATE */}
          <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl p-5 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <h2 className="text-sm text-zinc-400 mb-4">Add New Preference</h2>

            <div className="flex gap-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 flex-1 outline-none focus:border-white/20"
              />

              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description"
                className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 flex-1 outline-none focus:border-white/20"
              />

              <button
                onClick={handleCreate}
                className="px-4 rounded-lg bg-white text-black font-medium hover:opacity-90 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <p className="text-zinc-400">Loading...</p>
          ) : (
            <>
              <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                {paginated.length === 0 ? (
                  <p className="p-4 text-zinc-400 text-sm">
                    No preferences yet.
                  </p>
                ) : (
                  paginated.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-start px-4 py-4 border-b border-white/10 last:border-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{p.name}</p>
                          <UsageBadge count={p.usedCount} />
                        </div>

                        <p className="text-sm text-zinc-400">
                          {p.description || "No description"}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-3 ml-4">
                        <button
                          onClick={() => handleDelete(p.id, p.usedCount)}
                          className={`text-sm ${
                            p.usedCount && p.usedCount > 0
                              ? "text-zinc-500 cursor-not-allowed"
                              : "text-red-400 hover:text-red-300"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* PAGINATION */}
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-zinc-400">
                  Page {page} of {totalPages || 1}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-30 transition"
                  >
                    Prev
                  </button>

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={page === totalPages || totalPages === 0}
                    className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-30 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}