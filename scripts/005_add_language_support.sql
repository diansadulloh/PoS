-- Add language support to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS default_language VARCHAR(10) DEFAULT 'en';

-- Update existing businesses to have English as default
UPDATE businesses 
SET default_language = 'en' 
WHERE default_language IS NULL;

COMMENT ON COLUMN businesses.default_language IS 'Default language for the business (en, id, etc.)';
