const fs = require('fs');
let code = fs.readFileSync('static/css/display.css', 'utf8');
code = code.replace('.inline-blank-revealed {', '.inline-blank-wrong {\n    color: var(--accent-red, #ff4444);\n    border-bottom-color: var(--accent-red, #ff4444);\n    letter-spacing: 2px;\n}\n\n.inline-blank-revealed {');
fs.writeFileSync('static/css/display.css', code);
