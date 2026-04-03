// Use require.resolve to pin @tailwindcss/postcss to THIS project's node_modules.
// This prevents PostCSS from walking up to the parent directory (which has no node_modules).

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

module.exports = config;
