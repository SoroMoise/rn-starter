const palette = require('./constants/palette')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        accent: palette.accent,
        pro: palette.pro,
        success: palette.success,
      },
    },
  },
  plugins: [],
}
