import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        ivory: "#2D0C1C", // main background
        emerald: "#441629", // section background (legacy token name, repurposed)
        "emerald-deep": "#381222", // card background (legacy token name, repurposed)
        "matte-black": "#2D0C1C", // darkest tone, matches main bg / button text
        // Text
        warmwhite: "#FDF8F6", // white text
        sand: "#E8D8CF", // light beige text
        charcoal: "#E8D8CF", // default body text (kept light for the dark theme)
        "text-secondary": "#BFA89B",
        // Buttons / accents
        champagne: "#DEB092", // primary
        maroon: "#C88F73", // hover
        "antique-gold": "#DEB092", // label accent, same tone as primary
        // Extra tonal variety mixed from the new palette, for decorative gradients only
        "wine-mid": "#5c1f35",
        "rose-dust": "#6b3a42",
        "wine-deep": "#1a0610",
        terracotta: "#8a5a4a",
        line: "rgba(222,176,146,0.28)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        label: ["var(--font-label)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
    },
  },
  plugins: [],
};

export default config;
