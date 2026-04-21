import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DietaryTag = "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "none";

interface PrefsState {
  favoriteCategories: string[];
  dietaryTags: DietaryTag[];
  recentlyViewed: string[];         // product IDs
  toggleCategory: (cat: string) => void;
  toggleDietaryTag: (tag: DietaryTag) => void;
  addRecentView: (productId: string) => void;
  clearRecent: () => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      favoriteCategories: [],
      dietaryTags: [],
      recentlyViewed: [],

      toggleCategory: (cat) => {
        const current = get().favoriteCategories;
        set({
          favoriteCategories: current.includes(cat)
            ? current.filter((c) => c !== cat)
            : [...current, cat],
        });
      },

      toggleDietaryTag: (tag) => {
        const current = get().dietaryTags;
        set({
          dietaryTags: current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag],
        });
      },

      addRecentView: (productId) => {
        const current = get().recentlyViewed.filter((id) => id !== productId);
        set({ recentlyViewed: [productId, ...current].slice(0, 20) });
      },

      clearRecent: () => set({ recentlyViewed: [] }),
    }),
    { name: "smartcart-prefs" }
  )
);
