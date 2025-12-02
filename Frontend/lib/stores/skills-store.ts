import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Skill {
  id: string
  name: string
  category: string
  proficiency: number
  yearsOfExperience?: number
  lastUsed?: string
}

interface SkillsState {
  skills: Skill[]
  addSkill: (skill: Skill) => void
  removeSkill: (id: string) => void
  updateSkill: (id: string, updates: Partial<Skill>) => void
  clearSkills: () => void
  setSkills: (skills: Skill[]) => void
}

export const useSkillsStore = create<SkillsState>()(
  persist(
    (set) => ({
      skills: [],
      addSkill: (skill) =>
        set((state) => ({
          skills: [...state.skills, skill],
        })),
      removeSkill: (id) =>
        set((state) => ({
          skills: state.skills.filter((s) => s.id !== id),
        })),
      updateSkill: (id, updates) =>
        set((state) => ({
          skills: state.skills.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      clearSkills: () => set({ skills: [] }),
      setSkills: (skills) => set({ skills }),
    }),
    {
      name: "skills-storage",
    },
  ),
)
