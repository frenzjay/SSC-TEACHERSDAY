const fs = require('fs');
let code = fs.readFileSync('static/css/display.css', 'utf8');

code = code.replace(
    '.stage-guess-reveal.active {',
    '.stage-guess-reveal.active.wrong-guess {\n    background: var(--accent-red, #ff4444) !important;\n    color: white !important;\n}\n\n.stage-guess-reveal.active {'
);

fs.writeFileSync('static/css/display.css', code);
