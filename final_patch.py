import sys

def modify_display():
    with open('static/js/display.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update ribbons
    code = code.replace("stageRibbon.textContent = `? BLANK ${activeBlankIndex + 1} OF ${blanks.length} ?`;", 
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, false);")
    
    code = code.replace("stageRibbon.textContent = `? EVERYBODY, SING! ? (BLANK ${activeBlankIndex + 1} OF ${blanks.length})`;",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, false);")
    
    code = code.replace("stageRibbon.textContent = `? BLANK ${activeBlankIndex + 1} REVEALED ?`;",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, true, false, false);")
    
    code = code.replace("stageRibbon.textContent = `? BLANK ${activeBlankIndex + 1} TAMA! ?`;",
    "stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true, false);")

    # 2. TRIGGER_WRONG event replacement
    lines = code.split('\n')
    start_wrong = -1
    end_wrong = -1
    for i, l in enumerate(lines):
        if "window.gameBus.on('TRIGGER_WRONG'" in l:
            start_wrong = i
        if start_wrong != -1 and "window.gameBus.on('TRIGGER_TIMEOUT'" in l:
            end_wrong = i - 1
            break
            
    wrong_code = """    window.gameBus.on('TRIGGER_WRONG', (data) => {
        isAnswered = true;
        isRevealed = true;
        hasCutForBlank = true;

        hideTimer();
        resetTimerDisplay();

        showVerdict('wrong', 'fa-solid fa-xmark', 'MALI!');
        window.pixelConfetti.burst(0);
        window.gameAudio.playWrongBuzzer();

        if (currentSong) {
            if (currentSong.mode === 'everybody_sing') {
                const blanks = currentSong.blanks || [];
                const currentBlank = blanks[activeBlankIndex] || {};
                currentBlank.answered = true;
                currentBlank.wrong = true;
                renderStageMultiBlankPills();

                renderInlineBlank(currentBlank, true);

                if (stageRibbon) {
                    if (data && data.isLastBlank) {
                        stageRibbon.textContent = '? EVERYBODY, SING! ?';
                    } else {
                        stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, true);
                    }
                }

                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                return;
            }

            if (currentSong.mode === 'complete') {
                if (stageRibbon) stageRibbon.textContent = '? MALI! ?';
                promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || '');
                blankBox.style.display = 'inline-block';
                blankBox.classList.add('revealed');
                blankBox.classList.add('inline-blank-wrong');
                blankBox.textContent = `? ${currentSong.blank_lyrics || currentSong.answer} ?`;
            } else {
                if (stageRibbon) stageRibbon.textContent = '? MALI! ?';
                promptTextEl.innerHTML = '<div style="font-size:1.4rem; color:var(--brand-blue);">? ANSWER:</div>';
                guessTitleEl.textContent = currentSong.title || '???';
                guessArtistEl.textContent = currentSong.artist || '???';
                guessRevealBox.style.display = 'block';
                guessRevealBox.classList.add('active');
                guessRevealBox.classList.add('wrong-guess');
            }
        }

        if (currentSong && currentSong.audio_url && currentSong.mode === 'guess') {
            const replayFrom = Number(data && data.replayFrom);
            hulaReplayStopAt = Number(data && data.replayUntil) || ((replayFrom || 0) + 4);
            setTimeout(() => {
                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                window.gameAudio.playTrack(Number.isFinite(replayFrom) ? replayFrom : (Number(currentSong.start_time) || 0), true);
            }, 350);
        } else if (currentSong && currentSong.audio_url) {
            setTimeout(() => {
                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                window.gameAudio.playTrack(null, false);
            }, 350);
        }
    });"""
    
    if start_wrong != -1 and end_wrong != -1:
        lines[start_wrong:end_wrong+1] = [wrong_code]
        code = '\n'.join(lines)
    else:
        print("Could not find TRIGGER_WRONG")

    # Reset classes
    code = code.replace("guessRevealBox.style.display = 'none';", "guessRevealBox.classList.remove('wrong-guess');\n        guessRevealBox.style.display = 'none';")
    code = code.replace("blankBox.classList.remove('revealed');", "blankBox.classList.remove('inline-blank-wrong');\n            blankBox.classList.remove('revealed');")
    code = code.replace("guessRevealBox.classList.add('active');", "guessRevealBox.classList.remove('wrong-guess');\n                guessRevealBox.classList.add('active');")

    with open('static/js/display.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    modify_display()
