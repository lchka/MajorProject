import { useState } from "react";
import type { Preference } from "../services/preferenceService";
//modal component for editing a single preference, with inputs for name and description, and save/cancel buttons
type Props = {
  preference: Preference | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
};
//renders the modal content with the preference data and handlers for closing and saving
export default function SinglePreferenceModal({
  preference,
  isOpen,
  onClose,
  onSave,
}: Props) {
  if (!isOpen || !preference) return null;

  return (
    <ModalContent
      key={preference.id}
      preference={preference}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
//separate component for the modal content to handle local state for the inputs
function ModalContent({
  preference,
  onClose,
  onSave,
}: {
  preference: Preference;
  onClose: () => void;
  onSave: (id: string, data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(preference.name);
  const [desc, setDesc] = useState(preference.description || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[#0a0a0b] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)] p-6">

        <h2 className="text-lg font-semibold mb-1">Edit Preference</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Update preference details
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
            className="text-sm text-zinc-400 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave(preference.id, { name, description: desc })
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