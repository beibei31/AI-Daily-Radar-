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
  | "computing"
  | "biology"
  | "architecture"
  | "language"
  | "mechanical"
  | "finance"
  | "photography"
  | "plants"
  | "medical_history"
  | "traffic_engineering";

export type CuriosityItem = {
  id?: number;
  title: string;
  question?: string | null;
  category: CuriosityCategory;
  hook: string;
  explanation: string;
  key_fact: string;
  related_topics: string[];
  difficulty: number;
  source: string;
  source_url: string;
  next_question?: string | null;
  created_at?: string | null;
};
