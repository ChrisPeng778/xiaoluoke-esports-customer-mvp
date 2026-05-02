import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rock: {
          blue: "#2F80ED",
          sky: "#EAF4FF",
          purple: "#A78BFA",
          lavender: "#F3ECFF",
          gold: "#F7B731",
          ink: "#1F2937",
          mint: "#39C7A5",
        },
      },
      boxShadow: {
        soft: "0 18px 42px rgba(62, 57, 48, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
