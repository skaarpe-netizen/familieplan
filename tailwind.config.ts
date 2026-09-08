import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101217',
        panel: '#191c22',
        line: '#2b2f38',
        muted: '#9097a6',
        cream: '#f2efe7',
        lilac: '#a892ff',
        mint: '#7ed6b2',
        amber: '#f2b66d',
        coral: '#ee8990',
      },
      fontFamily: { sans: ['"DM Sans"', 'sans-serif'], display: ['"Space Grotesk"', 'sans-serif'] },
    },
  },
  plugins: [],
} satisfies Config
