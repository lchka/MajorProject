import { useEffect, useState } from "react";
import {
  getConditions,
  createCondition,
  updateCondition,
  deleteCondition,
} from "../services/conditionService";
import type { Condition } from "../services/conditionService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";
import UsageBadge from "../components/general/UsageBadge";

export default function Conditions() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [banner, setBanner] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    visible: false,
  });

  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getConditions();
      setConditions(data);
      setPage(1);
    } catch {
      setBanner({
        message: "Failed to load conditions",
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
      await createCondition({
        name: newName,
        description: newDesc,
      });

      setNewName("");
      setNewDesc("");

      setBanner({
        message: "Condition created ✨",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Failed to create condition",
        type: "error",
        visible: true,
      });
    }
  };

  const startEdit = (c: Condition) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditDesc(c.description || "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      await updateCondition(editingId, {
        name: editName,
        description: editDesc,
      });

      setEditingId(null);

      setBanner({
        message: "Condition updated",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Update failed",
        type: "error",
        visible: true,
      });
    }
  };

  const handleDelete = async (id: string, usedCount?: number) => {
    if (usedCount && usedCount > 0) {
      setBanner({
        message: "Cannot delete: condition is in use",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      await deleteCondition(id);

      setBanner({
        message: "Condition deleted",
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

  const totalPages = Math.ceil(conditions.length / ITEMS_PER_PAGE);

  const paginatedConditions = conditions.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <>
      <Banner
        message={banner.message}
        type={banner.type}
        isVisible={banner.visible}
      />

      <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden">
        {/* BACKGROUND FX */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-violet-600/8 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-sky-600/6 blur-[100px]" />
        </div>

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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400/80 mb-2">
                  Data Management
                </p>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                  Conditions
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                  Manage condition data
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              {conditions.length} total
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* CREATE */}
            <div className="xl:col-span-1 relative group h-fit">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 backdrop-blur-sm">
                <h2 className="text-base font-semibold mb-1">Add Condition</h2>
                <p className="text-xs text-zinc-500 mb-5">Create a new entry</p>

                <div className="flex flex-col gap-3">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />

                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />

                  <button
                    onClick={handleCreate}
                    className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-100"
                  >
                    Add Condition
                  </button>
                </div>
              </div>
            </div>

            {/* LIST */}
            <div className="xl:col-span-2 relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-white/[0.07] flex justify-between">
                  <h2 className="text-base font-semibold">Condition List</h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    Page {page} of {totalPages || 1}
                  </span>
                </div>

                {loading ? (
                  <p className="p-6 text-zinc-400">Loading...</p>
                ) : (
                  <div className="divide-y divide-white/[0.07]">
                    {paginatedConditions.map((c, index) => (
                      <div
                        key={c.id}
                        className="flex justify-between px-6 py-4 hover:bg-white/[0.02]"
                      >
                        {editingId === c.id ? (
                          <div className="flex gap-3 flex-1">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input"
                            />
                            <input
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              className="input"
                            />
                          </div>
                        ) : (
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-600 w-5 text-right">
                                {String(
                                  (page - 1) * ITEMS_PER_PAGE + index + 1,
                                ).padStart(2, "0")}
                              </span>
                              <p>{c.name}</p>
                              <UsageBadge count={c.usedCount} />
                            </div>
                            <p className="text-sm text-zinc-400 pl-8">
                              {c.description}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {editingId === c.id ? (
                            <>
                              <button onClick={handleUpdate}>Save</button>
                              <button onClick={() => setEditingId(null)}>
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(c)}>Edit</button>
                              <button
                                onClick={() => handleDelete(c.id, c.usedCount)}
                                disabled={!!c.usedCount && c.usedCount > 0}
                                className={`text-sm transition ${
                                  c.usedCount && c.usedCount > 0
                                    ? "text-zinc-500 cursor-not-allowed"
                                    : "text-rose-400 hover:text-rose-300"
                                }`}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
