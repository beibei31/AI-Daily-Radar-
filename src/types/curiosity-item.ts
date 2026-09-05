export type CuriosityCategory =
  | "astronomy"
  | "physics"
  | "tools"
  | "scent"
  | "art_design"
  | "music"
  | "psychology"
  | "geography"
  | "history"
  | "chemistry_materials"
  | "food_science"
  | "fashion_objects"
  | "computing";

export type CuriosityItem = {
  id?: number;
  title: string;
  category: CuriosityCategory;
  hook: string;
  explanation: string;
  key_fact: string;
  related_topics: string[];
  difficulty: number;
  source: string;
  source_url: string;
  created_at?: string | null;
};

