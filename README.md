# kirishoru.github.io

Built with Astro and TypeScript, deployed to GitHub Pages by GitHub Actions.

- `/prioritize/`: rank options by comparing two at a time (binary insertion, then a check pass that rechecks contradictions)
- `/bodycomp/`: body fat and calorie estimates

Styled with Tailwind CSS 4 and daisyUI 5; brand colors override the built-in light and dark themes in `src/style.css`.

```
npm install
npm run dev      # local dev server
npm run build    # type-check, test, and build to dist/
```

All data stays in the browser. There is no backend.
