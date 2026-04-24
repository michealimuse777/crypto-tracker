/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './utils/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F14',
        card: '#111827',
        border: '#1F2937',
        text: '#E5E7EB',
        muted: '#9CA3AF',
        positive: '#16A34A',
        negative: '#DC2626',
        accent: '#3B82F6'
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
