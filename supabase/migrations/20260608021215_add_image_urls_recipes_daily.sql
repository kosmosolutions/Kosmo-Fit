-- Add image_url to recipes table
ALTER TABLE recipes ADD COLUMN image_url TEXT;

-- Add photo_url to daily_entries table
ALTER TABLE daily_entries ADD COLUMN photo_url TEXT;
