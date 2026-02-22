/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./vendeur/*.html",
    "./admin/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2383e2',
          hover: '#1a6bc4',
          light: '#e8f0fe',
        },
        accent: '#2383e2',
        success: '#4daa57',
        warning: '#cb912f',
        danger: '#e03e3e',
        info: '#2383e2',
        bg: {
          DEFAULT: '#ffffff',
          secondary: '#f7f7f5',
          hover: '#efefef',
          tertiary: '#f1f1ef',
        },
        surface: '#ffffff',
        text: {
          DEFAULT: '#37352f',
          secondary: '#787774',
          tertiary: '#b4b4b0',
        },
        border: {
          DEFAULT: '#e5e5e3',
          dark: '#d3d3d0',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '10px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.08)',
        'ring': '0 0 0 2px rgba(35, 131, 226, 0.15)',
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
      },
    },
  },
  plugins: [],
}
