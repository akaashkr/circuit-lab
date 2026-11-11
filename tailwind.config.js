/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Times New Roman"', 'Cambria', 'Georgia', 'serif'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        lab: {
          bg: '#fbfbf2', // Classic soft laboratory cream background like in the user's screenshots
          panel: '#ffffff',
          border: '#e2e8f0',
          blue: '#0220a6',
          red: '#dc2626',
          orange: '#ea580c',
          green: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
