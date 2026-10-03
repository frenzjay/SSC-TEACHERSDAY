const fs = require('fs');
let code = fs.readFileSync('static/css/display.css', 'utf8');

code = code.replace(
    '.multiblank-pill.completed {',
    '.multiblank-pill.completed.wrong-pill {\n    background: var(--accent-red, #ff4444) !important;\n}\n\n.multiblank-pill.completed {'
);

fs.writeFileSync('static/css/display.css', code);
