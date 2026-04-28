import { useEffect, useState } from "react";
import {
  getAllergens,
  createAllergen,
  updateAllergen,
  deleteAllergen,
} from "../services/allergenService";
import type { Allergen } from "../services/allergenService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";

export default function Allergens() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 🔔 Banner state
  const [banner, setBanner] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  // auto hide
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
      const data = await getAllergens();
      setAllergens(data);
      setPage(1);
    } catch {
      setBanner({
        message: "Failed to load allergens",
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
      await createAllergen({
        name: newName,
        description: newDesc,
      });

      setNewName("");
      setNewDesc("");

      setBanner({
        message: "Allergen created ✨",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Failed to create allergen",
        type: "error",
        visible: true,
      });
    }
  };

  const startEdit = (a: Allergen) => {
    setEditingId(a.id);
    setEditName(a.name);
    setEditDesc(a.description || "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      await updateAllergen(editingId, {
        name: editName,
        description: editDesc,
      });

      setEditingId(null);

      setBanner({
        message: "Allergen updated",
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

  const handleDelete = async (id: string) => {
    try {
      await deleteAllergen(id);

      setBanner({
        message: "Allergen deleted",
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

  const totalPages = Math.ceil(allergens.length / ITEMS_PER_PAGE);

  const paginatedAllergens = allergens.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <>
      {/* 🔔 Banner */}
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
                  Allergens
                </h1>
                <p className="text-zinc-400 text-sm">
                  Manage allergen data
                </p>
              </div>
            </div>
          </div>

          {/* CREATE */}
          <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm rounded-xl p-5 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <h2 className="text-sm text-zinc-400 mb-4">Add New Allergen</h2>

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
                {paginatedAllergens.length === 0 ? (
                  <p className="p-4 text-zinc-400 text-sm">
                    No allergens yet.
                  </p>
                ) : (
                  paginatedAllergens.map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between items-center px-4 py-4 border-b border-white/10 last:border-none"
                    >
                      {editingId === a.id ? (
                        <div className="flex gap-3 flex-1">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 flex-1"
                          />
                          <input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 flex-1"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">{a.name}</p>
                          <p className="text-sm text-zinc-400">
                            {a.description || "No description"}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 ml-4">
                        {editingId === a.id ? (
                          <>
                            <button
                              onClick={handleUpdate}
                              className="text-green-400 hover:text-green-300 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-zinc-400 hover:text-white text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(a)}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(a.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
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