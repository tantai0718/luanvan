/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      'md': '768px',
      'lg': '1200px',
    },
    extend: {
      colors: {
        primary: '#16A34A',
        'primary-dark': '#15803D',
        'primary-light': '#BBF7D0',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        background: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E5E7EB',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.5', fontWeight: '700' }],
        'h2': ['26px', { lineHeight: '1.5', fontWeight: '700' }],
        'h3': ['22px', { lineHeight: '1.5', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        'btn': '12px',
        'input': '10px',
        'card': '16px',
      },
      spacing: {
        'section': '32px',
        'field-gap': '16px',
        'label-gap': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
