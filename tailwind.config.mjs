/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6', // A shade of blue for primary actions
        secondary: '#60A5FA', // A lighter blue
        accent: '#10B981',   // A green for success/accent
        background: '#F8FAFC', // Light background
        text: '#1F2937',     // Dark text
        lightText: '#6B7280', // Lighter text for secondary info
      },
    },
  },
  plugins: [],
};
