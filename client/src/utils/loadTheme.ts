import { theme } from '../config/theme';
import { api } from '../services/api';

export async function loadAndApplyTheme() {
  try {
    const data = await api.theme.getAll();

    if (!data || data.length === 0) {
      return;
    }

    const settings: Record<string, string> = {};
    data.forEach((setting: any) => {
      settings[setting.key] = setting.value;
    });

    if (settings.primary_main) theme.colors.primary.main = settings.primary_main;
    if (settings.primary_light) theme.colors.primary.light = settings.primary_light;
    if (settings.primary_dark) theme.colors.primary.dark = settings.primary_dark;
    if (settings.secondary_main) theme.colors.secondary.main = settings.secondary_main;
    if (settings.secondary_light) theme.colors.secondary.light = settings.secondary_light;
    if (settings.secondary_dark) theme.colors.secondary.dark = settings.secondary_dark;
    if (settings.accent_main) theme.colors.accent.main = settings.accent_main;
    if (settings.accent_light) theme.colors.accent.light = settings.accent_light;
    if (settings.accent_dark) theme.colors.accent.dark = settings.accent_dark;
    if (settings.background_primary) theme.colors.background.primary = settings.background_primary;
    if (settings.background_secondary) theme.colors.background.secondary = settings.background_secondary;
    if (settings.text_primary) theme.colors.text.primary = settings.text_primary;
    if (settings.text_secondary) theme.colors.text.secondary = settings.text_secondary;
    if (settings.success_main) theme.colors.success.main = settings.success_main;
    if (settings.error_main) theme.colors.error.main = settings.error_main;
    if (settings.warning_main) theme.colors.warning.main = settings.warning_main;

    if (settings.font_family_primary) {
      const fontFamily = `'${settings.font_family_primary}', serif`;
      theme.typography.fontFamily.primary = fontFamily;
      theme.heading.h1.fontFamily = fontFamily;
      theme.heading.h2.fontFamily = fontFamily;
      theme.heading.h3.fontFamily = fontFamily;
    }

    if (settings.font_family_secondary) {
      const fontFamily = `'${settings.font_family_secondary}', sans-serif`;
      theme.typography.fontFamily.secondary = fontFamily;
      theme.typography.fontFamily.body = fontFamily;
      theme.body.small.fontFamily = fontFamily;
      theme.body.base.fontFamily = fontFamily;
      theme.body.large.fontFamily = fontFamily;
      theme.heading.h4.fontFamily = fontFamily;
      theme.heading.h5.fontFamily = fontFamily;
      theme.heading.h6.fontFamily = fontFamily;
      theme.button.primary.fontFamily = fontFamily;
      theme.button.secondary.fontFamily = fontFamily;
      theme.button.outline.fontFamily = fontFamily;
    }

    if (settings.button_border_radius) {
      theme.button.primary.borderRadius = settings.button_border_radius;
      theme.button.secondary.borderRadius = settings.button_border_radius;
      theme.button.outline.borderRadius = settings.button_border_radius;
    }

    if (settings.border_radius_md) theme.borderRadius.md = settings.border_radius_md;
    if (settings.border_radius_lg) theme.borderRadius.lg = settings.border_radius_lg;

    console.log('Theme loaded from database');
  } catch (error) {
    console.error('Error loading theme:', error);
  }
}
