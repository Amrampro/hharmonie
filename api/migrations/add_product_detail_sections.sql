USE hormone;

ALTER TABLE products
  ADD COLUMN suitability TEXT NULL AFTER `usage`,
  ADD COLUMN formula_benefits TEXT NULL AFTER suitability,
  ADD COLUMN cure_duration TEXT NULL AFTER formula_benefits,
  ADD COLUMN usage_advice TEXT NULL AFTER cure_duration,
  ADD COLUMN composition TEXT NULL AFTER usage_advice,
  ADD COLUMN precautions TEXT NULL AFTER composition;
