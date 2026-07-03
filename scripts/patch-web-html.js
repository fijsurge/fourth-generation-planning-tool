/**
 * Post-build script: patches dist/index.html for iOS Safari compatibility.
 *
 * Adds synchronous polyfills for APIs missing in iOS < 15.4 (structuredClone)
 * and iOS < 14.5 (WeakRef, FinalizationRegistry) before the deferred JS bundle
 * loads. Also adds viewport-fit=cover for notched iPhones.
 *
 * Run via `npm run build:web` (called automatically after expo export).
 */

const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Add viewport-fit=cover for notched iPhones (X, 11, 12, 13, 14, 15…)
html = html.replace(
  'width=device-width, initial-scale=1, shrink-to-fit=no',
  'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
);

// 2. Inject polyfills synchronously before the app bundle (must run before <script defer>)
const polyfill = `
  <script>
  /* iOS Safari polyfills — injected by scripts/patch-web-html.js */
  (function(){
    if(!('structuredClone' in globalThis)){
      globalThis.structuredClone=function(v){
        if(v===undefined)return undefined;
        return JSON.parse(JSON.stringify(v));
      };
    }
    if(!('WeakRef' in globalThis)){
      globalThis.WeakRef=function(t){this._t=t;};
      globalThis.WeakRef.prototype.deref=function(){return this._t;};
    }
    if(!('FinalizationRegistry' in globalThis)){
      globalThis.FinalizationRegistry=function(){};
      globalThis.FinalizationRegistry.prototype.register=function(){};
      globalThis.FinalizationRegistry.prototype.unregister=function(){};
    }
  })();
  </script>`;

// Insert just before </head>
html = html.replace('</head>', `${polyfill}\n</head>`);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ dist/index.html patched for iOS Safari compatibility');
