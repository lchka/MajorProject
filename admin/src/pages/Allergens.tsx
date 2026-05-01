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
import UsageBadge from "../components/general/UsageBadge";
import SingleAllergenModal from "../components/SingleAllergen";
//page component for managing allergens, with a list of existing allergens and a form to create new ones, and modals for editing existing allergens
export default function Allergens() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [selectedAllergen, setSelectedAllergen] = useState<Allergen | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
//state for showing a banner message after actions like create/update/delete, with auto-hide after 2 seconds
  const [banner, setBanner] = useState<{
    message: string;
    type: "success" | "error" | "info";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });
//auto-hide the banner after 2 seconds when it becomes visible
  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((prev) => ({ ...prev, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);
// function to load allergens from the server and update state, used on initial load and after create/update/delete actions
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
//load allergens on initial component mount
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        const data = await getAllergens();

        if (!mounted) return;

        setAllergens(data);
        setPage(1);
      } catch {
        if (!mounted) return;

        setBanner({
          message: "Failed to load allergens",
          type: "error",
          visible: true,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };
//run the load function to fetch allergens when the component mounts
    run();

    return () => {
      mounted = false;
    };
  }, []);
//handler for creating a new allergen, with validation and showing success/error banners, and reloading the list after creation
  const handleCreate = async () => {
    if (!newName.trim()) {
      setBanner({
        message: "Name is required",
        type: "error",
        visible: true,
      });
      return;
    }
//trying to create the allergen using the service function, and showing appropriate banners based on success or failure, and reloading the list on success
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
//handler for starting the edit process by setting the selected allergen and opening the modal
  const startEdit = (a: Allergen) => {
    setSelectedAllergen(a);
    setIsModalOpen(true);
  };

  const handleModalSave = async (
    id: string,
    data: { name: string; description: string },
  ) => {
    try {
      await updateAllergen(id, data);

      setBanner({
        message: "Allergen updated",
        type: "success",
        visible: true,
      });

      setIsModalOpen(false);
      load();
    } catch {
      setBanner({
        message: "Update failed",
        type: "error",
        visible: true,
      });
    }
  };
//handler for deleting an allergen, with a check for whether it's in use, showing appropriate banners, and reloading the list on success
  const handleDelete = async (id: string, usedCount?: number) => {
    if (usedCount && usedCount > 0) {
      setBanner({
        message: "Cannot delete: allergen is in use",
        type: "error",
        visible: true,
      });
      return;
    }

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
//pagination logic to determine which allergens to show on the current page, and total pages for the footer
  const totalPages = Math.ceil(allergens.length / ITEMS_PER_PAGE);

  const paginatedAllergens = allergens.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <>
    {/* banner component to show success/error/info messages after actions, with auto-hide functionality */}
      <Banner
        message={banner.message}
        type={banner.type}
        isVisible={banner.visible}
      />

      <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-violet-600/8 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-sky-600/6 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-10">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <BackButton />
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-indigo-400/80 mb-2">
                  Data Management
                </p>
                <h1 className="text-4xl font-bold">Allergens</h1>
                <p className="text-zinc-500 text-sm mt-1">
                  Manage allergen data
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              {allergens.length} total
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* CREATE */}
            <div className="xl:col-span-1 relative group h-fit">
              {/* glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                <h2 className="text-base font-semibold mb-1">
                  Add New Allergen
                </h2>
                <p className="text-xs text-zinc-500 mb-5">
                  Create a new allergen entry
                </p>

                <div className="flex flex-col gap-3">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-indigo-500/30 transition"
                  />

                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-indigo-500/30 transition"
                  />

                  <button
                    onClick={handleCreate}
                    className="mt-1 px-4 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-zinc-100 transition"
                  >
                    Add Allergen
                  </button>
                </div>
              </div>
            </div>

            {/* LIST */}
            <div className="xl:col-span-2 relative group">
              {/* glow */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                <div className="px-6 py-5 border-b border-white/[0.07] flex justify-between">
                  <h2 className="text-base font-semibold">Allergen List</h2>
                  <span className="text-xs text-indigo-400">
                    Page {page} of {totalPages || 1}
                  </span>
                </div>

                {loading ? (
                  <p className="p-6 text-zinc-400">Loading...</p>
                ) : (
                  <div className="divide-y divide-white/[0.07]">
                    {paginatedAllergens.map((a, index) => (
                      <div
                        key={a.id}
                        className="flex justify-between px-6 py-4 hover:bg-white/[0.02]"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-600 w-5 text-right">
                              {String(
                                (page - 1) * ITEMS_PER_PAGE + index + 1,
                              ).padStart(2, "0")}
                            </span>

                            <p className="font-medium">{a.name}</p>
                            <UsageBadge count={a.usedCount} />
                          </div>

                          <p className="text-sm text-zinc-400 pl-8">
                            {a.description || "No description"}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => startEdit(a)}
                            className="text-sky-400 hover:text-sky-300 transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDelete(a.id, a.usedCount)}
                            disabled={!!a.usedCount && a.usedCount > 0}
                            className={`transition ${
                              a.usedCount && a.usedCount > 0
                                ? "text-zinc-500 cursor-not-allowed"
                                : "text-rose-400 hover:text-rose-300"
                            }`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-white/[0.07] flex justify-between">
                  <p className="text-sm text-zinc-400">
                    Page {page} of {totalPages || 1}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </button>

                    <button
                      onClick={() =>
                        setPage((p) => Math.min(p + 1, totalPages))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL */}
        <SingleAllergenModal
          allergen={selectedAllergen}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      </div>
    </>
  );
}
