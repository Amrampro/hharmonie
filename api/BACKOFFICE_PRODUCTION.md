# Audit du backoffice — septembre 2026

## Constat et limites du diagnostic

La capture du formulaire de liens montre un échec de `POST /api/legal-links`.
La requête de création conserve correctement les caractères `@`, `?` et `&` du lien TikTok ; ce lien passe les tests SQL stricts.
La table `legal_links` était absente du fichier d'installation, comme `newsletter_subscribers` et `ambassador_payouts`.
Les colonnes `blog_posts.reading_time`, `blog_posts.views`, `ambassadors.user_id`, `ambassadors.iban` et `ambassadors.bank_account_name` étaient également absentes, alors que les routes actives les utilisent.

La base locale inspectée utilise MariaDB 10.4.32 sans `STRICT_TRANS_TABLES` ni `STRICT_ALL_TABLES`.
Son schéma diffère du fichier d'installation : titre de bannière nullable, FAQ en UUID, newsletter en identifiant numérique auto-incrémenté.
Ces différences expliquent pourquoi des erreurs de schéma ou de données peuvent être masquées en local.
Les journaux et le schéma de production n'ont pas été consultés : la cause précise du 500 en ligne reste à confirmer avec le contrôle ci-dessous et les logs de l'API.

## Corrections livrées

- Schéma d'installation complété ; contrôle et migration additive séparés.
- Liens légaux : validation des champs, espaces supprimés en bordure, conservation exacte de l'URL.
- Bannières : conservation du correctif précédent pour les titres vides.
- FAQ et newsletter : compatibilité avec les identifiants UUID et AUTO_INCREMENT, sans conversion des données existantes.
- Création de compte : UUID explicitement généré, sans dépendre d'une valeur par défaut absente du schéma fourni.
- Listes paginées : LIMIT/OFFSET remplacés uniquement par des entiers validés ; les filtres restent paramétrés. Cela évite de transmettre ces limites sous forme DOUBLE avec mysql2.
- Dates du blog et des événements : validation et conversion au format SQL, y compris les dates ISO.
- Produits et articles : création, modification et suppression sous transaction ; annulation en cas d'erreur, y compris après une validation de catégories échouée. Catégories dédupliquées.
- Erreurs du backoffice : messages adaptés aux tables/colonnes manquantes, doublons, références invalides et champs trop longs, sans exposer les requêtes SQL au navigateur.
- Upload : serveur aligné sur la limite de 5 Mo du formulaire de bannière ; réponse 413 en cas de dépassement et 400 pour un format refusé.
- Événements et rendez-vous : erreurs affichées dans l'interface et boutons désactivés pendant une opération.
- Ambassadeurs : routes administrateur protégées ; enregistrement des paiements sous transaction avec verrouillage du solde ; prévention des doubles clics ; un échec SMTP après sauvegarde produit un avertissement, pas un faux échec de paiement.
- Configuration client : en production, repli sur `/api` si `VITE_API_URL` est absent, au lieu de contacter localhost. Une valeur explicitement configurée reste prioritaire.

## Application sur le serveur

1. Sauvegarder la base de production et publier les fichiers API modifiés, notamment `scripts/`, `src/utils/`, `schema.sql` et `package.json`.
2. Dans le dossier de l'API, avec son `.env` de production, lancer :

   ```sh
   npm run db:check
   ```

   Le contrôle affiche la base ciblée, la version SQL, le mode SQL et les ajouts proposés. Le code de sortie 1 signale des écarts ou une erreur de connexion.

3. Vérifier la base ciblée et les ajouts affichés, puis appliquer :

   ```sh
   npm run db:migrate
   npm run db:check
   ```

   La migration crée les tables absentes et ajoute les colonnes absentes ayant une valeur par défaut explicite. Elle ne supprime ni table ni colonne et ne remplace aucune ligne. Elle peut être relancée après une interruption : les ajouts déjà présents sont ignorés. Les opérations DDL ne sont pas globalement transactionnelles ; exécuter une seule migration à la fois.

   Une incompatibilité d'identifiant ou une colonne obligatoire sans valeur par défaut arrête l'application automatique et demande une intervention manuelle. Les types, index et contraintes des colonnes existantes ne sont pas réécrits automatiquement. Ce contrôle ne garantit donc pas l'identité complète de deux schémas.

   **Ne pas importer directement `schema.sql` sur la base existante : ce fichier d'installation contient des `DROP TABLE`.** Le script de migration n'en extrait que les définitions `CREATE TABLE`.

4. Redémarrer l'API. Compiler le client avec `npm run build` dans son dossier, puis publier le contenu de `client/dist` dans le dossier servi par l'hébergement.
5. Vérifier dans le backoffice : création/modification d'un lien, bannière sans titre, FAQ, sauvegarde d'un produit et d'un article, listes newsletter/événements/rendez-vous.

Si un upload est encore rejeté avant d'atteindre l'API, vérifier la limite de taille du reverse proxy et les droits d'écriture sur `public/uploads/products`. Le proxy doit autoriser plus de 5 Mo pour inclure l'enveloppe multipart.

Si le lien TikTok échoue encore, relever dans les logs Node la ligne `Create legal link error` et son code SQL. Un message `DATABASE_SCHEMA_OUTDATED` signifie qu'une table ou colonne reste absente ; un 500 persistant nécessite ces logs pour identifier une autre cause. Ne pas désactiver le mode SQL strict pour masquer l'erreur.

## Vérifications

- Tests unitaires des validations, dates, pagination, messages d'erreur, migration et échec SMTP.
- Tests d'intégration en `STRICT_ALL_TABLES` sur des tables temporaires : lien de la capture, bannières sans titre, FAQ/newsletter dans les deux formats d'identifiant, annulation des sauvegardes partielles, montants ambassadeurs et génération explicite d'UUID utilisateur.
- Migration exécutée sur une instance MariaDB séparée : base vide, ajout d'une colonne manquante, nouvelle exécution sans changement et conservation d'une ligne témoin.
- Compilation Vite et vérification de syntaxe JavaScript.
- Le contrôle TypeScript global contient des erreurs antérieures à cet audit (59 au départ). La comparaison avec HEAD permet de vérifier qu'aucune nouvelle erreur n'est introduite ; le problème de typage des en-têtes HTTP a également été corrigé.

Pour les tests unitaires : `npm test` depuis le dossier API.
Pour inclure les tests SQL, définir `RUN_DB_TESTS=1` et les variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` d'une base de test. Ces tests utilisent des tables temporaires et un mode strict limité à leur connexion. Ils nécessitent le droit `CREATE TEMPORARY TABLES`. Le test de migration du questionnaire crée en plus un schéma isolé nommé `hh_consultation_test_<identifiant aléatoire>`, qu'il supprime à la fin ; il nécessite les droits CREATE/DROP DATABASE sur le serveur de test.
