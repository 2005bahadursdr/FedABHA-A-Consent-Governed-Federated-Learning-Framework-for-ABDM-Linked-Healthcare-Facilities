/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: '#53473e',
        LightBrown: '#645550',
        darkBrown: '#2c2523',
        darkBown: '#2c2523',
        black: '#1e1917',
        white: '#f1e1d9',
        cyan: '#15d1e9',
        lightCyan: '#88e5f0',
        darkCyan: '#089fb3',
        orange: '#fb9718',
        lightOrange: '#fac27b',
        darkOrange: '#d28422',
        grey: '#626965',
        lightGrey: '#978580',
        dartGrey: '#3f4441',
        darkGrey: '#3f4441',
        primary: {
          50: '#f0f9ff',
          100: '#88e5f0',
          500: '#15d1e9',
          600: '#089fb3',
          900: '#0c4a6e',
        },
        dark: {
          900: '#1e1917',
          800: '#2c2523',
          700: '#3f4441'
        }
      },
      boxShadow: {
        cyanShadow: '0px 0px 20px 0px rgba(21, 209, 233, 0.5)',
        cyanMediumShadow: '0px 0px 40px 10px rgba(21, 209, 233, 0.25)',
        orangeMediumShadow: '0px 0px 40px 10px rgba(251, 151, 24, 0.25)',
      }
    },
  },
  plugins: [],
}

