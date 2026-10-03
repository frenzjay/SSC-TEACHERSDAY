with open('static/js/display.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for l in lines:
    if "const isCurrent = (idx === activeBlankIndex);" in l:
        new_lines.append(l)
        new_lines.append("            const isPast = (idx < activeBlankIndex);\n")
        new_lines.append("            const isCompleted = isPast || b.answered;\n")
        new_lines.append("            let className = multiblank-pill  ;\n")
        new_lines.append("            if (b.wrong) className += ' wrong-pill';\n")
        new_lines.append("            pill.className = className;\n")
        new_lines.append("            \n")
        new_lines.append("            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;\n")
        new_lines.append("            let label = BLANK ;\n")
        new_lines.append("            if (b.answered) {\n")
        new_lines.append("                const icon = b.wrong ? '?' : '?';\n")
        new_lines.append("                label = ${icon} ;\n")
        new_lines.append("            } else if (isCurrent) {\n")
        new_lines.append("                label = ? BLANK ;\n")
        new_lines.append("            }\n")
        skip = True
        continue
    
    if skip:
        if "pill.innerHTML = <span></span>;" in l:
            skip = False
            new_lines.append(l)
        continue

    new_lines.append(l)

with open('static/js/display.js', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
