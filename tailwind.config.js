/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#54cf17",
        "danger": "#ef4444",
        "warning": "#eab308",
        "background-light": "#f6f8f6",
        "background-dark": "#0a0f0a",
        "panel-dark": "#121a11",
        "grid-line": "#25381e",
        // Legacy mappings to prevent old components from completely breaking during transition
        crtBlack: '#0a0f0a',
        phosphor: '#54cf17',
        amberWarning: '#eab308',
        threatRed: '#ef4444',
      },
      fontFamily: {
        "display": ["Space Grotesk", "monospace"],
        "mono": ["Space Grotesk", "monospace"],
        "sharetech": ["Space Grotesk", "monospace"], // legacy mapping
      },
      backgroundImage: {
        'crt-lines': 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        'radar-sweep': 'conic-gradient(from 0deg, transparent 0deg, rgba(84, 207, 23, 0.1) 60deg, rgba(84, 207, 23, 0.5) 90deg, transparent 91deg)',
      },
      animation: {
        'radar-spin': 'spin 4s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink-fast': 'blink 1s steps(2, start) infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
      },
      boxShadow: {
        phosphor: '0 0 8px rgba(84,207,23,0.5)',
        'amber-glow': '0 0 8px rgba(234,179,8,0.5)',
        'threat-glow': '0 0 10px rgba(239,68,68,0.5)'
      }
    },
  },
  plugins: [],
}
