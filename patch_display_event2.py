with open('static/js/display.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

correct_code = ''.join(lines[301:367])

wrong_code = correct_code.replace(\"window.gameBus.on('TRIGGER_CORRECT', (data) => {\", \"window.gameBus.on('TRIGGER_WRONG', (data) => {\")
wrong_code = wrong_code.replace(\"showVerdict('correct', 'fa-solid fa-check', 'TAMA!');\", \"showVerdict('wrong', 'fa-solid fa-xmark', 'MALI!');\")
wrong_code = wrong_code.replace(\"window.gameAudio.playCorrectDing();\", \"window.gameAudio.playWrongBuzzer();\")
wrong_code = wrong_code.replace(\"burst(180)\", \"burst(0)\")
wrong_code = wrong_code.replace(\"? TAMA! ?\", \"? MALI! ?\")
wrong_code = wrong_code.replace(\"TAMA!\", \"MALI!\")

wrong_code = wrong_code.replace(\"currentBlank.answered = true;\", \"currentBlank.answered = true;\\n                currentBlank.wrong = true;\")
wrong_code = wrong_code.replace(\"blankBox.classList.add('revealed');\", \"blankBox.classList.add('revealed');\\n                blankBox.classList.add('inline-blank-wrong');\")

start_wrong = -1
for i, l in enumerate(lines):
    if \"window.gameBus.on('TRIGGER_WRONG'\" in l:
        start_wrong = i
        break

end_wrong = start_wrong
for i in range(start_wrong, len(lines)):
    if \"window.gameBus.on('TRIGGER_TIMEOUT'\" in lines[i]:
        end_wrong = i - 1
        break

lines[start_wrong:end_wrong+1] = [wrong_code]

with open('static/js/display.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
