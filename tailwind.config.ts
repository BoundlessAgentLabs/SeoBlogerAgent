import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        muted: "#667085",
        paper: "#f8fafc",
        accent: "#2563eb",
      },
    },
  },
  plugins: [typography],
};

export default config;
