import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "oklch(var(--bg) / <alpha-value>)",
          sunk: "oklch(var(--bg-sunk) / <alpha-value>)",
          deep: "oklch(var(--bg-deep) / <alpha-value>)",
        },
        surface: "oklch(var(--surface) / <alpha-value>)",
        border: {
          DEFAULT: "oklch(var(--border) / <alpha-value>)",
          2: "oklch(var(--border-2) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "oklch(var(--ink) / <alpha-value>)",
          2: "oklch(var(--ink-2) / <alpha-value>)",
          3: "oklch(var(--ink-3) / <alpha-value>)",
          4: "oklch(var(--ink-4) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "oklch(var(--brand) / <alpha-value>)",
          ink: "oklch(var(--brand-ink) / <alpha-value>)",
          soft: "oklch(var(--brand-soft) / <alpha-value>)",
          foreground: "oklch(var(--brand-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "oklch(var(--success) / <alpha-value>)",
          soft: "oklch(var(--success-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "oklch(var(--warning) / <alpha-value>)",
          soft: "oklch(var(--warning-soft) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          soft: "oklch(var(--destructive-soft) / <alpha-value>)",
        },
        info: {
          DEFAULT: "oklch(var(--info) / <alpha-value>)",
          soft: "oklch(var(--info-soft) / <alpha-value>)",
        },
        role: {
          buyer: {
            DEFAULT: "oklch(var(--role-buyer) / <alpha-value>)",
            soft: "oklch(var(--role-buyer-soft) / <alpha-value>)",
            ink: "oklch(var(--role-buyer-ink) / <alpha-value>)",
          },
          seller: {
            DEFAULT: "oklch(var(--role-seller) / <alpha-value>)",
            soft: "oklch(var(--role-seller-soft) / <alpha-value>)",
            ink: "oklch(var(--role-seller-ink) / <alpha-value>)",
          },
          past: {
            DEFAULT: "oklch(var(--role-past) / <alpha-value>)",
            soft: "oklch(var(--role-past-soft) / <alpha-value>)",
            ink: "oklch(var(--role-past-ink) / <alpha-value>)",
          },
          vendor: {
            DEFAULT: "oklch(var(--role-vendor) / <alpha-value>)",
            soft: "oklch(var(--role-vendor-soft) / <alpha-value>)",
            ink: "oklch(var(--role-vendor-ink) / <alpha-value>)",
          },
          soi: {
            DEFAULT: "oklch(var(--role-soi) / <alpha-value>)",
            soft: "oklch(var(--role-soi-soft) / <alpha-value>)",
            ink: "oklch(var(--role-soi-ink) / <alpha-value>)",
          },
        },
        stage: {
          new: "var(--stage-new)",
          contacted: "var(--stage-contacted)",
          engaged: "var(--stage-engaged)",
          nurturing: "var(--stage-nurturing)",
          appt: "var(--stage-appt)",
          agreement: "var(--stage-agreement)",
        },
        // Shadcn aliases
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "oklch(var(--popover) / <alpha-value>)",
          foreground: "oklch(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        ring: "oklch(var(--ring) / <alpha-value>)",
      },
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius)",
        sm: "var(--radius-sm)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;