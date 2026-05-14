-- UNIVERSITY SETTINGS EXTENSION
CREATE TABLE IF NOT EXISTS university_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO university_settings (key, value) 
VALUES ('smart_attendance', '{"gps_enabled": true, "radius": 50, "default_duration": 60, "qr_enabled": true, "security_level": "high"}')
ON CONFLICT (key) DO NOTHING;
