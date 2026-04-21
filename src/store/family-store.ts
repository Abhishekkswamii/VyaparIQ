import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FamilyMember {
  id: string;
  name: string;
  avatar: string;   // emoji or initials
  color: string;     // tailwind ring color
}

const DEFAULT_MEMBERS: FamilyMember[] = [
  { id: "me", name: "Me", avatar: "🧑", color: "ring-orange-400" },
];

interface FamilyState {
  enabled: boolean;
  members: FamilyMember[];
  activeMemberId: string;
  toggleFamily: () => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  setActiveMember: (id: string) => void;
}

const AVATARS = ["👩", "👨", "👧", "👦", "🧓", "👶"];
const COLORS = [
  "ring-blue-400",
  "ring-green-400",
  "ring-purple-400",
  "ring-pink-400",
  "ring-cyan-400",
  "ring-amber-400",
];

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, get) => ({
      enabled: false,
      members: DEFAULT_MEMBERS,
      activeMemberId: "me",

      toggleFamily: () => {
        const next = !get().enabled;
        set({
          enabled: next,
          members: next ? get().members : DEFAULT_MEMBERS,
          activeMemberId: "me",
        });
      },

      addMember: (name: string) => {
        const members = get().members;
        const idx = members.length - 1;
        const newMember: FamilyMember = {
          id: `member-${Date.now()}`,
          name,
          avatar: AVATARS[idx % AVATARS.length],
          color: COLORS[idx % COLORS.length],
        };
        set({ members: [...members, newMember] });
      },

      removeMember: (id: string) => {
        if (id === "me") return;
        const members = get().members.filter((m) => m.id !== id);
        set({
          members,
          activeMemberId:
            get().activeMemberId === id ? "me" : get().activeMemberId,
        });
      },

      setActiveMember: (id: string) => set({ activeMemberId: id }),
    }),
    { name: "smartcart-family" }
  )
);
