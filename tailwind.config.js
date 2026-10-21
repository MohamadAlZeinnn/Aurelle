/** LUMA design tokens. Colors are referenced semantically across the app. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '400px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        ivory: '#FAF8F5',
        porcelain: '#FFFFFF',
        linen: '#F3EEE8',
        blush: { DEFAULT: '#EBD8D3', soft: '#F4E9E5', deep: '#D9BDB5' },
        champagne: { DEFAULT: '#D6BEA8', soft: '#EADDCF', deep: '#B99A7E' },
        espresso: { DEFAULT: '#302823', soft: '#4A3F39' },
        // taupe.DEFAULT keeps WCAG AA (≈5.4:1) on ivory for small text;
        // taupe.light (#8A817C) is reserved for large text and decoration.
        taupe: { DEFAULT: '#6B625D', light: '#8A817C' },
        bronze: { DEFAULT: '#9A7456', soft: '#C9A487' },
        line: { DEFAULT: '#E6DED6', strong: '#D3C8BD' },
        sage: { DEFAULT: '#4F6B52', soft: '#E3EADF' },
        amber: { DEFAULT: '#8A5A12', soft: '#F5E8D0' },
        rosewood: { DEFAULT: '#9B3B35', soft: '#F6E1DE' },
        slate: { DEFAULT: '#43566A', soft: '#E2E8EE' },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Didot', '"Bodoni 72"', 'Georgia', 'serif'],
        sans: ['Jost', '"Helvetica Neue"', 'Arial', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.18em' }],
        'display-sm': ['2rem', { lineHeight: '1.1' }],
        'display-md': ['2.75rem', { lineHeight: '1.05' }],
        'display-lg': ['3.75rem', { lineHeight: '1.02' }],
        'display-xl': ['5rem', { lineHeight: '0.98' }],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '3px',
        md: '4px',
        lg: '6px',
        full: '9999px',
      },
      boxShadow: {
        hairline: '0 0 0 1px rgba(48,40,35,0.06)',
        soft: '0 1px 2px rgba(48,40,35,0.04), 0 8px 24px -12px rgba(48,40,35,0.12)',
        lift: '0 18px 40px -24px rgba(48,40,35,0.28)',
      },
      maxWidth: { page: '88rem', prose: '38rem' },
      transitionTimingFunction: { lux: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { shimmer: 'shimmer 1.6s infinite' },
      aspectRatio: { product: '4 / 5', editorial: '3 / 4', banner: '16 / 7' },
    },
  },
  plugins: [],
};
