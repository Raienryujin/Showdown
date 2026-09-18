-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brackets Table
CREATE TABLE brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_round INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matchups Table
CREATE TABLE matchups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bracket_id UUID NOT NULL REFERENCES brackets(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    team1_id TEXT,
    team2_id TEXT,
    winner_id TEXT,
    next_matchup_id UUID REFERENCES matchups(id) ON DELETE SET NULL,
    next_matchup_slot INTEGER CHECK (next_matchup_slot IN (1, 2)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Votes Table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matchup_id UUID NOT NULL REFERENCES matchups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    voted_for_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(matchup_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchups ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Brackets
CREATE POLICY "Brackets are viewable by everyone" 
ON brackets FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can create brackets" 
ON brackets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Only creators can update their brackets" 
ON brackets FOR UPDATE 
TO authenticated 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Only creators can delete their brackets" 
ON brackets FOR DELETE 
TO authenticated 
USING (auth.uid() = creator_id);

-- RLS Policies for Matchups
CREATE POLICY "Matchups are viewable by everyone" 
ON matchups FOR SELECT 
TO authenticated, anon
USING (true);

-- Relying on bracket creator logic for inserting/updating matchups
CREATE POLICY "Creators can insert matchups for their brackets" 
ON matchups FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM brackets WHERE id = matchups.bracket_id AND creator_id = auth.uid()
    )
);

CREATE POLICY "Creators can update matchups for their brackets" 
ON matchups FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM brackets WHERE id = matchups.bracket_id AND creator_id = auth.uid()
    )
);

-- RLS Policies for Votes
CREATE POLICY "Votes are viewable by everyone" 
ON votes FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can vote" 
ON votes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their vote" 
ON votes FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RPC for advancing the bracket round
CREATE OR REPLACE FUNCTION advance_bracket_round(
    p_bracket_id UUID,
    p_winners JSONB -- Array of { matchup_id: UUID, winner_id: TEXT }
) RETURNS VOID AS $$
DECLARE
    v_creator_id UUID;
    v_winner JSONB;
    v_matchup RECORD;
BEGIN
    -- Verify the requester is the bracket creator
    SELECT creator_id INTO v_creator_id FROM brackets WHERE id = p_bracket_id;
    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'Bracket not found';
    END IF;
    IF v_creator_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Only the creator can advance the round';
    END IF;

    -- Update each matchup's winner
    FOR v_winner IN SELECT * FROM jsonb_array_elements(p_winners)
    LOOP
        -- Update winner for the current matchup
        UPDATE matchups
        SET winner_id = v_winner->>'winner_id'
        WHERE id = (v_winner->>'matchup_id')::UUID 
          AND bracket_id = p_bracket_id
        RETURNING next_matchup_id, next_matchup_slot INTO v_matchup;

        -- If there is a subsequent matchup, push the winner forward
        IF v_matchup.next_matchup_id IS NOT NULL THEN
            IF v_matchup.next_matchup_slot = 1 THEN
                UPDATE matchups 
                SET team1_id = v_winner->>'winner_id' 
                WHERE id = v_matchup.next_matchup_id;
            ELSIF v_matchup.next_matchup_slot = 2 THEN
                UPDATE matchups 
                SET team2_id = v_winner->>'winner_id' 
                WHERE id = v_matchup.next_matchup_id;
            END IF;
        END IF;
    END LOOP;

    -- Advance the overall bracket round
    UPDATE brackets 
    SET current_round = current_round + 1 
    WHERE id = p_bracket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
