/**
 * postbuild.js
 * Runs after `next build`. Creates placeholder middleware artifacts so that
 * @netlify/plugin-nextjs does not crash with ENOENT when no middleware exists.
 *
 * Background: Next.js only generates .next/server/middleware.js and
 * .next/server/middleware.js.nft.json when a middleware.ts/js file is present.
 * The Netlify plugin always expects these files. This script bridges that gap.
 */

const fs = require('fs');
const path = require('path');

const serverDir = path.join(process.cwd(), '.next', 'server');
const middlewareJs  = path.join(serverDir, 'middleware.js');
const middlewareNft = path.join(serverDir, 'middleware.js.nft.json');

// Ensure .next/server/ exists (it always should after next build)
fs.mkdirSync(serverDir, { recursive: true });

// Create placeholder middleware.js if missing
if (!fs.existsSync(middlewareJs)) {
  fs.writeFileSync(middlewareJs,
    '// Placeholder — no real middleware in this project.\n' +
    'exports.default = function middleware() {};\n'
  );
  console.log('✔ Created placeholder middleware.js');
}

// Create placeholder middleware.js.nft.json if missing
if (!fs.existsSync(middlewareNft)) {
  fs.writeFileSync(middlewareNft, JSON.stringify({ version: 1, files: [] }, null, 2));
  console.log('✔ Created placeholder middleware.js.nft.json');
}

console.log('postbuild: middleware artifacts ready.');
