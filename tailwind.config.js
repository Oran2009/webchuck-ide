/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"Monaco"', '"Consolas"', 'monospace'],
      },
      invert: {
        20: '.2',
      },
      transitionDuration: {
        DEFAULT: '150ms'
      },
      colors: {
        "orange": {
          DEFAULT: "#FF8833",
          dark: "#D2691E",
          light: "#ffa64d",
          peach: "#FFE5C4",
        },
        "sky-blue": {
          DEFAULT: "#DDEEFF",
          900: "#003366",
          800: "#99D7FF",
          700: "#C9E0F7",
          600: "#9999FF",

          300: "#D3EAFF",
          200: "#DDEEFF",
          100: "#E7F3FF"
        },
        light: "#EEEEEE",
        dark: {
          0: "#000000",
          1: "#111111",
          2: "#222222",
          DEFAULT: "#333333",
          4: "#444444",
          5: "#555555",
          6: "#666666",
          7: "#777777",
          8: "#888888",
          9: "#999999",
          a: "#AAAAAA",
          b: "#BBBBBB",
          c: "#CCCCCC",
          d: "#DDDDDD",
          e: "#EEEEEE",
          f: "#FFFFFF",
        },
        // IDE theme CSS variable colors
        "ide-bg": "var(--ide-bg)",
        "ide-bg-alt": "var(--ide-bg-alt)",
        "ide-text": "var(--ide-text)",
        "ide-text-muted": "var(--ide-text-muted)",
        "ide-accent": "var(--ide-accent)",
        "ide-accent-hover": "var(--ide-accent-hover)",
        "ide-border": "var(--ide-border)",
        "ide-editor-bg": "var(--ide-editor-bg)",
        "ide-console-bg": "var(--ide-console-bg)",
      },
    },
    plugins: [],
  }
}

