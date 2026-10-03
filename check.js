const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

code = code.replace(
    /guessRevealBox\.classList\.add\('active'\);\s*\}\s*\}\s*if \(currentSong && currentSong\.audio_url && currentSong\.mode === 'guess'\)/g,
    \guessRevealBox.classList.add('active');\n                guessRevealBox.classList.add('inline-blank-wrong');\n            }\n        }\n\n        if (currentSong && currentSong.audio_url && currentSong.mode === 'guess')\
);

// Wait, I only want to add it inside TRIGGER_WRONG. 
// I'll just use a more targeted replacement.
