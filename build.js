const fs = require('fs');
const path = require('path');

const workerFile = path.join(__dirname, 'worker-src.js');
const srcHtml = path.join(__dirname, 'src', 'page.html');
const srcCss = path.join(__dirname, 'src', 'page.css');
const srcJs = path.join(__dirname, 'src', 'page.js');
const landingFile = path.join(__dirname, 'platform.html');
const openapiFile = path.join(__dirname, 'openapi.yaml');
const iconFile = path.join(__dirname, 'cryptodata-icon.svg');
const outputFile = path.join(__dirname, 'worker.js');

// Read source files
let html = fs.readFileSync(srcHtml, 'utf8');
const css = fs.readFileSync(srcCss, 'utf8');
const js = fs.readFileSync(srcJs, 'utf8');

// Inline CSS and JS (use split/join to avoid $ patterns in JS)
html = html.split('<link rel="stylesheet" href="page.css">').join(`<style>\n${css}\n</style>`);
html = html.split('<script src="page.js"></script>').join(`<script>\n${js}\n</script>`);

// Write combined platform.html
fs.writeFileSync(landingFile, html);

// Build worker (same as before)
let worker = fs.readFileSync(workerFile, 'utf8');
const b64 = Buffer.from(html, 'utf8').toString('base64');
worker = worker.replace('__LANDING_HTML__', JSON.stringify(b64));

const oas = fs.readFileSync(openapiFile, 'utf8');
const oasB64 = Buffer.from(oas, 'utf8').toString('base64');
worker = worker.replace('__OPENAPI_YAML__', JSON.stringify(oasB64));

const ico = fs.readFileSync(iconFile, 'utf8');
const icoB64 = Buffer.from(ico, 'utf8').toString('base64');
worker = worker.replace('__ICON_SVG__', JSON.stringify(icoB64));

fs.writeFileSync(outputFile, worker);
console.log(`Built worker.js (${(worker.length / 1024).toFixed(1)} KB)`);
