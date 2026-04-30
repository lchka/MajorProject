import { useState } from "react";
import type { Condition } from "../services/conditionService";

type Props = {
  condition: Condition | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
};

export default function SingleConditionModal({
  condition,
  isOpen,
  onClose,
  onSave,
}: Props) {
  if (!isOpen || !condition) return null;

  return (
    <ModalContent
      key={condition.id}
      condition={condition}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ModalContent({
  condition,
  onClose,
  onSave,
}: {
  condition: Condition;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(condition.name);
  const [desc, setDesc] = useState(condition.description || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#0a0a0b] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6">

        <h2 className="text-lg font-semibold mb-1 text-white">
          Edit Condition
        </h2>
        <p className="text-xs text-zinc-500 mb-5">
          Update condition details
        </p>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-white/20"
          />

          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 outline-none focus:border-white/20"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave(condition.id, { name, description: desc })
            }
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}