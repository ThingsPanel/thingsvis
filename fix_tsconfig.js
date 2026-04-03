const fs = require('fs');
const path = require('path');
const base = path.join(__dirname, 'packages/widgets/decoration');

const dirs = fs.readdirSync(base).filter(d => !d.includes('.'));
dirs.forEach(d => {
  const p = path.join(base, d, 'tsconfig.json');
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/"extends":\s*".*?"/, '"extends": "../../tsconfig.widget.json"');
    fs.writeFileSync(p, c);
  }
});
console.log('Fixed tsconfig paths');
