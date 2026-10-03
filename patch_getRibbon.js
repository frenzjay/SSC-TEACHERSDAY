const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

code = code.replace(
    'function getRibbonText(currentBlank, blanks, activeIndex, isRevealed, isTama) {',
    'function getRibbonText(currentBlank, blanks, activeIndex, isRevealed, isTama, isMali) {'
);

code = code.replace(
    'if (isTama) return \? BLANK \$\{realIdx\} TAMA! ?\;',
    'if (isTama) return \? BLANK \$\{realIdx\} TAMA! ?\;\n        if (isMali) return \? BLANK \$\{realIdx\} MALI! ?\;'
);

fs.writeFileSync('static/js/display.js', code);
