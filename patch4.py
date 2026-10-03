with open('static/js/display.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'if (stageRibbon) stageRibbon.textContent = \u2605 BLANK  OF  \u2605;',
    'if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);'
)

content = content.replace(
    'stageRibbon.textContent = \u2605 BLANK  TAMA! \u2605;',
    'stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true);'
)

content = content.replace(
    'stageRibbon.textContent = \u2605 EVERYBODY, SING! \u2605 (BLANK  OF );',
    'stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false);'
)

content = content.replace(
    'stageRibbon.textContent = \u2605 BLANK  REVEALED \u2605;',
    'stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, true, false);'
)

with open('static/js/display.js', 'w', encoding='utf-8') as f:
    f.write(content)
