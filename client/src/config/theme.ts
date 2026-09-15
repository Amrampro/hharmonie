// client/src/config/theme.ts
export const theme = {
  colors: {
    primary: {
      main: '#A47788',
      light: '#D4B6C1',
      dark: '#7B5365',
      50: '#F5EFEB',
      100: '#EFE3E4',
      200: '#D4B6C1',
      300: '#CCADA9',
      400: '#B9909F',
      500: '#A47788',
      600: '#8D6074',
      700: '#72495C',
      800: '#583746',
      900: '#402633',
    },
    secondary: {
      main: '#CCADA9',
      light: '#E8D7D8',
      dark: '#A47788',
    },
    accent: {
      main: '#C99A32',
      light: '#E4C06B',
      dark: '#9F761F',
    },
    background: {
      primary: '#F5EFEB',
      secondary: '#FFFDFC',
      tertiary: '#E8D7D8',
      sage: '#CCADA9',
    },
    text: {
      primary: '#1B1108',
      secondary: '#58311B',
      light: '#7B6670',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#E8DAD5',
      main: '#CCADA9',
      dark: '#A47788',
    },
    success: {
      main: '#9b7d6dff',
      light: '#8FB590',
      dark: '#558457',
      50: '#F3F8F3',
    },
    error: {
      main: '#C86B6B',
      light: '#DC9191',
      dark: '#A84747',
      50: '#FCF3F3',
    },
    warning: {
      main: '#C99A32',
      light: '#E4C06B',
      dark: '#9F761F',
    },
    status: {
      success: '#6D9B6E',
      warning: '#D4A574',
      error: '#C86B6B',
      info: '#7A9CB8',
    },
  },

  typography: {
    fontFamily: {
      primary: "'Playfair Display', serif",
      secondary: "'Inter', 'Segoe UI', sans-serif",
      body: "'Inter', 'Segoe UI', sans-serif",
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      heading: 1.3,
      body: 1.6,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
      wider: '0.05em',
    },
  },

  body: {
    small: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#113D23',
    },
    base: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#113D23',
    },
    large: {
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: '#113D23',
    },
  },

  heading: {
    h1: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: '#113D23',
      letterSpacing: '0',
    },
    h2: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#113D23',
      letterSpacing: '0',
    },
    h3: {
      fontFamily: "'Playfair Display', serif",
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#113D23',
    },
    h4: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#113D23',
    },
    h5: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#113D23',
    },
    h6: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#113D23',
    },
  },

  button: {
    primary: {
      backgroundColor: '#C99A32',
      color: '#FFFFFF',
      hoverBackgroundColor: '#AB8C6B',
      activeBackgroundColor: '#9F761F',
      borderRadius: '0.375rem',
      padding: '0.75rem 2rem',
      fontSize: '1rem',
      fontWeight: 500,
      fontFamily: "'Inter', sans-serif",
      border: 'none',
      transition: 'all 0.3s ease',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#1B1108',
      hoverBackgroundColor: '#F0E2E0',
      activeBackgroundColor: '#E8D7D8',
      borderRadius: '0.375rem',
      padding: '0.75rem 2rem',
      fontSize: '1rem',
      fontWeight: 500,
      fontFamily: "'Inter', sans-serif",
      border: '2px solid #A47788',
      transition: 'all 0.3s ease',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#A47788',
      hoverBackgroundColor: '#A47788',
      hoverColor: '#FFFFFF',
      activeBackgroundColor: '#8A9B82',
      borderRadius: '0.375rem',
      padding: '0.75rem 2rem',
      fontSize: '1rem',
      fontWeight: 500,
      fontFamily: "'Inter', sans-serif",
      border: '2px solid #A47788',
      transition: 'all 0.3s ease',
    },
    small: {
      padding: '0.5rem 1.25rem',
      fontSize: '0.875rem',
    },
    large: {
      padding: '1rem 2.5rem',
      fontSize: '1.125rem',
    },
  },

  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
    '5xl': '8rem',    // 128px
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    card: '0 2px 8px rgba(44, 62, 45, 0.08)',
    hover: '0 8px 16px rgba(44, 62, 45, 0.12)',
  },

  transition: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  container: {
    maxWidth: '1280px',
    padding: {
      mobile: '1rem',
      tablet: '2rem',
      desktop: '3rem',
    },
  },
};

export type Theme = typeof theme;
