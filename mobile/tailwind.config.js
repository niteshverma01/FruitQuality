/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fruit: {
          mango: "#F59E0B",
          leaf: "#22C55E",
          berry: "#EC4899",
          grape: "#6366F1",
          lime: "#A3E635",
          cocoa: "#7C2D12",
          night: "#09090B"
        }
      }
    }
  },
  plugins: []
};
