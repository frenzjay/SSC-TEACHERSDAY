const fs = require('fs');
let code = fs.readFileSync('static/js/controller.js', 'utf8');

// For triggerCorrect
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function triggerCorrect()')) {
        lines[i+1] = lines[i+1].replace('if (!currentSong) return;', 'if (!currentSong) return; if (isAnswered) return;');
    }
    if (lines[i].includes('function triggerWrong()')) {
        lines[i+1] = lines[i+1].replace('if (!currentSong) return;', 'if (!currentSong) return; if (isAnswered) return;');
    }
}

fs.writeFileSync('static/js/controller.js', lines.join('\n'));
