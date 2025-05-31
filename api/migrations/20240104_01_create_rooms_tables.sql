-- Create rooms table for chat rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create room_members table for room participants
CREATE TABLE IF NOT EXISTS room_members (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);
CREATE INDEX idx_rooms_is_system ON rooms(is_system);
CREATE INDEX idx_room_members_room_id ON room_members(room_id);
CREATE INDEX idx_room_members_user_id ON room_members(user_id);

-- Create updated_at trigger for rooms
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE
    ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
