// Run `supabase gen types typescript --project-id YOUR_PROJECT_ID` to regenerate.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      builds: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          pokemon_ids: string[];
          item_ids: string[];
          item_quantities: Json;
          material_progress: Json;
          habitat_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          owner_id: string;
          name: string;
          pokemon_ids?: string[];
          item_ids?: string[];
          item_quantities?: Json;
          material_progress?: Json;
          habitat_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          pokemon_ids?: string[];
          item_ids?: string[];
          item_quantities?: Json;
          material_progress?: Json;
          habitat_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
  };
};
