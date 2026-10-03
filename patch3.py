with open('static/js/display.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "if (stageRibbon) stageRibbon.textContent = ? BLANK  OF  ?;",
    "if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);"
)

content = content.replace(
    "stageRibbon.textContent = ? BLANK  TAMA! ?;",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true);"
)

content = content.replace(
    "stageRibbon.textContent = ? EVERYBODY, SING! ? (BLANK  OF );",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);"
)

content = content.replace(
    "stageRibbon.textContent = ? BLANK  REVEALED ?;",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, true, false);"
)

with open('static/js/display.js', 'w', encoding='utf-8') as f:
    f.write(content)
