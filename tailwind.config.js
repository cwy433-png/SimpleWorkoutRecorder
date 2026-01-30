/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: "#0a0a0a",
                surface: {
                    DEFAULT: "#1C1C1E",
                    hover: "#2C2C2E",
                },
                primary: {
                    DEFAULT: "#D0FD3E",
                    dim: "#a6cc2b",
                },
                secondary: "#00E5FF", // Cyan
                alert: "#FF453A",
                text: {
                    main: "#FFFFFF",
                    muted: "#8E8E93",
                },
                border: "#3A3A3C",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            animation: {
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "in": "fadeIn 0.5s ease-out forwards",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
}
