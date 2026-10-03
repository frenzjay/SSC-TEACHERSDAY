const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

const targetLines = [
    "            const isCurrent = (idx === activeBlankIndex);",
    "            const isPast = (idx < activeBlankIndex);",
    "            pill.className = \multiblank-pill \ \\;",
    "            ",
    "            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;",
    "            let label = \BLANK \\;",
    "            if (isPast) {",
    "                label = \? \\;",
    "            } else if (isCurrent) {",
    "                label = \? BLANK \\;",
    "            }"
];

const replacementLines = [
    "            const isCurrent = (idx === activeBlankIndex);",
    "            const isPast = (idx < activeBlankIndex);",
    "            const isCompleted = isPast || b.answered;",
    "            let className = \multiblank-pill \ \\;",
    "            if (b.wrong) className += ' wrong-pill';",
    "            pill.className = className;",
    "            ",
    "            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;",
    "            let label = \BLANK \\;",
    "            if (b.answered) {",
    "                const icon = b.wrong ? '?' : '?';",
    "                label = \\ \\;",
    "            } else if (isCurrent) {",
    "                label = \? BLANK \\;",
    "            }"
];

let targetStr = targetLines.join('\\n');
let replacementStr = replacementLines.join('\\n');

code = code.replace(targetStr, replacementStr);
// wait, we need to match the actual indentation. I will use a more robust way.
