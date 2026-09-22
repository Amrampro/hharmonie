ALTER TABLE appointment_slots ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

UPDATE appointment_slots s
JOIN appointment_services sv ON sv.id = s.service_id
SET s.price = sv.price;

ALTER TABLE appointments
  ADD COLUMN amount_cents INT UNSIGNED DEFAULT NULL,
  ADD COLUMN payment_status ENUM('free','pending','paid','expired') DEFAULT NULL,
  ADD COLUMN stripe_session_id VARCHAR(255) DEFAULT NULL UNIQUE,
  ADD COLUMN payment_expires_at INT UNSIGNED DEFAULT NULL,
  MODIFY COLUMN status ENUM('confirmed','cancelled_by_client','cancelled_by_admin','completed','no_show','pending_payment','payment_expired') NOT NULL DEFAULT 'confirmed';
