const fs = require('fs');
const path = require('path');

const workerFile = path.join(__dirname, 'worker-src.js');
const landingFile = path.join(__dirname, 'landing.html');
const outputFile = path.join(__dirname, 'worker.js');

let worker = fs.readFileSync(workerFile, 'utf8');
const html = fs.readFileSync(landingFile, 'utf8');

worker = worker.replace('__LANDING_HTML__', html);

fs.writeFileSync(outputFile, worker);
console.log(`Built worker.js (${(worker.length / 1024).toFixed(1)} KB)`);
