/** Metro's web bundler supports importing .css files directly (side-effect global styles);
 * TypeScript has no built-in ambient type for that, so declare it here. Web-only — native
 * bundling never reaches these imports since they only appear in `.web.tsx` files. */
declare module '*.css';
