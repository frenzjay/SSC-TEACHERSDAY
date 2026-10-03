with open('static/js/controller.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

correct_code = ''.join(lines[1590:1704])

# Modify correct_code to become wrong_code
wrong_code = correct_code.replace('function triggerCorrect()', 'function triggerWrong()')
wrong_code = wrong_code.replace('TRIGGER_CORRECT', 'TRIGGER_WRONG')
wrong_code = wrong_code.replace('window.gameAudio.playCorrectDing()', 'window.gameAudio.playWrongBuzzer()')

# Mark the curBlank or currentSong as wrong
wrong_code = wrong_code.replace('curBlank.answered = true;', 'curBlank.answered = true;\n            curBlank.wrong = true;')

# Now replace the old triggerWrong
lines[1704:1709] = [wrong_code]

with open('static/js/controller.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
