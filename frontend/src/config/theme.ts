/**
 * Centralized Theme Configuration
 * 
 * Update colors here to change the entire application's color scheme.
 * All colors are defined in HSL format (Hue, Saturation, Lightness).
 * 
 * Format: "H S% L%" where:
 * - H: Hue (0-360)
 * - S: Saturation (0-100%)
 * - L: Lightness (0-100%)
 */

export const theme = {
  // Primary Brand Colors - #002f6c (Dark Blue)
  primary: {
    DEFAULT: "214 100% 21%",     // Main brand color (#002f6c)
    foreground: "0 0% 100%",     // Text on primary (white)
    light: "214 100% 95%",        // Light variant
    dark: "214 100% 15%",         // Dark variant
  },

  // Secondary Colors - #ffc800 (Bright Yellow)
  secondary: {
    DEFAULT: "47 100% 50%",      // Secondary brand color (#ffc800)
    foreground: "0 0% 0%",       // Text on secondary (black)
    light: "47 100% 95%",         // Light variant
    dark: "47 100% 40%",          // Dark variant
  },

  // Accent Colors - Light Parrot (Teal/Green)
  accent: {
    DEFAULT: "160 80% 50%",      // Accent color (light parrot/teal)
    foreground: "0 0% 100%",     // Text on accent
    light: "160 80% 95%",         // Light variant
    dark: "160 80% 35%",         // Dark variant
  },

  // Semantic Colors
  success: {
    DEFAULT: "120 100% 35%",     // Success/Green
    foreground: "0 0% 100%",
    light: "120 100% 95%",
    dark: "120 100% 25%",
  },

  warning: {
    DEFAULT: "45 100% 50%",      // Warning/Orange
    foreground: "0 0% 0%",
    light: "45 100% 95%",
    dark: "45 100% 40%",
  },

  error: {
    DEFAULT: "0 84% 60%",        // Error/Red
    foreground: "0 0% 100%",
    light: "0 84% 95%",
    dark: "0 84% 45%",
  },

  info: {
    DEFAULT: "200 100% 50%",     // Info/Blue
    foreground: "0 0% 100%",
    light: "200 100% 95%",
    dark: "200 100% 40%",
  },

  // Calendar Event Type Colors (using brand colors where appropriate)
  eventTypes: {
    custody: {
      DEFAULT: "214 100% 21%",   // Primary Blue (#002f6c)
      light: "214 100% 95%",
      text: "214 100% 15%",
      border: "214 100% 70%",
    },
    holiday: {
      DEFAULT: "47 100% 50%",    // Secondary Yellow (#ffc800)
      light: "47 100% 95%",
      text: "47 100% 30%",
      border: "47 100% 80%",
    },
    school: {
      DEFAULT: "160 80% 50%",    // Light Parrot/Teal
      light: "160 80% 95%",
      text: "160 80% 30%",
      border: "160 80% 80%",
    },
    medical: {
      DEFAULT: "340 100% 50%",   // Pink/Rose (complementary)
      light: "340 100% 95%",
      text: "340 100% 30%",
      border: "340 100% 80%",
    },
    activity: {
      DEFAULT: "30 100% 55%",    // Orange (warm accent)
      light: "30 100% 95%",
      text: "30 100% 30%",
      border: "30 100% 80%",
    },
  },

  // Status Colors
  status: {
    pending: {
      DEFAULT: "47 100% 50%",    // Secondary Yellow (#ffc800)
      light: "47 100% 95%",
      text: "47 100% 30%",
      border: "47 100% 80%",
    },
    approved: {
      DEFAULT: "160 80% 50%",    // Light Parrot/Teal
      light: "160 80% 95%",
      text: "160 80% 30%",
      border: "160 80% 80%",
    },
    disputed: {
      DEFAULT: "0 84% 60%",       // Red (error)
      light: "0 84% 95%",
      text: "0 84% 30%",
      border: "0 84% 80%",
    },
    paid: {
      DEFAULT: "214 100% 21%",    // Primary Blue (#002f6c)
      light: "214 100% 95%",
      text: "214 100% 15%",
      border: "214 100% 70%",
    },
  },

  // Expense Colors
  expense: {
    DEFAULT: "340 100% 50%",     // Rose/Pink
    light: "340 100% 95%",
    text: "340 100% 30%",
    border: "340 100% 80%",
  },

  // Document Colors
  document: {
    DEFAULT: "250 100% 50%",     // Indigo
    light: "250 100% 95%",
    text: "250 100% 30%",
    border: "250 100% 80%",
  },

  // Neutral Colors
  neutral: {
    background: "0 0% 100%",
    foreground: "0 0% 0%",
    muted: "0 0% 96%",
    "muted-foreground": "0 0% 45%",
    border: "0 0% 90%",
    input: "0 0% 90%",
    card: "0 0% 100%",
    "card-foreground": "0 0% 0%",
  },

  // Bridge Brand Colors
  bridge: {
    red: "0 84% 60%",              // Error/Alert red
    yellow: "47 100% 50%",         // Secondary (#ffc800)
    blue: "214 100% 21%",          // Primary (#002f6c)
    green: "160 80% 50%",          // Light Parrot/Teal
    black: "0 0% 0%",              // Black
  },
} as const;

/**
 * Helper function to convert HSL string to CSS variable format
 */
export function hslToCssVar(hsl: string): string {
  return hsl;
}

/**
 * Get theme color as CSS variable
 */
export function getThemeColor(path: string): string {
  const keys = path.split('.');
  let value: unknown = theme;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Theme color not found: ${path}`);
      return "0 0% 0%";
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (value && typeof value === 'object' && 'DEFAULT' in value) {
    return (value as { DEFAULT: string }).DEFAULT;
  }
  
  return "0 0% 0%";
}

/**
 * Export theme for use in CSS generation
 */
export default theme;

