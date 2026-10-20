CREATE TABLE IF NOT EXISTS shipping_methods (
  method VARCHAR(30) NOT NULL PRIMARY KEY,
  free_shipping_threshold_cents INT UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS shipping_rates (
  method VARCHAR(30) NOT NULL,
  country_code CHAR(2) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  amount_cents INT UNSIGNED NOT NULL,
  PRIMARY KEY (method, country_code),
  FOREIGN KEY (method) REFERENCES shipping_methods(method) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

START TRANSACTION;
INSERT IGNORE INTO shipping_methods (method) VALUES ('mondial_relay'), ('home_delivery');
INSERT IGNORE INTO shipping_rates (method,country_code,country_name,amount_cents) VALUES
('mondial_relay','BE','Belgique',430),
('mondial_relay','DE','Allemagne',1430),
('mondial_relay','FR','France',550),
('mondial_relay','NL','Pays-Bas',480),
('mondial_relay','ES','Espagne',730),
('mondial_relay','IT','Italie',730),
('mondial_relay','PL','Pologne',1050),
('mondial_relay','PT','Portugal',730),
('home_delivery','BE','Belgique',787),
('home_delivery','FR','France',1235),
('home_delivery','NL','Pays-Bas',1235),
('home_delivery','LU','Luxembourg',1235),
('home_delivery','ES','Espagne',1450),
('home_delivery','IT','Italie',1450);
COMMIT;
