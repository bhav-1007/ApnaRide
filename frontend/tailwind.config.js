/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12201A',      // text, deep green-black
        cng: { DEFAULT: '#0B6B47', dark: '#084D34', soft: '#DCEBE3' }, // Delhi CNG-auto green
        peeli: { DEFAULT: '#FFC20E', dark: '#E5AC00' },               // commercial-plate yellow
        mist: '#EEF2EE',     // page background
        line: '#D5DCD6',     // dividers
        muted: '#53625A',    // secondary text (4.9:1 on white)
        signal: '#C8362B',   // errors, cancel
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Mukta', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
