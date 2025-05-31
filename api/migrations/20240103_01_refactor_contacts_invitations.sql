-- Refactor contacts into separate invitations and contacts tables

-- First, drop the old contacts table if it exists
DROP TABLE IF EXISTS contacts CASCADE;

-- Create invitations table for pending contact requests
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- Create contacts table for accepted connections (symmetric)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id)  -- Ensure consistent ordering
);

-- Create indexes for invitations
CREATE INDEX idx_invitations_from_user_id ON invitations(from_user_id);
CREATE INDEX idx_invitations_to_user_id ON invitations(to_user_id);

-- Create indexes for contacts
CREATE INDEX idx_contacts_user1_id ON contacts(user1_id);
CREATE INDEX idx_contacts_user2_id ON contacts(user2_id);

-- Create updated_at triggers
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE
    ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE
    ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
