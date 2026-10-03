const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');
const lines = code.split('\n');

let startWrong = -1;
let endWrong = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("window.gameBus.on('TRIGGER_WRONG'")) startWrong = i;
    if (startWrong !== -1 && lines[i].includes("window.gameBus.on('TRIGGER_TIMEOUT'")) {
        endWrong = i - 1;
        break;
    }
}

let wrongCode = lines.slice(startWrong, endWrong + 1).join('\n');
wrongCode = wrongCode.replace(
    'stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true);',
    'stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, true);'
);

lines.splice(startWrong, endWrong - startWrong + 1, wrongCode);
fs.writeFileSync('static/js/display.js', lines.join('\n'));
