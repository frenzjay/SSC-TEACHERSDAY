const fs = require('fs');
let code = fs.readFileSync('static/js/display.js', 'utf8');

const target = \            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            pill.className = \\\multiblank-pill \$\{isCurrent ? 'active' : ''\} \$\{isPast ? 'completed' : ''\}\\\;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = \\\BLANK \$\{realIdx\}\\\;
            if (isPast) {
                label = \\\? \$\{escapeHtml(b.blank_lyrics || b.answer)\}\\\;
            } else if (isCurrent) {
                label = \\\? BLANK \$\{realIdx\}\\\;
            }\;

const replacement = \            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            const isCompleted = isPast || b.answered;
            let className = \\\multiblank-pill \$\{isCurrent ? 'active' : ''\} \$\{isCompleted ? 'completed' : ''\}\\\;
            if (b.wrong) className += ' wrong-pill';
            pill.className = className;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = \\\BLANK \$\{realIdx\}\\\;
            if (b.answered) {
                const icon = b.wrong ? '?' : '?';
                label = \\\\$\{icon\} \$\{escapeHtml(b.blank_lyrics || b.answer)\}\\\;
            } else if (isCurrent) {
                label = \\\? BLANK \$\{realIdx\}\\\;
            }\;

code = code.replace(target, replacement);
fs.writeFileSync('static/js/display.js', code);
