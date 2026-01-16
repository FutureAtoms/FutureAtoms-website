/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./public/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
      colors: {
        'cyan': {
          400: '#00ffff',
          500: '#00e5e5',
          600: '#00cccc',
        }
      }
    },
  },
  plugins: [],
}
