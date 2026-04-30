import { useEffect, useState } from "react";
import {
  getPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  Category,
} from "../services/promptService";
import type { Prompt } from "../services/promptService";
import BackButton from "../components/general/BackButtonAdmin";
import Banner from "../components/general/Banner";
import UsageBadge from "../components/general/UsageBadge";
import SinglePromptModal from "../assets/SinglePrompt";
export default function Prompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("Shampoo");

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [banner, setBanner] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    visible: false,
  });

  // banner auto-hide
  useEffect(() => {
    if (banner.visible) {
      const t = setTimeout(() => {
        setBanner((p) => ({ ...p, visible: false }));
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [banner.visible]);

  // reload helper
  const load = async () => {
    try {
      setLoading(true);
      const data = await getPrompts();
      setPrompts(data);
      setPage(1);
    } catch {
      setBanner({
        message: "Failed to load prompts",
        type: "error",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE LOAD (no React error)
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const data = await getPrompts();
        if (!mounted) return;

        setPrompts(data);
        setPage(1);
      } catch {
        if (!mounted) return;

        setBanner({
          message: "Failed to load prompts",
          type: "error",
          visible: true,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async () => {
    if (!newText.trim()) {
      setBanner({
        message: "Prompt text is required",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      await createPrompt({
        prompt_text: newText,
        category: newCategory,
      });

      setNewText("");
      setNewCategory("Shampoo");

      setBanner({
        message: "Prompt created ✨",
        type: "success",
        visible: true,
      });

      load();
    } catch {
      setBanner({
        message: "Failed to create prompt",
        type: "error",
        visible: true,
      });
    }
  };

  const startEdit = (p: Prompt) => {
    setSelectedPrompt(p);
    setIsModalOpen(true);
  };

  const handleModalSave = async (
    id: string,
    data: { prompt_text: string; category: Category },
  ) => {
    try {
      await updatePrompt(id, data);

      setBanner({
        message: "Prompt updated",
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

  const handleDelete = async (id: string, usedCount?: number) => {
    if (usedCount && usedCount > 0) {
      setBanner({
        message: "Cannot delete: prompt is in use",
        type: "error",
        visible: true,
      });
      return;
    }

    try {
      await deletePrompt(id);

      setBanner({
        message: "Prompt deleted",
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

  // ✅ FIXED pagination (no errors)
  const totalPages = Math.max(1, Math.ceil(prompts.length / ITEMS_PER_PAGE));

  const paginatedPrompts = prompts.slice(
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
                  Prompts
                </h1>
                <p className="text-zinc-500 text-sm mt-1">
                  Manage AI prompt templates
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
              {prompts.length} total
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* CREATE */}
            <div className="xl:col-span-1 relative group h-fit">
              {/* glow border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                <h2 className="text-base font-semibold mb-1">Add Prompt</h2>
                <p className="text-xs text-zinc-500 mb-5">
                  Create a new prompt entry
                </p>

                <div className="flex flex-col gap-3">
                  {/* INPUT */}
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Prompt text"
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-white/20 focus:ring-2 focus:ring-indigo-500/30 transition"
                  />

                  {/* SELECT */}
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none appearance-none focus:border-white/20 focus:ring-2 focus:ring-indigo-500/30 transition"
                  >
                    {Object.values(Category).map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-[#0a0a0b] text-white"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* BUTTON */}
                  <button
                    onClick={handleCreate}
                    className="mt-1 px-4 py-2.5 rounded-xl bg-white text-black font-medium hover:bg-zinc-100 transition"
                  >
                    Add Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* LIST */}
            <div className="xl:col-span-2 relative group">
              {/* glow border */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-indigo-500/20 via-transparent to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                {/* HEADER */}
                <div className="px-6 py-5 border-b border-white/[0.07] flex justify-between">
                  <h2 className="text-base font-semibold">Prompt List</h2>
                  <span className="text-xs text-indigo-400">
                    Page {page} of {totalPages}
                  </span>
                </div>

                {loading ? (
                  <p className="p-6 text-zinc-400">Loading...</p>
                ) : (
                  <div className="divide-y divide-white/[0.07]">
                    {paginatedPrompts.map((p, index) => {
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
                                  (page - 1) * ITEMS_PER_PAGE + index + 1,
                                ).padStart(2, "0")}
                              </span>

                              <p className="font-medium">{p.prompt_text}</p>
                              <UsageBadge count={count} />
                            </div>

                            <p className="text-sm text-indigo-400 pl-8">
                              {p.category}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => startEdit(p)}
                              className="text-sky-400 hover:text-sky-300 transition"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(p.id, p.usedCount)}
                              disabled={count > 0}
                              className={`transition ${
                                count > 0
                                  ? "text-zinc-500 cursor-not-allowed"
                                  : "text-rose-400 hover:text-rose-300"
                              }`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* FOOTER */}
                <div className="px-6 py-4 border-t border-white/[0.07] flex justify-between">
                  <p className="text-sm text-zinc-400">
                    Page {page} of {totalPages}
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
                      disabled={page >= totalPages}
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
        <SinglePromptModal
          prompt={selectedPrompt}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      </div>
    </>
  );
}
