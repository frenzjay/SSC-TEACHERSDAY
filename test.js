const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

code = code.replace(
    /guessRevealBox\.classList\.add\('active'\);/g,
    \guessRevealBox.classList.add('active');\n                guessRevealBox.classList.remove('guess-wrong');\
);

const wrongBlock = \guessRevealBox.classList.add('active');
                guessRevealBox.classList.remove('guess-wrong');\;
const wrongBlockReplacement = \guessRevealBox.classList.add('active');
                guessRevealBox.classList.add('guess-wrong');\;

// Wait, I only want to replace it for TRIGGER_WRONG.
