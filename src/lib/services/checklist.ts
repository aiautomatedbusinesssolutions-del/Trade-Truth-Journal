import { createClient } from "@/lib/supabase/client";

interface ChecklistData {
  higher_timeframes: boolean;
  news_check: boolean;
  calm_check: boolean;
  stop_loss_set: boolean;
  in_trading_plan: boolean;
  rr_defined: boolean;
  position_sized: boolean;
}

export async function saveChecklist(data: ChecklistData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const allPassed =
    data.higher_timeframes === true &&
    data.news_check === true &&
    data.calm_check === true &&
    data.stop_loss_set === true &&
    data.in_trading_plan === true &&
    data.rr_defined === true &&
    data.position_sized === true;

  const { data: entry, error } = await supabase
    .from("checklist_entries")
    .insert({
      user_id: user.id,
      ...data,
      all_passed: allPassed,
    })
    .select()
    .single();

  if (error) throw error;
  return entry;
}
