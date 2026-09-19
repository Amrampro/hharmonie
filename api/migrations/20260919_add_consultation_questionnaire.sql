ALTER TABLE appointments
  ADD COLUMN gender ENUM('female','male') DEFAULT NULL,
  ADD COLUMN age TINYINT UNSIGNED DEFAULT NULL,
  ADD COLUMN baby_project TINYINT(1) DEFAULT NULL,
  ADD COLUMN main_concern TEXT DEFAULT NULL,
  ADD COLUMN consulted_professional TINYINT(1) DEFAULT NULL,
  ADD COLUMN exams_description TEXT DEFAULT NULL,
  ADD COLUMN has_diagnosis TINYINT(1) DEFAULT NULL,
  ADD COLUMN diagnosis_details TEXT DEFAULT NULL,
  ADD COLUMN consultation_reasons JSON DEFAULT NULL,
  ADD COLUMN consultation_reason_other TEXT DEFAULT NULL;

CREATE TABLE appointment_documents (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  appointment_id INT NOT NULL,
  original_name VARCHAR(180) NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_appointment_documents_appointment (appointment_id),
  CONSTRAINT fk_appointment_documents_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE appointment_document_chunks (
  document_id VARCHAR(36) NOT NULL,
  chunk_index INT UNSIGNED NOT NULL,
  content MEDIUMBLOB NOT NULL,
  PRIMARY KEY (document_id, chunk_index),
  CONSTRAINT fk_appointment_document_chunks_document FOREIGN KEY (document_id) REFERENCES appointment_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
