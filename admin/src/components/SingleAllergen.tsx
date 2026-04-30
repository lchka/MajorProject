import { useState } from "react";
import type { Allergen } from "../services/allergenService";

type Props = {
  allergen: Allergen | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
};

export default function SingleAllergenModal({
  allergen,
  isOpen,
  onClose,
  onSave,
}: Props) {
  if (!isOpen || !allergen) return null;

  return (
    <ModalContent
      key={allergen.id}
      allergen={allergen}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ModalContent({
  allergen,
  onClose,
  onSave,
}: {
  allergen: Allergen;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(allergen.name);
  const [desc, setDesc] = useState(allergen.description || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#0a0a0b] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6">

        <h2 className="text-lg font-semibold mb-1">Edit Allergen</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Update allergen details
        </p>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-white/20"
          />

          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-white/20"
          />
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
              onSave(allergen.id, { name, description: desc })
            }
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm hover:bg-zinc-200 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}