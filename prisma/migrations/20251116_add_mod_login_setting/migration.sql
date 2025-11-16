-- Add mod_login_enabled setting for moderator role
INSERT INTO "system_settings" ("setting_key", "setting_value", "description", "updated_at")
VALUES ('mod_login_enabled', 'true', 'Enable/disable system access for MODERATOR role', CURRENT_TIMESTAMP)
ON CONFLICT ("setting_key") DO NOTHING;