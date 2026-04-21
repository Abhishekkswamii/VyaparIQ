import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, X, Check } from "lucide-react";
import { useFamilyStore } from "@/store/family-store";

export default function FamilyPanel() {
  const enabled = useFamilyStore((s) => s.enabled);
  const members = useFamilyStore((s) => s.members);
  const activeMemberId = useFamilyStore((s) => s.activeMemberId);
  const toggleFamily = useFamilyStore((s) => s.toggleFamily);
  const addMember = useFamilyStore((s) => s.addMember);
  const removeMember = useFamilyStore((s) => s.removeMember);
  const setActive = useFamilyStore((s) => s.setActiveMember);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (newName.trim()) {
      addMember(newName.trim());
      setNewName("");
      setAdding(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-orange-500" />
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
            Family Mode
          </span>
        </div>
        <button
          onClick={toggleFamily}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-orange-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 20 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          />
        </button>
      </div>

      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
              Tap a member to shop as them
            </p>

            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActive(m.id)}
                  className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    activeMemberId === m.id
                      ? "bg-orange-100 text-orange-700 ring-2 ring-orange-400 dark:bg-orange-500/20 dark:text-orange-300"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{m.avatar}</span>
                  <span>{m.name}</span>
                  {activeMemberId === m.id && (
                    <Check size={10} className="text-orange-600" />
                  )}
                  {m.id !== "me" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMember(m.id);
                      }}
                      className="ml-0.5 hidden rounded-full p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-500 group-hover:block dark:hover:bg-red-900/30"
                    >
                      <X size={10} />
                    </button>
                  )}
                </button>
              ))}

              {/* Add member */}
              {!adding ? (
                <button
                  onClick={() => setAdding(true)}
                  className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-orange-300 hover:text-orange-500 dark:border-gray-600 dark:text-gray-500 dark:hover:border-orange-600"
                >
                  <Plus size={11} />
                  Add
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder="Name"
                    className="w-24 rounded-full border border-gray-200 px-2.5 py-1 text-xs outline-none focus:border-orange-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleAdd}
                    className="rounded-full bg-orange-500 p-1 text-white"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewName("");
                    }}
                    className="rounded-full p-1 text-gray-400 hover:text-red-500"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
