/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        status: {
          todo: '#94a3b8',
          'in-progress': '#3b82f6',
          'in-review': '#f59e0b',
          done: '#10b981',
          blocked: '#ef4444',
          custom: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
