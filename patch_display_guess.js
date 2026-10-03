const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

// Reset wrong classes where we reset state
code = code.split("guessRevealBox.style.display = 'none';").join("guessRevealBox.classList.remove('wrong-guess');\n        guessRevealBox.style.display = 'none';");
code = code.split("blankBox.classList.remove('revealed');").join("blankBox.classList.remove('inline-blank-wrong');\n            blankBox.classList.remove('revealed');");

// The guess block in TRIGGER_CORRECT:
// It has \guessRevealBox.classList.add('active');\
// The guess block in TRIGGER_WRONG also has \guessRevealBox.classList.add('active');\
// But we want WRONG to add 'wrong-guess', and CORRECT to remove it.
// Let's manually replace the one in TRIGGER_WRONG.

let lines = code.split('\n');
let inWrong = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("window.gameBus.on('TRIGGER_WRONG'")) inWrong = true;
    if (inWrong && lines[i].includes("window.gameBus.on('TRIGGER_TIMEOUT'")) inWrong = false;
    
    if (inWrong && lines[i].includes("guessRevealBox.classList.add('active');")) {
        lines[i] = "                guessRevealBox.classList.add('active');\n                guessRevealBox.classList.add('wrong-guess');";
    }
}

code = lines.join('\n');
fs.writeFileSync('static/js/display.js', code);
