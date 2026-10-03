const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

code = code.replace(/guessRevealBox\.style\.display = 'none';/g, "guessRevealBox.style.display = 'none';\n        guessRevealBox.classList.remove('wrong-guess');");
code = code.replace(/blankBox\.classList\.remove\('revealed'\);/g, "blankBox.classList.remove('revealed');\n            blankBox.classList.remove('inline-blank-wrong');");
// In TRIGGER_WRONG guess block:
code = code.replace(
    "guessRevealBox.classList.add('active');",
    "guessRevealBox.classList.add('active');\n                guessRevealBox.classList.add('wrong-guess');"
);

// In TRIGGER_CORRECT guess block, ensure it's removed:
code = code.replace(
    "guessTitleEl.textContent = currentSong.title || '???';\n                guessArtistEl.textContent = currentSong.artist || '???';\n                guessRevealBox.style.display = 'block';\n                guessRevealBox.classList.add('active');",
    "guessTitleEl.textContent = currentSong.title || '???';\n                guessArtistEl.textContent = currentSong.artist || '???';\n                guessRevealBox.style.display = 'block';\n                guessRevealBox.classList.remove('wrong-guess');\n                guessRevealBox.classList.add('active');"
);

// Note: it's not exactly that string. I'll just remove wrong-guess blindly on SET_SONG or something.
// Actually, I can just replace guessRevealBox.classList.add('active'); with guessRevealBox.classList.remove('wrong-guess'); guessRevealBox.classList.add('active'); globally in display.js, except for the one in TRIGGER_WRONG.

