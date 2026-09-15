USE hormone;

-- =====================================================
-- USERS
-- =====================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, is_admin)
VALUES
('u-admin', 'admin@shop.com', '$2b$10$hashedpassword', 'Admin', 'System', '+320000000', TRUE),
('u-1', 'client1@mail.com', '$2b$10$hashedpassword', 'Sarah', 'Dupont', '+32470000001', FALSE),
('u-2', 'client2@mail.com', '$2b$10$hashedpassword', 'Marc', 'Lebrun', '+32470000002', FALSE);

INSERT INTO user_addresses (id, user_id, first_name, last_name, email, phone, address_line1, town, postal_code, country, is_default)
VALUES
('addr-1', 'u-1', 'Sarah', 'Dupont', 'client1@mail.com', '+32470000001', 'Rue Louise 12', 'Bruxelles', '1000', 'Belgique', TRUE),
('addr-2', 'u-2', 'Marc', 'Lebrun', 'client2@mail.com', '+32470000002', 'Avenue Fonsny 8', 'Bruxelles', '1060', 'Belgique', TRUE);

-- =====================================================
-- PRODUCT CATEGORIES
-- =====================================================

INSERT INTO product_categories (id, name, slug, description, display_order)
VALUES
('pc-1', 'Équilibre hormonal', 'equilibre-hormonal', 'Solutions naturelles pour accompagner les variations hormonales.', 1),
('pc-2', 'Fertilité', 'fertilite', 'Formules pour soutenir la fertilité féminine et masculine.', 2),
('pc-3', 'Cycle féminin', 'cycle-feminin', 'Produits dédiés au confort du cycle et aux troubles fréquents.', 3),
('pc-4', 'Bien-être intime', 'bien-etre-intime', 'Soutien naturel de la flore intime et du confort quotidien.', 4);

UPDATE product_categories SET parent_id = 'pc-1' WHERE id IN ('pc-2','pc-3');

-- =====================================================
-- PRODUCTS
-- =====================================================

INSERT INTO products (
  id, name, slug, description, short_description, price, image_url, is_featured, is_new,
  suitability, formula_benefits, cure_duration, usage_advice, composition, precautions
)
VALUES
('p-1', 'Probiotiques - Flore intime', 'probiotiques-flore-intime', 'Une formule pensée pour soutenir le confort intime, l’équilibre de la flore et le bien-être féminin.', 'Accompagne l’équilibre de la flore intime au quotidien.', 44.00,
 'https://images.pexels.com/photos/5938242/pexels-photo-5938242.jpeg', TRUE, TRUE,
 'Cette formule peut vous convenir si vous souhaitez soutenir naturellement votre flore intime, accompagner votre confort quotidien ou compléter une routine bien-être féminine.',
 'Confort intime au quotidien
Soutien de l’équilibre de la flore
Accompagnement doux pendant les périodes de déséquilibre
Routine simple à intégrer',
 'Une cure de 1 à 3 mois est souvent privilégiée selon les besoins.',
 'Prendre selon les recommandations indiquées sur le produit. Demander conseil en cas de situation particulière.',
 'Complexe de probiotiques sélectionnés pour l’équilibre intime.',
 'Ne se substitue pas à une alimentation variée et équilibrée. Ne pas dépasser la dose journalière conseillée. Tenir hors de portée des enfants.'),
('p-2', 'Omega 3 - Cure de 1 mois', 'omega-3-cure-1-mois', 'Des omega 3 sélectionnés pour accompagner le confort du cycle, la vitalité et l’équilibre général.', 'Soutien nutritionnel pour l’équilibre inflammatoire et hormonal.', 28.90,
 'https://images.pexels.com/photos/5946083/pexels-photo-5946083.jpeg', TRUE, FALSE,
 'Cette cure peut vous convenir si vous recherchez un soutien nutritionnel global, notamment autour du cycle, de la vitalité et du confort inflammatoire.',
 'Soutien nutritionnel du cycle
Accompagnement de la vitalité
Apport ciblé en acides gras essentiels
Routine quotidienne simple',
 'Cure de 1 mois renouvelable selon les besoins.',
 'Prendre au cours d’un repas, selon les recommandations indiquées sur le produit.',
 'Omega 3 issus d’une source sélectionnée, avec apport en acides gras essentiels.',
 'Déconseillé en cas d’allergie connue à l’un des composants. Demander un avis professionnel en cas de traitement anticoagulant.'),
('p-3', 'Équilibre +', 'equilibre-plus', 'Une cure globale destinée aux personnes qui souhaitent soutenir naturellement leur équilibre hormonal.', 'Formule complète pour accompagner le cycle et les variations hormonales.', 59.90,
 'https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg', TRUE, TRUE,
 'Cette formule peut vous convenir si vous ressentez des variations liées au cycle, souhaitez soutenir votre équilibre hormonal naturellement ou recherchez une approche globale et douce.',
 'Équilibre hormonal
Accompagne les variations du cycle et les besoins féminins.

Confort au quotidien
Aide à intégrer une routine naturelle et cohérente.

Approche globale
Associe les plantes, les bourgeons et la nutrition selon les besoins.',
 'Pour un soutien durable, une utilisation de 3 mois est souvent privilégiée.',
 'Suivre les conseils indiqués sur chaque élément de la cure. Une régularité quotidienne est recommandée pour un accompagnement durable.',
 'Pack composé d’une sélection de solutions naturelles associant phytothérapie, gemmothérapie et nutrithérapie.',
 'Ce complément alimentaire ne se substitue pas à une alimentation variée et équilibrée, ni à un mode de vie sain. Ne pas dépasser la dose journalière conseillée. Demander conseil à un professionnel de santé en cas de grossesse, allaitement, traitement médical ou pathologie.'),
('p-4', 'NAC 600mg', 'nac-600mg', 'La N-acétyl cystéine accompagne les besoins antioxydants et le confort global.', 'Soutien antioxydant pour énergie, confort et équilibre.', 24.90,
 'https://images.pexels.com/photos/5938381/pexels-photo-5938381.jpeg', FALSE, FALSE,
 'Cette formule peut vous convenir si vous cherchez un soutien antioxydant ciblé et un accompagnement naturel de l’équilibre global.',
 'Soutien antioxydant
Accompagnement des besoins liés au stress oxydatif
Routine simple dans une démarche bien-être',
 'Cure de 1 mois renouvelable selon les besoins.',
 'Prendre selon les recommandations indiquées sur le produit.',
 'N-acétyl cystéine dosée à 600 mg.',
 'Ne pas utiliser sans avis médical en cas de grossesse, allaitement, traitement ou pathologie. Tenir hors de portée des enfants.');

INSERT INTO product_category_pivot (product_id, category_id)
VALUES
('p-1','pc-1'), ('p-1','pc-3'),
('p-2','pc-1'), ('p-2','pc-2'),
('p-3','pc-1'), ('p-3','pc-3'),
('p-4','pc-2');

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================

INSERT INTO product_images (id, product_id, image_url, is_primary)
VALUES
('img-1','p-1','https://images.pexels.com/photos/5938242/pexels-photo-5938242.jpeg', TRUE),
('img-2','p-2','https://images.pexels.com/photos/5946083/pexels-photo-5946083.jpeg', TRUE),
('img-3','p-3','https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg', TRUE),
('img-4','p-4','https://images.pexels.com/photos/5938381/pexels-photo-5938381.jpeg', TRUE);

-- =====================================================
-- PRODUCT REVIEWS
-- =====================================================

INSERT INTO product_reviews (id, product_id, customer_name, customer_email, rating, title, comment)
VALUES
('r-1','p-1','Sarah Dupont','client1@mail.com',5,'Excellent','Très bon sérum'),
('r-2','p-1','Marc Lebrun','client2@mail.com',4,'Efficace','Résultat visible'),
('r-3','p-2','Sarah Dupont','client1@mail.com',5,'Parfaite','Hydrate très bien');

-- =====================================================
-- BLOG CATEGORIES
-- =====================================================

INSERT INTO blog_categories (id, name, slug, description, display_order)
VALUES
('bc-1','Fertilité et hormones','fertilite-hormones','Comprendre le lien entre fertilité, cycle et équilibre hormonal.',1),
('bc-2','Nutrition du cycle','nutrition-cycle','Conseils nutritionnels pour soutenir le cycle féminin.',2),
('bc-3','Approche naturelle','approche-naturelle','Repères naturopathiques et accompagnement global.',3);

UPDATE blog_categories SET parent_id = 'bc-1' WHERE id = 'bc-2';

-- =====================================================
-- BLOG POSTS
-- =====================================================

INSERT INTO blog_posts (id, title, slug, excerpt, content, image_url, published_at)
VALUES
('bp-1','Alimentation et insulinorésistance : le guide concret','alimentation-et-insulinoresistance-guide-concret',
 'Des repères simples pour composer des repas plus stables et mieux soutenir le cycle.',
 '<p>L’insulinorésistance peut influencer le cycle, l’énergie et certains parcours de fertilité. L’objectif n’est pas de supprimer tous les plaisirs, mais de construire des repas plus stables.</p><p>Commencez par associer fibres, protéines et bons lipides à chaque repas. Cette base limite les pics glycémiques et soutient une énergie plus régulière.</p>',
 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg',
 NOW()),
('bp-2','SOPK : comprendre les signaux du corps','sopk-comprendre-les-signaux-du-corps',
 'Cycle irrégulier, acné, fatigue : apprendre à relier les signes sans se culpabiliser.',
 '<p>Le SOPK peut se manifester de plusieurs manières. L’observation du cycle, du sommeil, de l’alimentation et du stress aide à mieux comprendre ce qui se joue.</p><p>Un bilan médical reste essentiel, et les approches naturelles peuvent venir en complément.</p>',
 'https://images.pexels.com/photos/3762875/pexels-photo-3762875.jpeg',
 NOW());

INSERT INTO blog_post_category_pivot (blog_post_id, category_id)
VALUES
('bp-1','bc-1'), ('bp-1','bc-2'),
('bp-2','bc-1'), ('bp-2','bc-3');

-- =====================================================
-- COUPONS
-- =====================================================

INSERT INTO coupons (id, code, description, discount_type, discount_value, min_purchase_amount, is_active)
VALUES
('c-1','WELCOME10','10% de réduction nouveaux clients','percentage',10,0,TRUE),
('c-2','LOYAL20','20% clients fidèles','percentage',20,50,TRUE);

UPDATE coupons SET requires_min_orders = 5 WHERE id = 'c-2';

-- =====================================================
-- ORDERS
-- =====================================================

INSERT INTO orders (
    id, order_number, user_id, status, currency,
    subtotal_amount, discount_amount, shipping_amount, total_amount,
    coupon_code, shipping_method, shipping_status
)
VALUES
('o-1','HH-SEED-0001',0,'paid','EUR',7290,0,390,7680,NULL,'mondial_relay','not_set');

INSERT INTO order_addresses (id, order_id, full_name, email, phone, country, city, postal_code, address1, address2)
VALUES
('oa-1','o-1','Sarah Dupont','client1@mail.com','+32470000001','BE','Bruxelles','1000','Rue Louise 12',NULL);

INSERT INTO order_items (id, order_id, product_id, product_name, unit_price, quantity, line_total)
VALUES
('oi-1','o-1','p-1','Probiotiques - Flore intime',4400,1,4400),
('oi-2','o-1','p-2','Omega 3 - Cure de 1 mois',2890,1,2890);

INSERT INTO order_payments
(id, order_id, provider, status, amount, currency)
VALUES
('op-1','o-1','stripe','succeeded',7680,'EUR');

-- =====================================================
-- FAQ
-- =====================================================

INSERT INTO faqs (question, answer, category, display_order)
VALUES
('Comment commander ?','Ajoutez les produits au panier puis finalisez la commande avec le paiement sécurisé.','Commandes',1),
('Puis-je prendre rendez-vous sans compte ?','Oui, la page Consultation permet de réserver un créneau disponible avec vos coordonnées.','Consultation',2),
('Les produits remplacent-ils un suivi médical ?','Non. Les produits et conseils H&H accompagnent le bien-être et ne remplacent pas un avis médical.','Produits',3);

INSERT INTO parameters
(id, promotional_text, home_text, story, mission, vision, expertise, name, email, phone, logo_navbar, logo_footer)
VALUES
('params-hh', 'Visitez notre boutique et profitez de -10% sur la première commande avec FIRST_ORDER_10.',
'Comprendre son corps. Retrouver son équilibre. Avancer naturellement. H&H accompagne les femmes, les hommes et les couples avec des tisanes, des compléments alimentaires et un suivi personnalisé autour de l’équilibre hormonal, du cycle et de la fertilité.',
'H&H - Hormone & Harmonie est née d’une expérience en imagerie médicale gynécologique et d’une volonté sincère : écouter, accompagner, transmettre et aider chacun à mieux comprendre son corps.',
'Proposer des solutions naturelles, réfléchies et adaptées pour soutenir le bien-être hormonal, le cycle féminin et la fertilité féminine et masculine.',
'Construire une marque douce, premium et accessible, où les produits, les conseils et l’accompagnement avancent ensemble.',
'Phytothérapie, gemmothérapie et nutrithérapie sont associées pour créer des packs cohérents, personnalisés et durables.',
'Hormones & Harmonie', 'contact@hormoneharmonie.test', '+32470000000', NULL, NULL);

INSERT INTO banners (id, page_name, title, subtitle, button, link, background_img, is_active, display_order)
VALUES
('banner-home-hh', 'home', 'Hormones & Harmonie', 'Des solutions naturelles pour soutenir votre équilibre hormonal.', 'Découvrir', '/shop', 'https://images.pexels.com/photos/6693655/pexels-photo-6693655.jpeg', 1, 1),
('banner-shop-hh', 'shop', 'Nos produits naturels', 'Tisanes, compléments et packs pour accompagner le cycle, la fertilité et le bien-être intime.', 'Prendre rendez-vous', '/consultation', 'https://images.pexels.com/photos/5938242/pexels-photo-5938242.jpeg', 1, 1);

INSERT INTO events
(id, title, slug, short_description, description, event_type, location_name, city, starts_at, ends_at, capacity, price, currency, status)
VALUES
('event-1', 'Atelier cycle, hormones et fertilité', 'atelier-cycle-hormones-fertilite-bruxelles', 'Une rencontre pour comprendre les bases du cycle et les leviers naturels.', 'Un atelier pratique pour poser les bases : comprendre les phases du cycle, identifier les signaux importants et repartir avec des pistes concrètes.', 'physical', 'Maison du Bien-être', 'Bruxelles', DATE_ADD(CURRENT_DATE(), INTERVAL 21 DAY) + INTERVAL 18 HOUR, DATE_ADD(CURRENT_DATE(), INTERVAL 21 DAY) + INTERVAL 20 HOUR, 40, 29.00, 'EUR', 'published'),
('event-2', 'Comprendre son cycle - session en ligne', 'rencontre-comprendre-son-cycle-en-ligne', 'Une session accessible depuis chez vous pour mieux lire les signaux du corps.', 'Une rencontre en ligne pour parler cycle, symptômes, fatigue et organisation d’une routine naturelle.', 'online', 'En ligne', 'Online', DATE_ADD(CURRENT_DATE(), INTERVAL 35 DAY) + INTERVAL 19 HOUR, DATE_ADD(CURRENT_DATE(), INTERVAL 35 DAY) + INTERVAL 20 HOUR, 120, 0.00, 'EUR', 'published');

INSERT INTO appointment_services
(id, name, slug, short_description, description, duration_minutes, price, meeting_type, is_active, display_order)
VALUES
('as-1', 'Bilan hormonal naturopathie', 'bilan-hormonal-naturopathie', 'Premier rendez-vous pour comprendre votre situation.', 'Un rendez-vous d’écoute pour faire le point sur le cycle, les symptômes, l’hygiène de vie et les besoins prioritaires.', 60, 65.00, 'online', 1, 1),
('as-2', 'Accompagnement fertilité', 'accompagnement-fertilite', 'Session approfondie pour femmes, hommes ou couples.', 'Un accompagnement personnalisé pour soutenir le parcours de fertilité en complément du suivi médical.', 90, 95.00, 'online', 1, 2);

INSERT INTO appointment_slots
(id, service_id, available_date, start_time, end_time, status)
VALUES
('slot-1', 'as-1', DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), '09:00:00', '10:00:00', 'available'),
('slot-2', 'as-1', DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY), '10:30:00', '11:30:00', 'available'),
('slot-3', 'as-2', DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), '14:00:00', '15:30:00', 'available');

-- =====================================================
-- END OF SEED
-- =====================================================
