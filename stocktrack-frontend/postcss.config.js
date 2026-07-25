import tailwindcss from "@tailwindcss/postcss"
import autoprefixer from "autoprefixer"

// Explicitly load the Tailwind CSS v4 PostCSS plugin so Vite processes
// @import "tailwindcss" and new v4 directives in src/index.css.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}