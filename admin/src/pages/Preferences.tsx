import { useEffect, useState } from "react";
import {
  getPreferences,
  createPreference,
  deletePreference,
  updatePreference,
} from "../services/preferenceService";
import type { Preference } from "../services/preferenceService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";
import UsageBadge from "../components/general/UsageBadge";
import SinglePreferenceModal from "../components/SinglePreference";
// page for managing preferences, with a list of existing preferences and a form to create new ones, and a modal for editing existing preferences
export default function Preferences() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
// state for the currently selected preference for editing, and whether the edit modal is open
  const [selectedPreference, setSelectedPreference] = useState<Preference | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
// pagination state
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [banner, setBanner] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    visible: false,
  });

  // auto-hide banner after 2 seconds
  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((p) => ({ ...p, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);
//  function to load preferences from the API and handle loading state and errors, used on initial load and after create/update/delete actions
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
  // initial load of preferences on component mount, with a mounted flag to prevent state updates if the component unmounts before the API call completes
useEffect(() => {
  let mounted = true;

  const fetchData = async () => {
    try {
      const data = await getPreferences();
      if (!mounted) return;

      setPreferences(data);
      setPage(1);
    } catch {
      if (!mounted) return;

      setBanner({
        message: "Failed to load preferences",
        type: "error",
        visible: true,
      });
    } finally {
      if (mounted) setLoading(false);
    }
  };
// call the fetchData function to load preferences when the component mounts
  fetchData();

  return () => {
    mounted = false;
  };
}, []);
// function to handle creating a new preference, with validation and API call, and show appropriate banners for success or error cases, and reload the preferences list on success
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
// function to start editing a preference by setting the selected preference and opening the modal
  const startEdit = (p: Preference) => {
    setSelectedPreference(p);
    setIsModalOpen(true);
  };
//  function to handle saving changes from the edit modal, with an API call to update the preference, and show appropriate banners for success or error cases, and reload the preferences list on success
  const handleModalSave = async (
    id: string,
    data: { name: string; description: string }
  ) => {
    try {
      await updatePreference(id, data);

      setBanner({
        message: "Preference updated",
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
// function to handle deleting a preference, with a check for whether the preference is in use (based on the usedCount), and show appropriate banners for success or error cases, and reload the preferences list on success
  const handleDelete = async (id: string, usedCount: number) => {
    if (usedCount > 0) {
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
// calculate total pages for pagination and get the preferences to display on the current page
  const totalPages = Math.ceil(preferences.length / ITEMS_PER_PAGE);

  const paginated = preferences.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <>
    {/* BANNER */}
      <Banner
        message={banner.message}
        type={banner.type}
        isVisible={banner.visible}
      />

      <div className="min-h-screen bg-[#0a0a0b] text-white relative overflow-hidden">

        {/* Background FX */}
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
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                  Preferences
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                  Manage preference data
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              {preferences.length} total
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* CREATE PANEL */}
            <div className="xl:col-span-1 relative group h-fit">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                <h2 className="text-base font-semibold mb-1">Add Preference</h2>
                <p className="text-xs text-zinc-500 mb-5">
                  Create a new preference entry
                </p>

                <div className="flex flex-col gap-3">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Name"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none"
                  />

                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none"
                  />

                  <button
                    onClick={handleCreate}
                    className="mt-1 px-4 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-zinc-100 transition"
                  >
                    Add Preference
                  </button>
                </div>
              </div>
            </div>

            {/* LIST PANEL */}
            <div className="xl:col-span-2 relative group">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)]">

                <div className="px-6 py-5 border-b border-white/[0.07] flex justify-between">
                  <h2 className="text-base font-semibold">Preference List</h2>
                  <span className="text-xs text-indigo-400">
                    Page {page} of {totalPages || 1}
                  </span>
                </div>

                {loading ? (
                  <p className="p-6 text-zinc-400">Loading...</p>
                ) : (
                  <div className="divide-y divide-white/[0.07]">
                    {paginated.map((p, index) => {
                      const count = p.usedCount ?? 0;

                      return (
                        <div
                          key={p.id}
                          className="flex justify-between px-6 py-4 hover:bg-white/[0.02]"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-600 w-5 text-right">
                                {String(
                                  (page - 1) * ITEMS_PER_PAGE + index + 1
                                ).padStart(2, "0")}
                              </span>

                              <p className="font-medium">{p.name}</p>
                              <UsageBadge count={count} />
                            </div>

                            <p className="text-sm text-zinc-400 pl-8">
                              {p.description || "No description"}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(p)}
                              className="text-sky-400 hover:text-sky-300"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(p.id, count)}
                              className={
                                count > 0
                                  ? "text-zinc-500 cursor-not-allowed"
                                  : "text-rose-400 hover:text-rose-300"
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="px-6 py-4 border-t border-white/[0.07] flex justify-between">
                  <p className="text-sm text-zinc-400">
                    Page {page} of {totalPages || 1}
                  </p>

                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                      Prev
                    </button>
                    <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                      Next
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* MODAL */}
        <SinglePreferenceModal
          preference={selectedPreference}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      </div>
    </>
  );
}