/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orbynex: {
          deepSpace: '#060f24',
          deepTint: '#071a3d',
          blue: '#1463ff',
          cyan: '#00d4ff',
          indigo: '#4f46e5',
          magenta: '#d946ef',
          softCloud: '#f5f8ff',
          graphite: '#111827',
          surfaceDark: '#0c1b3a',
          surfaceStrong: '#0f2248',
          lineDark: 'rgba(100, 150, 255, 0.12)',
          lineLight: 'rgba(20, 99, 255, 0.10)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        display: ['Montserrat', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glowCyan: '0 0 35px rgba(0, 212, 255, 0.25)',
        glowMagenta: '0 0 35px rgba(217, 70, 239, 0.25)',
        glowBlue: '0 0 35px rgba(20, 99, 255, 0.25)',
        cardDark: '0 8px 32px rgba(0, 10, 40, 0.40)',
        cardLight: '0 8px 24px rgba(7, 26, 61, 0.08)',
      },
      backgroundImage: {
        'gradient-orbynex': 'linear-gradient(135deg, #00d4ff 0%, #1463ff 50%, #d946ef 100%)',
        'gradient-dark-card': 'linear-gradient(180deg, rgba(12, 27, 58, 0.9) 0%, rgba(15, 34, 72, 0.7) 100%)',
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
