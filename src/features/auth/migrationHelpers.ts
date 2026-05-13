import { localSessionAdapter } from "../../lib/storage/localSessionAdapter";
import { supabaseBuildsAdapter } from "../../lib/storage/supabaseBuildsAdapter";

// Runs once when a brand-new account is created.
// Uploads any locally-saved builds to Supabase, then clears localStorage so
// the next load pulls cleanly from the database.
export async function migrateGuestBuildsToAccount(userId: string): Promise<{ migratedCount: number }> {
  const local = localSessionAdapter.load();
  if (!local || local.savedHomes.length === 0) return { migratedCount: 0 };

  // Skip if the user already has builds (returning user on a new device).
  const existing = await supabaseBuildsAdapter.load(userId);
  if (existing.savedHomes.length > 0) return { migratedCount: 0 };

  await Promise.all(local.savedHomes.map((home) => supabaseBuildsAdapter.saveBuild(userId, home)));

  localSessionAdapter.clear();
  return { migratedCount: local.savedHomes.length };
}
