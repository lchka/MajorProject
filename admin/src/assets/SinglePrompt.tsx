import { useState } from "react";
import type { Prompt, Category } from "../services/promptService";
import { Category as CategoryValues } from "../services/promptService";

type Props = {
  prompt: Prompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    id: string,
    data: { prompt_text: string; category: Category }
  ) => void;
};

export default function SinglePromptModal({
  prompt,
  isOpen,
  onClose,
  onSave,
}: Props) {
  if (!isOpen || !prompt) return null;

  return (
    <ModalContent
      key={prompt.id}
      prompt={prompt}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ModalContent({
  prompt,
  onClose,
  onSave,
}: {
  prompt: Prompt;
  onClose: () => void;
  onSave: (
    id: string,
    data: { prompt_text: string; category: Category }
  ) => void;
}) {
  const [text, setText] = useState(prompt.prompt_text);
  const [category, setCategory] = useState<Category>(prompt.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#0a0a0b] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6">

        <h2 className="text-lg font-semibold mb-1">Edit Prompt</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Update prompt details
        </p>

        <div className="flex flex-col gap-3">

          {/* TEXT */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none resize-none focus:border-white/20"
          />

          {/* CATEGORY DROPDOWN */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-white/20 appearance-none"
          >
            {Object.values(CategoryValues).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave(prompt.id, {
                prompt_text: text,
                category,
              })
            }
            disabled={!text.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm hover:bg-zinc-200 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}