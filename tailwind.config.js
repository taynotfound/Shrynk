/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./public/**/*.{html,js}",
    "./views/**/*.{ejs,html}"
  ],
  theme: {
    extend: {
      colors: {
        lightBlue: '#3373EA',
      },
    },
  },
  plugins: [],
}

