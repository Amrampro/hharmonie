# Configuration du Thème

## Vue d'ensemble

Le système de configuration du thème permet aux administrateurs de personnaliser les couleurs, les polices et les styles du site web directement depuis le panneau d'administration, sans modifier le code.

## Fonctionnalités

### Paramètres personnalisables

- **Couleurs**
  - Couleurs primaires (principale, claire, foncée)
  - Couleurs secondaires (principale, claire, foncée)
  - Couleurs d'accentuation (principale, claire, foncée)
  - Couleurs de fond (primaire, secondaire)
  - Couleurs de texte (primaire, secondaire)
  - Couleurs de statut (succès, erreur, avertissement)

- **Typographie**
  - Police primaire (pour les titres)
  - Police secondaire (pour le texte du corps)

- **Styles**
  - Rayon de bordure des boutons
  - Rayon de bordure moyen
  - Rayon de bordure large

## Accès à la Configuration

1. Connectez-vous en tant qu'administrateur
2. Accédez au panneau d'administration
3. Cliquez sur "Configuration du thème" dans le menu latéral

## Utilisation

### Modifier les paramètres

1. Dans la page de configuration du thème, vous verrez tous les paramètres organisés par catégorie
2. Pour les couleurs :
   - Utilisez le sélecteur de couleur pour choisir visuellement
   - Ou saisissez directement un code hexadécimal (#RRGGBB)
3. Pour les polices :
   - Saisissez le nom de la police (ex: "Inter", "Playfair Display")
   - Assurez-vous que la police est disponible via Google Fonts ou dans votre système
4. Pour les rayons de bordure :
   - Utilisez des valeurs CSS (ex: "0.5rem", "8px", "0")

### Enregistrer les modifications

1. Cliquez sur le bouton "Enregistrer" en haut à droite
2. Le thème sera automatiquement appliqué à tout le site
3. La page se rechargera pour afficher les nouvelles modifications

### Réinitialiser le thème

1. Cliquez sur le bouton "Réinitialiser" en haut à droite
2. Confirmez l'action
3. Le thème reviendra aux couleurs et styles par défaut

## Architecture technique

### Base de données

Les paramètres du thème sont stockés dans la table `theme_settings` :
- `id` : Identifiant unique
- `key` : Clé du paramètre (ex: "primary_main")
- `value` : Valeur du paramètre
- `category` : Catégorie (colors, typography, buttons, general)
- `description` : Description du paramètre
- `created_at` / `updated_at` : Horodatages

### Chargement du thème

1. Au démarrage de l'application, les paramètres sont chargés depuis la base de données
2. Les valeurs personnalisées remplacent les valeurs par défaut
3. L'objet theme est mis à jour avec les nouvelles valeurs
4. Tous les composants utilisant le thème affichent automatiquement les nouvelles couleurs/styles

### Fichiers clés

- `/client/src/pages/admin/AdminThemePage.tsx` : Interface d'administration
- `/client/src/utils/loadTheme.ts` : Chargement et application du thème
- `/client/src/config/theme.ts` : Configuration du thème par défaut
- `/supabase/migrations/*_create_theme_settings.sql` : Schéma de base de données

## Conseils d'utilisation

1. **Cohérence des couleurs** : Assurez-vous que les couleurs claires et foncées correspondent bien à la couleur principale
2. **Contraste** : Vérifiez que le texte reste lisible sur tous les fonds
3. **Polices** : Utilisez des polices web-safe ou disponibles sur Google Fonts
4. **Test** : Après chaque modification, naviguez sur différentes pages pour vérifier le rendu
5. **Sauvegarde** : Notez vos paramètres avant de faire des changements majeurs

## Dépannage

### Le thème ne se charge pas

1. Vérifiez la console du navigateur pour les erreurs
2. Assurez-vous que la connexion à la base de données fonctionne
3. Vérifiez que les paramètres existent dans la table `theme_settings`

### Les couleurs ne s'affichent pas correctement

1. Vérifiez le format des codes couleur (doit être #RRGGBB)
2. Effacez le cache du navigateur
3. Rechargez la page complètement (Ctrl+Shift+R)

### Les polices ne s'appliquent pas

1. Assurez-vous que le nom de la police est correct
2. Vérifiez que la police est disponible
3. Pour des polices personnalisées, ajoutez-les au fichier index.css

## Sécurité

- Seuls les administrateurs peuvent modifier les paramètres du thème
- Les modifications sont appliquées via Row Level Security (RLS)
- Toutes les valeurs sont validées côté client et serveur
