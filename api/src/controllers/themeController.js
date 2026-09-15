import { query } from '../config/database.js';

export const getAllThemeSettings = async (req, res) => {
  try {
    const settings = await query(
      'SELECT id, setting_key as `key`, setting_value as `value`, category, description FROM theme_settings ORDER BY category, setting_key'
    );

    res.json(settings);
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    res.status(500).json({ error: 'Failed to fetch theme settings' });
  }
};

export const updateThemeSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    await query(
      'UPDATE theme_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
      [value, key]
    );

    res.json({ message: 'Theme setting updated successfully' });
  } catch (error) {
    console.error('Error updating theme setting:', error);
    res.status(500).json({ error: 'Failed to update theme setting' });
  }
};

export const updateMultipleThemeSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    for (const setting of settings) {
      await query(
        'UPDATE theme_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?',
        [setting.value, setting.key]
      );
    }

    res.json({ message: 'Theme settings updated successfully' });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    res.status(500).json({ error: 'Failed to update theme settings' });
  }
};
