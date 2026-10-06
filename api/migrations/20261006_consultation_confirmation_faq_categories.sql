ALTER TABLE appointment_slots ADD COLUMN meeting_url VARCHAR(1000) DEFAULT NULL;
ALTER TABLE appointments
  ADD COLUMN platform_preference ENUM('default','whatsapp','google_meet','zoom') NOT NULL DEFAULT 'default',
  ADD COLUMN meeting_url VARCHAR(1000) DEFAULT NULL,
  ADD COLUMN confirmation_token CHAR(64) DEFAULT NULL UNIQUE,
  ADD COLUMN confirmation_sent_at DATETIME DEFAULT NULL,
  ADD COLUMN confirmation_send_started_at DATETIME DEFAULT NULL;

CREATE TABLE faq_categories (
  name VARCHAR(120) NOT NULL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO faq_categories (name) VALUES ('Général');
UPDATE faqs SET category = 'Général' WHERE category IS NULL OR TRIM(category) = '';
UPDATE faqs SET category = TRIM(category);
INSERT IGNORE INTO faq_categories (name) SELECT DISTINCT category FROM faqs;
