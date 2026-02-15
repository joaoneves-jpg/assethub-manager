-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(name, team_id)
);

-- Create index for better query performance
CREATE INDEX idx_tags_team_id ON tags(team_id);
CREATE INDEX idx_tags_name ON tags(name);

-- Create page_tags junction table
CREATE TABLE IF NOT EXISTS page_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, tag_id)
);

-- Create indexes for page_tags
CREATE INDEX idx_page_tags_page_id ON page_tags(page_id);
CREATE INDEX idx_page_tags_tag_id ON page_tags(tag_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view tags from their team"
  ON tags FOR SELECT
  USING (team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and gestores can create tags"
  ON tags FOR INSERT
  WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Admins and gestores can update tags"
  ON tags FOR UPDATE
  USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Admins and gestores can delete tags"
  ON tags FOR DELETE
  USING (
    team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  );

-- RLS Policies for page_tags
CREATE POLICY "Users can view page tags from their team"
  ON page_tags FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM pages 
      WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can manage page tags from their team"
  ON page_tags FOR ALL
  USING (
    page_id IN (
      SELECT id FROM pages 
      WHERE team_id IN (SELECT team_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Add date_received column to pages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pages' AND column_name = 'date_received'
  ) THEN
    ALTER TABLE pages ADD COLUMN date_received TIMESTAMPTZ;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN pages.date_received IS 'Date when the page was received';
