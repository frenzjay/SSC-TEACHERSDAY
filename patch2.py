import re

with open('static/js/display.js', 'r', encoding='utf-8') as f:
    content = f.read()

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
# wait, there's another instance of it
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
