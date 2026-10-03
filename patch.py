import re

with open('static/js/display.js', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Fix corrupted characters
content = content.replace('~.', '?')
content = content.replace('T', '?')

# Replace pill labeling logic
pill_logic_old = '''        currentSong.blanks.forEach((b, idx) => {
            const pill = document.createElement('div');
            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            pill.className = multiblank-pill  ;
            
            let label = BLANK ;
            if (isPast) {
                label = ? ;
            } else if (isCurrent) {
                label = ? BLANK ;
            }
            pill.innerHTML = <span></span>;
            stageMultiBlankBar.appendChild(pill);
        });'''

pill_logic_new = '''        currentSong.blanks.forEach((b, idx) => {
            if (b.is_lyrics_only) return; // Do not show pill for lyrics only blanks
            const pill = document.createElement('div');
            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            pill.className = multiblank-pill  ;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = BLANK ;
            if (isPast) {
                label = ? ;
            } else if (isCurrent) {
                label = ? BLANK ;
            }
            pill.innerHTML = <span></span>;
            stageMultiBlankBar.appendChild(pill);
        });'''
content = content.replace(pill_logic_old, pill_logic_new)

# Replace ribbon logic
# We need to replace instances of BLANK  dynamically.
# Let's write a helper function in JS at the top of the file, then replace the calls.
helper = '''function getRibbonText(currentBlank, blanks, activeIndex, isRevealed, isTama) {
    if (currentBlank.is_lyrics_only) return '? EVERYBODY, SING! ?';
    let realIdx = blanks.slice(0, activeIndex + 1).filter(x => !x.is_lyrics_only).length;
    let totalReal = blanks.filter(x => !x.is_lyrics_only).length;
    if (isTama) return ? BLANK  TAMA! ?;
    if (isRevealed) return ? BLANK  REVEALED ?;
    return ? BLANK  OF  ?;
}'''

content = content.replace("function renderInlineBlank(", helper + "\n\n    function renderInlineBlank(")

# 1. showQuestionPrompter ribbon
content = re.sub(
    r"if \(stageRibbon\) stageRibbon\.textContent = ? BLANK \$\{activeBlankIndex \+ 1\} OF \$\{blanks\.length\} ?;",
    r"if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);",
    content
)

# 2. TRIGGER_CORRECT_AND_ADVANCE tama ribbon
content = re.sub(
    r"stageRibbon\.textContent = ? BLANK \$\{activeBlankIndex \+ 1\} TAMA! ?;",
    r"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true);",
    content
)

# 3. SHOW_NEXT_BLANK ribbon
content = re.sub(
    r"if \(stageRibbon\) stageRibbon\.textContent = ? BLANK \$\{activeBlankIndex \+ 1\} OF \$\{blanks\.length\} ?;",
    r"if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);",
    content
)

# 4. SHOW_BLANK_LYRICS ribbon
content = re.sub(
    r"stageRibbon\.textContent = ? EVERYBODY, SING! ? \(BLANK \$\{activeBlankIndex \+ 1\} OF \$\{blanks\.length\}\);",
    r"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);",
    content
)

# 5. BLANK REVEALED ribbon
content = re.sub(
    r"stageRibbon\.textContent = ? BLANK \$\{activeBlankIndex \+ 1\} REVEALED ?;",
    r"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, true, false);",
    content
)


with open('static/js/display.js', 'w', encoding='utf-8') as f:
    f.write(content)
