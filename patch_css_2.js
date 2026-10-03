const fs = require('fs');
let code = fs.readFileSync('static/css/display.css', 'utf8');

code = code.replace(
    '.stage-blank-box.revealed {',
    '.stage-blank-box.revealed.inline-blank-wrong {\n    background: var(--accent-red, #ff4444) !important;\n}\n\n.stage-blank-box.revealed {'
);

fs.writeFileSync('static/css/display.css', code);
