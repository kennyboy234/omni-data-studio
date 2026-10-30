const fs = require('fs');
const path = 'c:\\Users\\USER\\Documents\\omni-data-studio\\src\\components\\ComplaintHubV61.tsx';
let c = fs.readFileSync(path, 'utf8');
const before = c.length;
c = c.replace(/\\"/g, '"');
fs.writeFileSync(path, c, 'utf8');
console.log('Fixed. Length changed:', before - c.length);