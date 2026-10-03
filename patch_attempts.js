const fs = require('fs');
let code = fs.readFileSync('static/js/controller.js', 'utf8');

// For triggerCorrect
code = code.replace(
    'function triggerCorrect() {\n        if (!currentSong) return;',
    'function triggerCorrect() {\n        if (!currentSong) return;\n        if (isAnswered) return;'
);

// For triggerWrong
code = code.replace(
    'function triggerWrong() {\n        if (!currentSong) return;',
    'function triggerWrong() {\n        if (!currentSong) return;\n        if (isAnswered) return;'
);

fs.writeFileSync('static/js/controller.js', code);
