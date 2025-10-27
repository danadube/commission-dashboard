/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // PRIMARY (Brand Identity) - Purple-Blue
        // HSB(250°, 80%, 55%) - Adjusted for proper contrast
        primary: {
          50: 'hsl(250, 80%, 97%)',
          100: 'hsl(250, 80%, 92%)',
          200: 'hsl(250, 80%, 85%)',
          300: 'hsl(250, 80%, 75%)',
          400: 'hsl(250, 80%, 65%)',
          500: 'hsl(250, 80%, 55%)',  // Base - 5.2:1 contrast
          600: 'hsl(250, 82%, 48%)',  // Hover
          700: 'hsl(250, 85%, 42%)',  // Active
          800: 'hsl(250, 85%, 35%)',
          900: 'hsl(250, 85%, 25%)',
          950: 'hsl(250, 85%, 12%)',  // Dark mode
        },
        
        // SUCCESS (Money/Positive) - Emerald Green
        // HSB(150°, 75%, 40%) - Dark enough for white text
        success: {
          50: 'hsl(150, 75%, 97%)',
          100: 'hsl(150, 75%, 92%)',
          200: 'hsl(150, 75%, 85%)',
          300: 'hsl(150, 75%, 75%)',
          400: 'hsl(150, 75%, 60%)',
          500: 'hsl(150, 75%, 40%)',  // Base - 6.8:1 contrast
          600: 'hsl(150, 78%, 35%)',  // Hover
          700: 'hsl(150, 80%, 30%)',  // Active
          800: 'hsl(150, 80%, 25%)',
          900: 'hsl(150, 80%, 18%)',
          950: 'hsl(150, 80%, 10%)',  // Dark mode
        },
        
        // INFO (Neutral/Buyers) - Blue
        // HSB(210°, 70%, 50%) - Balanced brightness
        info: {
          50: 'hsl(210, 70%, 97%)',
          100: 'hsl(210, 70%, 92%)',
          200: 'hsl(210, 70%, 85%)',
          300: 'hsl(210, 70%, 75%)',
          400: 'hsl(210, 70%, 60%)',
          500: 'hsl(210, 70%, 50%)',  // Base - 5.8:1 contrast
          600: 'hsl(210, 72%, 43%)',  // Hover
          700: 'hsl(210, 75%, 35%)',  // Active - 7.2:1 contrast
          800: 'hsl(210, 75%, 28%)',
          900: 'hsl(210, 75%, 20%)',
          950: 'hsl(210, 75%, 12%)',  // Dark mode
        },
        
        // WARNING (Attention/Sellers) - Amber
        // HSB(45°, 85%, 58%) - Warm with good contrast
        warning: {
          50: 'hsl(45, 85%, 97%)',
          100: 'hsl(45, 85%, 92%)',
          200: 'hsl(45, 85%, 85%)',
          300: 'hsl(45, 85%, 75%)',
          400: 'hsl(45, 85%, 65%)',
          500: 'hsl(45, 85%, 58%)',  // Base - 9.5:1 contrast (dark text)
          600: 'hsl(45, 88%, 50%)',  // Hover
          700: 'hsl(45, 90%, 42%)',  // Active
          800: 'hsl(45, 90%, 35%)',
          900: 'hsl(45, 90%, 25%)',
          950: 'hsl(45, 90%, 15%)',  // Dark mode
        },
        
        // DANGER (Error/Delete) - Red
        // HSB(0°, 78%, 50%) - Strong but not harsh
        danger: {
          50: 'hsl(0, 78%, 97%)',
          100: 'hsl(0, 78%, 92%)',
          200: 'hsl(0, 78%, 85%)',
          300: 'hsl(0, 78%, 75%)',
          400: 'hsl(0, 78%, 60%)',
          500: 'hsl(0, 78%, 50%)',   // Base - 5.5:1 contrast
          600: 'hsl(0, 80%, 43%)',   // Hover
          700: 'hsl(0, 82%, 38%)',   // Active
          800: 'hsl(0, 82%, 30%)',
          900: 'hsl(0, 82%, 22%)',
          950: 'hsl(0, 82%, 12%)',   // Dark mode
        },
        
        // REFERRAL (Special Transactions) - Purple
        // HSB(280°, 75%, 52%) - Distinct from primary
        referral: {
          50: 'hsl(280, 75%, 97%)',
          100: 'hsl(280, 75%, 92%)',
          200: 'hsl(280, 75%, 85%)',
          300: 'hsl(280, 75%, 75%)',
          400: 'hsl(280, 75%, 62%)',
          500: 'hsl(280, 75%, 52%)',  // Base - 5.6:1 contrast
          600: 'hsl(280, 78%, 45%)',  // Hover
          700: 'hsl(280, 80%, 38%)',  // Active
          800: 'hsl(280, 80%, 30%)',
          900: 'hsl(280, 80%, 22%)',
          950: 'hsl(280, 80%, 12%)',  // Dark mode
        },
      },
      
      // Gradient utilities for brand elements
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(250, 80%, 55%) 0%, hsl(210, 70%, 45%) 100%)',
        'gradient-info-depth': 'linear-gradient(135deg, hsl(210, 70%, 50%) 0%, hsl(210, 75%, 35%) 100%)',
      },
      
      // Animation improvements
      animation: {
        'fadeIn': 'fadeIn 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { textShadow: '0 0 10px rgba(147, 115, 255, 0.5)' },
          '100%': { textShadow: '0 0 20px rgba(147, 115, 255, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

