def modify_display():
    with open('static/js/display.js', 'r', encoding='utf-8') as f:
        code = f.read()
    
    # 1. getRibbonText at the top inside DOMContentLoaded
    get_ribbon_text = '''    function getRibbonText(currentBlank, blanks, activeIndex, isRevealed, isTama, isMali) {
        if (currentBlank && currentBlank.is_lyrics_only) return '★ EVERYBODY, SING! ★';
        let realIdx = blanks.slice(0, activeIndex + 1).filter(x => !x.is_lyrics_only).length;
        let totalReal = blanks.filter(x => !x.is_lyrics_only).length;
        if (isTama) return \★ BLANK \ TAMA! ★\;
        if (isMali) return \★ BLANK \ MALI! ★\;
        if (isRevealed) return \★ BLANK \ REVEALED ★\;
        return \★ BLANK \ OF \ ★\;
    }
'''
    code = code.replace(\"document.addEventListener('DOMContentLoaded', () => {\", \"document.addEventListener('DOMContentLoaded', () => {\\n\" + get_ribbon_text)

    # 2. Update showQuestionPrompter ribbon
    code = code.replace(
        \"if (stageRibbon) stageRibbon.textContent = \★ BLANK \ OF \ ★\;\",
        \"if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, false);\"
    )
    
    # 3. Update SHOW_NEXT_BLANK ribbon
    code = code.replace(
        \"if (stageRibbon) stageRibbon.textContent = \★ BLANK \ OF \ ★\;\",
        \"if (stageRibbon) stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, false);\"
    )
    
    # 4. Update TRIGGER_CORRECT_AND_ADVANCE ribbon
    code = code.replace(
        \"stageRibbon.textContent = \★ EVERYBODY, SING! ★ (BLANK \ OF \)\;\",
        \"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, false);\"
    )
    
    # 5. Update TRIGGER_REVEALED (SHOW_BLANK_LYRICS ?) wait, it was inside TRIGGER_REVEAL but there's no TRIGGER_REVEAL, it's just 'SET_SONG' or 'SHOW_NEXT_BLANK' or 'UPDATE_TIMER' etc.
    # Actually it's line 261: \"stageRibbon.textContent = \★ BLANK \ REVEALED ★\;\"
    code = code.replace(
        \"stageRibbon.textContent = \★ BLANK \ REVEALED ★\;\",
        \"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, true, false, false);\"
    )
    
    # 6. Update TRIGGER_CORRECT ribbon
    code = code.replace(
        \"stageRibbon.textContent = \★ BLANK \ TAMA! ★\;\",
        \"stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true, false);\"
    )

    # 7. Add inline-blank-wrong to renderInlineBlank
    render_blank_old = \"\"\"        const blank = revealed
            ? \<span class=\"inline-blank inline-blank-revealed\">★ \ ★</span>\
            : \<span class=\"inline-blank\">\</span>\;\"\"\"
    render_blank_new = \"\"\"        const isWrong = currentBlank.wrong === true;
        const colorClass = isWrong ? 'inline-blank-wrong' : 'inline-blank-revealed';
        const blank = revealed
            ? \<span class=\"inline-blank \\">★ \ ★</span>\
            : \<span class=\"inline-blank\">\</span>\;\"\"\"
    code = code.replace(render_blank_old, render_blank_new)

    # 8. Add wrong pill logic to renderStageMultiBlankPills
    pill_old = \"\"\"            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            pill.className = \multiblank-pill \ \\;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = \BLANK \\;
            if (isPast) {
                label = \✓ \\;
            } else if (isCurrent) {
                label = \★ BLANK \\;
            }\"\"\"
    pill_new = \"\"\"            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            const isCompleted = isPast || b.answered;
            let className = \multiblank-pill \ \\;
            if (b.wrong) className += ' wrong-pill';
            pill.className = className;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = \BLANK \\;
            if (b.answered) {
                const icon = b.wrong ? '✕' : '✓';
                label = \\ \\;
            } else if (isCurrent) {
                label = \★ BLANK \\;
            }\"\"\"
    code = code.replace(pill_old, pill_new)
    
    # 9. Clean up guessRevealBox and blankBox classes in appropriate spots
    code = code.replace(\"guessRevealBox.style.display = 'none';\", \"guessRevealBox.classList.remove('wrong-guess');\\n        guessRevealBox.style.display = 'none';\")
    code = code.replace(\"blankBox.classList.remove('revealed');\", \"blankBox.classList.remove('inline-blank-wrong');\\n            blankBox.classList.remove('revealed');\")
    
    # 10. TRIGGER_WRONG event handler logic
    trigger_correct_old = \"\"\"    window.gameBus.on('TRIGGER_CORRECT', (data) => {
        isAnswered = true;
        isRevealed = true;
        hasCutForBlank = true;

        hideTimer();
        resetTimerDisplay();

        showVerdict('correct', 'fa-solid fa-check', 'TAMA!');
        window.pixelConfetti.burst(180);
        window.gameAudio.playCorrectDing();

        if (currentSong) {
            if (currentSong.mode === 'everybody_sing') {
                const blanks = currentSong.blanks || [];
                const currentBlank = blanks[activeBlankIndex] || {};
                currentBlank.answered = true;
                renderStageMultiBlankPills();

                renderInlineBlank(currentBlank, true);

                if (stageRibbon) {
                    if (data && data.isLastBlank) {
                        stageRibbon.textContent = '★ EVERYBODY, SING! ★';
                    } else {
                        stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true, false);
                    }
                }

                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                return;
            }

            if (currentSong.mode === 'complete') {
                if (stageRibbon) stageRibbon.textContent = '★ TAMA! ★';
                promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || '');
                blankBox.style.display = 'inline-block';
                blankBox.classList.add('revealed');
                blankBox.textContent = \★ \ ★\;
            } else {
                if (stageRibbon) stageRibbon.textContent = '★ TAMA! ★';
                promptTextEl.innerHTML = '<div style=\"font-size:1.4rem; color:var(--brand-blue);\">♫ ANSWER:</div>';
                guessTitleEl.textContent = currentSong.title || '???';
                guessArtistEl.textContent = currentSong.artist || '???';
                guessRevealBox.style.display = 'block';
                guessRevealBox.classList.add('active');
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
    });\"\"\"
    
    # Wait, the trigger_correct_old string might not match perfectly because I added getRibbonText earlier.
    # I should just write the TRIGGER_WRONG block dynamically.
    
    trigger_wrong_new = \"\"\"    window.gameBus.on('TRIGGER_WRONG', (data) => {
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
                        stageRibbon.textContent = '★ EVERYBODY, SING! ★';
                    } else {
                        stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, false, true);
                    }
                }

                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                return;
            }

            if (currentSong.mode === 'complete') {
                if (stageRibbon) stageRibbon.textContent = '★ MALI! ★';
                promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || '');
                blankBox.style.display = 'inline-block';
                blankBox.classList.add('revealed');
                blankBox.classList.add('inline-blank-wrong');
                blankBox.textContent = \★ \ ★\;
            } else {
                if (stageRibbon) stageRibbon.textContent = '★ MALI! ★';
                promptTextEl.innerHTML = '<div style=\"font-size:1.4rem; color:var(--brand-blue);\">♫ ANSWER:</div>';
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
    });\"\"\"
    
    # Let's replace the old TRIGGER_WRONG with this new one
    old_wrong = \"\"\"    window.gameBus.on('TRIGGER_WRONG', () => {
        showVerdict('wrong', 'fa-solid fa-xmark', 'MALI!');
        window.gameAudio.playWrongBuzzer();
    });\"\"\"
    code = code.replace(old_wrong, trigger_wrong_new)
    
    # Also I need to patch TRIGGER_CORRECT to use getRibbonText with 6 arguments!
    # I already replaced it above with 6 arguments: stageRibbon.textContent = getRibbonText(currentBlank, blanks, activeBlankIndex, false, true, false);

    with open('static/js/display.js', 'w', encoding='utf-8') as f:
        f.write(code)

if __name__ == '__main__':
    modify_display()
