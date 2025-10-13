// tailwind.config.js
module.exports = {
  content: [
    "./client/index.html",
    "./client/**/*.{html,js,ts,jsx,tsx}",
    "./client/src/**/*.{js,jsx,ts,tsx,html}",
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./app/**/*.{ts,tsx,js,jsx,html}",
    "./components/**/*.{ts,tsx,js,jsx,html}"
  ],
  safelist: [
    "grid",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-4",
    "sm:grid-cols-2",
    "sm:grid-cols-4",
    "md:grid-cols-3",
    "lg:grid-cols-4",
    "gap-4",
  ],
  theme: {
    extend: {
      colors: {
        // Design tokens from tokens.json
        "app-background": "#EDE9E4", // Background.Beige
        "app-foreground": "#000000", // Text.HeroPrimary
        "bestseller-bg": "#4E4739", // BestSeller.Background
        "brand-tuatara": "#3c3c3b",
        "brand-teak": "#ae905c",
        "brand-tobacco": "#675b46",
        "brand-goben": "#746d52",

        // Existing colors
        colorbackgroundbeige: "var(--colorbackgroundbeige)",
        colorbackgroundbestseller: "var(--colorbackgroundbestseller)",
        colorbackgroundcartbutton: "var(--colorbackgroundcartbutton)",
        colorbackgroundcategoryselector:
          "var(--colorbackgroundcategoryselector)",
        colorbackgroundsearchfield: "var(--colorbackgroundsearchfield)",
        coloriconcart: "var(--coloriconcart)",
        coloricondelivery: "var(--coloricondelivery)",
        colorsurfacecard: "var(--colorsurfacecard)",
        colorsurfacemenucard: "var(--colorsurfacemenucard)",
        colortextcarddescription: "var(--colortextcarddescription)",
        colortextcategorytext: "var(--colortextcategorytext)",
        colortextdeliveryadcta: "var(--colortextdeliveryadcta)",
        colortextdeliveryadheading: "var(--colortextdeliveryadheading)",
        colortextdeliveryadhighlight: "var(--colortextdeliveryadhighlight)",
        colortextdeliveryadphone: "var(--colortextdeliveryadphone)",
        colortextherodescription: "var(--colortextherodescription)",
        colortextheroprimary: "var(--colortextheroprimary)",
        colortextmenudishname: "var(--colortextmenudishname)",
        colortextmenuprice: "var(--colortextmenuprice)",
        colortextmenutitle: "var(--colortextmenutitle)",
        colortextsectiontitle: "var(--colortextsectiontitle)",
        "effecttext-shadowcardtitle": "var(--effecttext-shadowcardtitle)",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        "typography-body-searchplaceholder":
          "var(--typography-body-searchplaceholder-font-family)",
        "typography-card-description":
          "var(--typography-card-description-font-family)",
        "typography-card-title": "var(--typography-card-title-font-family)",
        "typography-deliveryad-CTA":
          "var(--typography-deliveryad-CTA-font-family)",
        "typography-deliveryad-heading":
          "var(--typography-deliveryad-heading-font-family)",
        "typography-deliveryad-highlight":
          "var(--typography-deliveryad-highlight-font-family)",
        "typography-deliveryad-phonenumber":
          "var(--typography-deliveryad-phonenumber-font-family)",
        "typography-her-tagline": "var(--typography-her-tagline-font-family)",
        "typography-hero-description":
          "var(--typography-hero-description-font-family)",
        "typography-hero-description-b":
          "var(--typography-hero-description-b-font-family)",
        "typography-hero-h1": "var(--typography-hero-h1-font-family)",
        "typography-hero-h2": "var(--typography-hero-h2-font-family)",
        "typography-menu-categorytext":
          "var(--typography-menu-categorytext-font-family)",
        "typography-menu-dishname":
          "var(--typography-menu-dishname-font-family)",
        "typography-menu-price": "var(--typography-menu-price-font-family)",
        "typography-menu-title": "var(--typography-menu-title-font-family)",
        "typography-section-title":
          "var(--typography-section-title-font-family)",
        sans: [
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      boxShadow: {
        // Design tokens shadows
        searchbox: "0px 1px 4px rgba(0,0,0,0.25)",
        card: "0px 2px 8px rgba(0,0,0,0.10)",

        // Existing shadows
        "color-background-bestseller-shadow":
          "var(--color-background-bestseller-shadow)",
        "effect-card-shadow": "var(--effect-card-shadow)",
        "effect-image-shadow-card": "var(--effect-image-shadow-card)",
        "effect-shadow-cartbutton": "var(--effect-shadow-cartbutton)",
        "effect-shadow-menucard": "var(--effect-shadow-menucard)",
        "effect-shadow-searchbox": "var(--effect-shadow-searchbox)",
        "effect-text-shadow-categorytext":
          "var(--effect-text-shadow-categorytext)",
        "effect-text-shadow-heroh1": "var(--effect-text-shadow-heroh1)",
        "effect-text-shadow-heroh2": "var(--effect-text-shadow-heroh2)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
  darkMode: ["class"],
};
