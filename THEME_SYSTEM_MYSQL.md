# Theme Configuration System with MySQL

## Overview

The theme configuration system has been fully migrated from Supabase to MySQL. Administrators can now customize website colors, fonts, and styles directly from the admin panel.

## Database Schema

### Theme Settings Table

```sql
CREATE TABLE IF NOT EXISTS theme_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Default Settings

The schema includes 21 default theme settings:
- **Colors**: Primary, secondary, accent, background, text, status colors
- **Typography**: Primary font (Playfair Display) and secondary font (Inter)
- **Styles**: Button border radius, general border radius values

## API Endpoints

### GET /api/theme
Retrieves all theme settings.

**Response:**
```json
[
  {
    "id": "uuid",
    "key": "primary_main",
    "value": "#A8B89F",
    "category": "colors",
    "description": "Main primary color"
  }
]
```

### PUT /api/theme/:key
Updates a single theme setting.

**Request:**
```json
{
  "value": "#FF5733"
}
```

### PUT /api/theme
Updates multiple theme settings at once.

**Request:**
```json
{
  "settings": [
    { "key": "primary_main", "value": "#FF5733" },
    { "key": "secondary_main", "value": "#333333" }
  ]
}
```

## Frontend Implementation

### Theme Loading

The theme is loaded at application startup via `loadAndApplyTheme()` in `utils/loadTheme.ts`:

1. Fetches all settings from the API
2. Applies custom values to the default theme object
3. Updates typography, colors, and styles dynamically

### Admin Interface

Access: **Admin Panel → Configuration du thème**

Features:
- Visual color pickers for all color settings
- Text inputs for fonts and dimensions
- Organized by category (Colors, Typography, Buttons, General)
- Reset button to restore default values
- Auto-reload after saving changes

### File Structure

```
client/src/
├── pages/admin/
│   └── AdminThemePage.tsx          # Theme configuration UI
├── services/
│   └── api.ts                      # Theme API methods added
├── utils/
│   └── loadTheme.ts               # Theme loading logic
└── config/
    └── theme.ts                   # Default theme configuration

api/src/
├── controllers/
│   └── themeController.js         # Theme API controller
└── routes/
    └── theme.js                   # Theme routes

api/schema.sql                     # Database schema with theme_settings
```

## Usage

### Loading the Database

1. Import the schema into your MySQL database:
```bash
mysql -u your_user -p your_database < api/schema.sql
```

2. This will create all tables including `theme_settings` with default values.

### Customizing the Theme

1. Log in as admin
2. Navigate to Admin Panel
3. Click "Configuration du thème" in the sidebar
4. Modify colors using color pickers or enter hex codes
5. Update fonts and border radius values
6. Click "Enregistrer" to save
7. Page will reload with new theme applied

### Resetting to Defaults

Click the "Réinitialiser" button to restore default theme values.

## Important Notes

### Removed Dependencies

- **Supabase**: Completely removed from the project
- Deleted files:
  - `/client/src/lib/supabase.ts`
  - `/client/src/contexts/ThemeContext.tsx`
  - `/supabase/` directory

### Product Detail Page

The ProductDetailPage currently has placeholder fetch functions. It requires:
- Either an API endpoint to fetch product by ID
- Or refactoring to use product slug instead of ID

This is a known limitation and should be addressed based on your routing strategy.

## Configuration

### Environment Variables

Client (`.env`):
```
VITE_API_URL=http://localhost:3001/api
```

API (`.env`):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
DB_PORT=3306
```

## API Server Setup

Ensure your MySQL database is running and configured in the API `.env` file, then:

```bash
cd api
npm install
npm start
```

The theme endpoints will be available at `/api/theme`.

## Benefits

1. **No External Dependencies**: Uses MySQL instead of Supabase
2. **Persistent Customization**: Theme changes saved in database
3. **Easy Management**: Admin UI for non-technical users
4. **Instant Updates**: Changes apply immediately on page reload
5. **Flexible**: Easy to add new theme settings
6. **Secure**: Only admins can modify theme settings

## Troubleshooting

### Theme Not Loading
- Check API connection in browser console
- Verify MySQL database is running
- Confirm `theme_settings` table exists and has data

### Colors Not Applying
- Clear browser cache
- Check that hex color codes are valid (#RRGGBB format)
- Verify theme settings were saved successfully

### Build Errors
- Run `npm install` in client directory
- Ensure all Supabase references are removed
- Check that `api.theme` methods exist in `services/api.ts`
