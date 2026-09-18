'use server';

import { createClient } from '@/utils/supabase/server';

export async function castVote(matchupId: string, votedForId: string) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { status: 'ERROR', message: 'Unauthorized' };
  }
  const userId = userData.user.id;

  // Upsert the vote (since there's a unique constraint on matchup_id + user_id)
  const { error } = await supabase
    .from('votes')
    .upsert(
      {
        matchup_id: matchupId,
        user_id: userId,
        voted_for_id: votedForId,
      },
      { onConflict: 'matchup_id, user_id' }
    );

  if (error) {
    console.error('Vote Error:', error);
    return { status: 'ERROR', message: 'Failed to cast vote' };
  }

  return { status: 'SUCCESS' };
}
