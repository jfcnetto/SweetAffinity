import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vibrant-orange': '#FF6B6B',
        'intense-red': '#FD267D',
        'gradient-pink': '#FF5864',
        'gradient-orange': '#FD297B',
        'neutral-gray': '#F5F5F5',
        'dark-gray': '#424242',
      }
    }
  },
  plugins: [],
}
export default config
