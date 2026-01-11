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
          DEFAULT: '#075E54',
          dark: '#054D44',
          light: '#128C7E',
        },
        secondary: {
          DEFAULT: '#0A5D52',
        },
        accent: {
          DEFAULT: '#25D366',
          dark: '#20BA5A',
          light: '#34E27A',
        },
        success: '#25D366',
        warning: '#ffa502',
        danger: '#ff4757',
        info: '#128C7E',
        bg: {
          DEFAULT: '#f0f2f5',
          dark: '#075E54',
        },
        surface: '#ffffff',
        text: {
          DEFAULT: '#2d3748',
          light: '#718096',
        },
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'xl': '0 12px 40px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'fade-in-down': 'fadeInDown 0.8s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'float': 'float 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(50px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%': { transform: 'translate(0, 0) rotate(0deg)' },
          '100%': { transform: 'translate(-50px, -50px) rotate(360deg)' },
        },
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
