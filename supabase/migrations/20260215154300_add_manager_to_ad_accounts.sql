-- Add current_manager_id column to ad_accounts table
ALTER TABLE ad_accounts
ADD COLUMN current_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_ad_accounts_current_manager_id ON ad_accounts(current_manager_id);

-- Add comment to document the column
COMMENT ON COLUMN ad_accounts.current_manager_id IS 'The current manager responsible for this ad account';
