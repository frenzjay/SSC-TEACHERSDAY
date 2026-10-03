const fs = require('fs');
let lines = fs.readFileSync('static/js/display.js', 'utf8').split('\n');

let startCorrect = -1;
let endCorrect = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("window.gameBus.on('TRIGGER_CORRECT', (data) => {")) startCorrect = i;
    if (startCorrect !== -1 && lines[i].includes("window.gameBus.on('SHOW_BLANK_LYRICS',")) {
        endCorrect = i - 1;
        break;
    }
}

let correctCode = lines.slice(startCorrect, endCorrect + 1).join('\n');

let wrongCode = correctCode
    .replace("window.gameBus.on('TRIGGER_CORRECT', (data) => {", "window.gameBus.on('TRIGGER_WRONG', (data) => {")
    .replace("showVerdict('correct', 'fa-solid fa-check', 'TAMA!');", "showVerdict('wrong', 'fa-solid fa-xmark', 'MALI!');")
    .replace("window.gameAudio.playCorrectDing();", "window.gameAudio.playWrongBuzzer();")
    .replace("burst(180)", "burst(0)")
    .split("TAMA!").join("MALI!")
    .replace("currentBlank.answered = true;", "currentBlank.answered = true;\n                currentBlank.wrong = true;")
    .replace("blankBox.classList.add('revealed');", "blankBox.classList.add('revealed');\n                blankBox.classList.add('inline-blank-wrong');");

let startWrong = -1;
let endWrong = -1;
for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("window.gameBus.on('TRIGGER_WRONG'")) startWrong = i;
    if (startWrong !== -1 && lines[i].includes("window.gameBus.on('TRIGGER_TIMEOUT'")) {
        endWrong = i - 1;
        break;
    }
}

lines.splice(startWrong, endWrong - startWrong + 1, wrongCode);
fs.writeFileSync('static/js/display.js', lines.join('\n'));
