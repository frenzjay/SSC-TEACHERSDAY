document.addEventListener('DOMContentLoaded', () => {
    function getRibbonText(currentBlank, blanks, activeIndex, isRevealed, isTama, isMali) {
        if (currentBlank && currentBlank.is_lyrics_only) return '★ EVERYBODY, SING! ★';
        let realIdx = blanks.slice(0, activeIndex + 1).filter(x => !x.is_lyrics_only).length;
        let totalReal = blanks.filter(x => !x.is_lyrics_only).length;
        if (isTama) return `★ BLANK ${realIdx} TAMA! ★`;
        if (isMali) return `★ BLANK ${realIdx} MALI! ★`;
        if (isRevealed) return `★ BLANK ${realIdx} REVEALED ★`;
        return `★ BLANK ${realIdx} OF ${totalReal} ★`;
    }
    const stageRibbon = document.getElementById('stage-card-ribbon');
    const stageMultiBlankBar = document.getElementById('stage-multiblank-bar');
    const promptTextEl = document.getElementById('stage-prompt-text');
    const blankBox = document.getElementById('stage-blank-box');
    const guessRevealBox = document.getElementById('stage-guess-reveal');
    const guessTitleEl = document.getElementById('stage-guess-title');
    const guessArtistEl = document.getElementById('stage-guess-artist');
    const visualizer = document.getElementById('stage-visualizer');
    const flashOverlay = document.getElementById('flash-verdict-overlay');
    const verdictIcon = document.getElementById('verdict-icon');
    const verdictText = document.getElementById('verdict-text');

    let currentSong = null;
    let flashTimeout = null;
    let isRevealed = false;
    let isAnswered = false;
    let hasCutForBlank = false;
    let activeBlankIndex = 0;
    let hulaReplayStopAt = null;

    function showTimer() {}
    function hideTimer() {}
    function resetTimerDisplay() {}

    function formatWordBlanksHtml(text) {
        if (!text) return '<span class="blank-word">_____</span>';
        const words = String(text).trim().split(/\s+/);
        if (words.length === 0 || (words.length === 1 && words[0] === '')) {
            return '<span class="blank-word">_____</span>';
        }
        return words.map(word => {
            const letters = word.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '');
            const count = letters.length > 0 ? letters.length : word.length;
            const underscores = '_'.repeat(Math.max(1, count));
            return `<span class="blank-word">${underscores}</span>`;
        }).join('<span class="blank-space">&nbsp;</span>');
    }

    function renderInlineBlank(currentBlank, revealed = false) {
        if (currentBlank.is_lyrics_only) {
            const following = currentBlank.following_lyrics
                ? `<div class="inline-following-lyrics">${escapeHtml(currentBlank.following_lyrics)}</div>`
                : '';
            const lines = String(currentBlank.prompt_lyrics || '')
                .split(' / ')
                .map(line => escapeHtml(line));
            promptTextEl.innerHTML = `${lines.map(line => `<div>${line}</div>`).join('')}${following}`;
            blankBox.style.display = 'none';
            return;
        }

        const isWrong = currentBlank.wrong === true;
        const colorClass = isWrong ? 'inline-blank-wrong' : 'inline-blank-revealed';
        const blank = revealed
            ? `<span class="inline-blank ${colorClass}">${escapeHtml(currentBlank.blank_lyrics || currentBlank.answer || '')}</span>`
            : `<span class="inline-blank">${formatWordBlanksHtml(currentBlank.blank_lyrics || currentBlank.answer || '_____')}</span>`;
        const following = currentBlank.following_lyrics
            ? `<div class="inline-following-lyrics">${escapeHtml(currentBlank.following_lyrics)}</div>`
            : '';
        const lines = String(currentBlank.prompt_lyrics || 'Complete the missing lyric:')
            .split(' / ')
            .map(line => escapeHtml(line));
        const lastLine = lines.length - 1;
        lines[lastLine] = `${lines[lastLine]} <span class="inline-blank-line">${blank}</span>`;
        promptTextEl.innerHTML = `${lines.map(line => `<div>${line}</div>`).join('')}${following}`;
        blankBox.style.display = 'none';
    }

    function renderStageMultiBlankPills() {
        if (!stageMultiBlankBar) return;
        if (!currentSong || currentSong.mode !== 'everybody_sing' || !currentSong.blanks || currentSong.blanks.length === 0) {
            stageMultiBlankBar.style.display = 'none';
            stageMultiBlankBar.innerHTML = '';
            return;
        }
        stageMultiBlankBar.style.display = 'flex';
        stageMultiBlankBar.innerHTML = '';
        currentSong.blanks.forEach((b, idx) => {
            const pill = document.createElement('div');
            if (b.is_lyrics_only) return;
            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            const isCompleted = isPast || b.answered;
            
            let className = `multiblank-pill ${isCurrent ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
            if (b.wrong) className += ' wrong-pill';
            pill.className = className;
            
            let realIdx = currentSong.blanks.slice(0, idx + 1).filter(x => !x.is_lyrics_only).length;
            let label = `BLANK ${realIdx}`;
            
            if (b.answered) {
                const icon = b.wrong ? '✕' : '✓';
                label = `${icon} ${escapeHtml(b.blank_lyrics || b.answer)}`;
            } else if (isCurrent) {
                label = `★ BLANK ${realIdx}`;
            }
            pill.innerHTML = `<span>${label}</span>`;
            stageMultiBlankBar.appendChild(pill);
        });
    }

    hideTimer();
    resetTimerDisplay();
    function showQuestionPrompter() {
        if (!currentSong) return;
        visualizer.classList.remove('playing');
        visualizer.classList.add('blank-paused');

        if (currentSong.mode !== 'everybody_sing' && (isRevealed || isAnswered)) {
            return;
        }

        hasCutForBlank = true;

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            const currentBlank = blanks[activeBlankIndex] || blanks[0] || {};
            if (stageRibbon) stageRibbon.textContent = `★ BLANK ${activeBlankIndex + 1} OF ${blanks.length} ★`;
            renderInlineBlank(currentBlank, Boolean(currentBlank.answered));
            renderStageMultiBlankPills();
        } else if (currentSong.mode === 'complete') {
            if (stageRibbon) stageRibbon.textContent = '★ SING IN THE BLANK! ★';
            promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || 'Complete the missing lyric:');
            blankBox.style.display = 'inline-block';
            blankBox.classList.remove('inline-blank-wrong');
            blankBox.classList.remove('revealed');
            blankBox.innerHTML = `[ ${formatWordBlanksHtml(currentSong.blank_lyrics || currentSong.answer || '_____')} ]`;
            if (stageMultiBlankBar) stageMultiBlankBar.style.display = 'none';
        } else {
            if (stageRibbon) stageRibbon.textContent = '★ HULA-SING! ★';
            promptTextEl.innerHTML = `
                <div style="font-size:1.8rem; color:var(--brand-blue); font-weight:bold;">
                    ♫ WHAT IS THE SONG TITLE & ARTIST? ♫
                </div>
            `;
            guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';
            if (stageMultiBlankBar) stageMultiBlankBar.style.display = 'none';
        }
    }
    window.gameBus.on('SET_SONG', (song) => {
        if (!song) return;
        currentSong = song;
        isRevealed = false;
        isAnswered = false;
        hasCutForBlank = false;
        activeBlankIndex = 0;

        blankBox.classList.remove('inline-blank-wrong');
            blankBox.classList.remove('revealed');
        blankBox.style.display = 'none';
        guessRevealBox.classList.remove('active');
        guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';
        visualizer.classList.remove('playing', 'blank-paused');

        hideTimer();
        resetTimerDisplay();

        if (stageRibbon) {
            stageRibbon.textContent = '';
        }
        if (song.mode === 'everybody_sing') {
            (song.blanks || []).forEach(blank => {
                delete blank._lyricsShown;
            });
            renderStageMultiBlankPills();
        } else if (stageMultiBlankBar) {
            stageMultiBlankBar.style.display = 'none';
        }

        const modeDesc = song.mode === 'everybody_sing' ? 
            `[ READY TO SING ${(song.blanks || []).length} BLANKS ACROSS THE FULL SONG ]` :
            (song.mode === 'complete' ? '[ LISTEN TO THE SONG UNTIL THE MUSIC CUTS ]' : '[ LISTEN CAREFULLY TO THE TUNE ]');

        promptTextEl.innerHTML = `
            <div style="font-size:1.8rem; color:var(--brand-blue); font-weight:bold; margin-bottom:10px;">
                <i class="fa-solid fa-compact-disc"></i> GET READY!
            </div>
            <div style="font-size:1rem; color:#666;">
                ${modeDesc}
            </div>
        `;

        if (song.audio_url) {
            window.gameAudio.loadTrack(song.audio_url, song.start_time || 0);
        }
    });

    window.gameBus.on('PLAY_AUDIO', (data) => {
        hideStageRoulette();
        visualizer.classList.add('playing');
        visualizer.classList.remove('blank-paused');
        
        hideTimer();

        if (isRevealed || isAnswered || (data && data.isResume)) {
            const fromTime = (data && data.fromTime !== undefined && data.fromTime !== null) ? data.fromTime : null;
            if (fromTime !== null) {
                window.gameAudio.playTrack(fromTime, currentSong ? currentSong.mode !== 'everybody_sing' : true);
            } else {
                window.gameAudio.playTrack(null, currentSong ? currentSong.mode !== 'everybody_sing' : true);
            }
            return;
        }

        if (currentSong && currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            const curBlank = blanks[activeBlankIndex] || {};
            if (curBlank.answered) {
                renderInlineBlank(curBlank, true);
                const fromTime = (data && data.fromTime !== undefined && data.fromTime !== null) ? data.fromTime : null;
                if (fromTime !== null) {
                    window.gameAudio.playTrack(fromTime, false);
                } else {
                    window.gameAudio.playTrack(null, false);
                }
                return;
            }
        }

        blankBox.style.display = 'none';
        guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';
        if (stageRibbon) stageRibbon.textContent = '★ NOW PLAYING ★';
        promptTextEl.innerHTML = `
            <div style="font-size:2rem; color:var(--brand-blue); font-weight:bold; margin-bottom:10px;">
                <i class="fa-solid fa-volume-high"></i> LISTEN CAREFULLY...
            </div>
            <div style="font-size:1rem; color:#777;">
                ♫ MUSIC IS PLAYING ♫
            </div>
        `;

        const fromTime = (data && data.fromTime !== undefined && data.fromTime !== null) ? data.fromTime : null;
        window.gameAudio.playTrack(fromTime, currentSong ? currentSong.mode !== 'everybody_sing' : true);
    });

    window.gameBus.on('STOP_AUDIO', () => {
        window.gameAudio.smoothStop(280);
        showQuestionPrompter();
    });

    window.gameBus.on('REVEAL_ANSWER', () => {
        if (!currentSong) return;
        isRevealed = true;
        isAnswered = true;
        hasCutForBlank = true;

        hideTimer();

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            const currentBlank = blanks[activeBlankIndex] || {};
            stageRibbon.textContent = `★ BLANK ${activeBlankIndex + 1} REVEALED ★`;
            renderInlineBlank(currentBlank, true);
            activeBlankIndex = Math.min(blanks.length, activeBlankIndex + 1);
            renderStageMultiBlankPills();
            window.gameAudio.playTick(false);
            return;
        }

        if (currentSong.mode === 'complete') {
            stageRibbon.textContent = '★ ANSWER REVEALED ★';
            promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || '');
            blankBox.style.display = 'inline-block';
            blankBox.classList.add('revealed');
            blankBox.textContent = `★ ${currentSong.blank_lyrics || currentSong.answer} ★`;
        } else {
            stageRibbon.textContent = '★ ANSWER REVEALED ★';
            promptTextEl.innerHTML = '<div style="font-size:1.4rem; color:var(--brand-blue);">♫ ANSWER:</div>';
            guessTitleEl.textContent = currentSong.title || '???';
            guessArtistEl.textContent = currentSong.artist || '???';
            guessRevealBox.style.display = 'block';
            guessRevealBox.classList.remove('wrong-guess');
                guessRevealBox.classList.add('active');
        }

        if (currentSong.mode === 'guess' && currentSong.audio_url) {
            const replayFrom = Number(data && data.replayFrom);
            hulaReplayStopAt = Number(data && data.replayUntil) || ((replayFrom || Number(currentSong.start_time) || 0) + 4);
            setTimeout(() => {
                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
                window.gameAudio.playTrack(
                    Number.isFinite(replayFrom) ? replayFrom : (Number(currentSong.start_time) || 0),
                    true
                );
            }, 350);
        }
        window.gameAudio.playTick(false);
    });

    window.gameBus.on('TRIGGER_CORRECT', (data) => {
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
                        stageRibbon.textContent = `★ BLANK ${activeBlankIndex + 1} TAMA! ★`;
                    }
                }

                visualizer.classList.remove('playing');
                visualizer.classList.add('blank-paused');
                return;
            }

            if (currentSong.mode === 'complete') {
                if (stageRibbon) stageRibbon.textContent = '★ TAMA! ★';
                promptTextEl.innerHTML = formatLyrics(currentSong.prompt_lyrics || '');
                blankBox.style.display = 'inline-block';
                blankBox.classList.add('revealed');
                blankBox.textContent = `★ ${currentSong.blank_lyrics || currentSong.answer} ★`;
            } else {
                if (stageRibbon) stageRibbon.textContent = '★ TAMA! ★';
                promptTextEl.innerHTML = '<div style="font-size:1.4rem; color:var(--brand-blue);">♫ ANSWER:</div>';
                guessTitleEl.textContent = currentSong.title || '???';
                guessArtistEl.textContent = currentSong.artist || '???';
                guessRevealBox.style.display = 'block';
                guessRevealBox.classList.remove('wrong-guess');
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
    });

    window.gameBus.on('SHOW_BLANK_LYRICS', (data) => {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        const blanks = currentSong.blanks || [];
        const idx = (data && typeof data.activeBlankIndex === 'number') ? data.activeBlankIndex : activeBlankIndex;
        activeBlankIndex = idx;
        const currentBlank = blanks[activeBlankIndex] || {};

        if (currentBlank.answered) {
            renderInlineBlank(currentBlank, true);
        } else {
            renderInlineBlank(currentBlank);
        }
        renderStageMultiBlankPills();
    });

    window.gameBus.on('UPDATE_BLANKS', (blanks) => {
        if (currentSong && Array.isArray(blanks)) {
            currentSong.blanks = blanks;
        }
    });

    window.gameBus.on('SHOW_NEXT_BLANK', (data) => {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        if (data && typeof data.activeBlankIndex === 'number') {
            activeBlankIndex = data.activeBlankIndex;
        }
        const nextBlank = (currentSong.blanks || [])[activeBlankIndex];
        if (nextBlank) {
            delete nextBlank._lyricsShown;
        }
        isAnswered = false;
        isRevealed = false;
        hasCutForBlank = false;

        hideTimer();
        resetTimerDisplay();

        renderStageMultiBlankPills();

        const blanks = currentSong.blanks || [];
        const currentBlank = blanks[activeBlankIndex] || {};

        if (stageRibbon) stageRibbon.textContent = `★ BLANK ${activeBlankIndex + 1} OF ${blanks.length} ★`;
        renderInlineBlank(currentBlank);
        guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';

        visualizer.classList.add('playing');
        visualizer.classList.remove('blank-paused');
    });

    window.gameBus.on('TRIGGER_CORRECT_AND_ADVANCE', (data) => {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        isAnswered = false;
        isRevealed = false;
        hasCutForBlank = false;

        hideTimer();
        resetTimerDisplay();

        showVerdict('correct', 'fa-solid fa-check', 'TAMA!');
        window.pixelConfetti.burst(150);
        window.gameAudio.playCorrectDing();

        if (data && typeof data.activeBlankIndex === 'number') {
            activeBlankIndex = data.activeBlankIndex;
        }

        renderStageMultiBlankPills();

        const blanks = currentSong.blanks || [];
        const currentBlank = blanks[activeBlankIndex] || {};

        stageRibbon.textContent = `★ EVERYBODY, SING! ★ (BLANK ${activeBlankIndex + 1} OF ${blanks.length})`;
        renderInlineBlank(currentBlank);
        guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';

        visualizer.classList.add('playing');
        visualizer.classList.remove('blank-paused');
    });

    window.gameBus.on('TRIGGER_WRONG', (data) => {
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

                visualizer.classList.remove('playing');
                visualizer.classList.add('blank-paused');
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
                guessRevealBox.classList.remove('wrong-guess');
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
    });
    window.gameBus.on('TRIGGER_TIMEOUT', () => {
        showVerdict('timeout', 'fa-solid fa-hourglass-end', "TIME'S UP!");
        if (stageRibbon) {
            stageRibbon.textContent = "★ TIME'S UP! ★";
        }
        window.gameAudio.playTimeoutBuzzer();
    });

    window.gameBus.on('TENSION_ROLL', (data) => {
        const dur = (data && data.duration) ? data.duration : 2.5;
        window.gameAudio.playTensionRoll(dur);
    });

    window.gameBus.on('SET_ACTIVE_BLANK', (data) => {
        if (data && typeof data.index === 'number') {
            activeBlankIndex = data.index;
            isRevealed = false;
            isAnswered = false;
            hasCutForBlank = false;
            renderStageMultiBlankPills();
            showQuestionPrompter();
        }
    });

    function showWaitingScreen() {
        currentSong = null;
        isRevealed = false;
        isAnswered = false;
        hasCutForBlank = false;
        activeBlankIndex = 0;

        if (stageRibbon) {
            stageRibbon.textContent = '★ READY FOR NEXT ROUND ★';
            stageRibbon.style.display = 'block';
        }
        if (stageMultiBlankBar) {
            stageMultiBlankBar.style.display = 'none';
            stageMultiBlankBar.innerHTML = '';
        }
        if (blankBox) {
            blankBox.classList.remove('inline-blank-wrong', 'revealed');
            blankBox.style.display = 'none';
        }
        if (guessRevealBox) {
            guessRevealBox.classList.remove('active', 'wrong-guess');
            guessRevealBox.style.display = 'none';
        }
        if (visualizer) {
            visualizer.classList.remove('playing', 'blank-paused');
        }

        hideTimer();
        resetTimerDisplay();

        promptTextEl.innerHTML = `
            <div style="font-size:2.2rem; color:var(--brand-blue); font-weight:bold; margin-bottom:10px;">
                ♫ READY FOR THE NEXT SONG ♫
            </div>
            <div style="font-size:1.1rem; color:#666;">
                Stand by for the next round!
            </div>
        `;
    }

    window.gameBus.on('STAGE_WAITING', () => {
        showWaitingScreen();
    });

    window.gameBus.on('FADE_OUT_AUDIO', (data) => {
        const dur = (data && data.duration) ? data.duration : 2000;
        window.gameAudio.fadeOutAndStop(dur);
    });

    window.gameBus.on('STAGE_GRAND_VICTORY', (data) => {
        const score = (data && typeof data.score === 'number') ? data.score : null;
        const total = (data && typeof data.total === 'number') ? data.total : (currentSong && currentSong.blanks ? currentSong.blanks.length : 10);
        const scoreText = (data && data.scoreText) ? data.scoreText : (score !== null ? `${score}/${total}` : '');

        if (stageRibbon) {
            stageRibbon.textContent = scoreText ? `★ FINAL SCORE: ${scoreText} ★` : '★ EVERYBODY, SING! ★';
            stageRibbon.style.display = 'block';
        }

        if (blankBox) {
            blankBox.classList.remove('inline-blank-wrong', 'revealed');
            blankBox.style.display = 'none';
        }
        if (guessRevealBox) {
            guessRevealBox.classList.remove('active', 'wrong-guess');
            guessRevealBox.style.display = 'none';
        }

        const isPerfect = (score !== null && score >= total);
        const headlineText = isPerfect ? 'PERFECT SCORE! 100% CLEAR!' : 'EVERYBODY, SING! FINISHED';
        const subText = isPerfect 
            ? 'JACKPOT WINNER! WHAT A PERFORMANCE!' 
            : (score !== null ? `Great effort! Cleared ${score} out of ${total} blanks!` : 'Well done to the faculty!');

        promptTextEl.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;">
                <div style="font-size:1.6rem; color:var(--accent-yellow); font-weight:bold; letter-spacing:1px; text-transform:uppercase;">
                    ★ ${headlineText} ★
                </div>
                ${scoreText ? `
                <div style="font-size:4.8rem; font-weight:900; color:#FFF; background:var(--brand-blue); padding:6px 36px; border:4px solid #000; box-shadow:6px 6px 0px #000; margin:10px 0; border-radius:10px; letter-spacing:4px; text-shadow:3px 3px 0px #000;">
                    SCORE: ${scoreText}
                </div>` : ''}
                <div style="font-size:1.3rem; color:#333; font-weight:bold;">
                    ${subText}
                </div>
            </div>
        `;

        window.pixelConfetti.burst(isPerfect ? 450 : 280);
        window.gameAudio.playCorrectDing();
    });

    window.gameBus.on('SYNC_STATE', (state) => {
        if (!state) return;
        if (state.currentSong) {
            window.gameBus.handleMessage({ type: 'SET_SONG', payload: state.currentSong });
            if (typeof state.activeBlankIndex === 'number') {
                activeBlankIndex = state.activeBlankIndex;
                renderStageMultiBlankPills();
            }
            if (state.isRevealed) {
                window.gameBus.handleMessage({ type: 'REVEAL_ANSWER' });
            }
        }
    });

    window.gameAudio.onTimeUpdate = (curr, dur) => {
        if (!currentSong) return;

        if (currentSong.mode === 'guess' && hulaReplayStopAt !== null && curr >= hulaReplayStopAt) {
            hulaReplayStopAt = null;
            visualizer.classList.remove('playing');
            visualizer.classList.add('blank-paused');
            window.gameAudio.smoothStop(3000);
            if (stageRibbon) stageRibbon.textContent = '★ READY FOR NEXT HULA ★';
            promptTextEl.innerHTML = '<div style="font-size:1.8rem; color:var(--brand-blue); font-weight:bold;">♫ READY FOR THE NEXT HULA ♫</div>';
            guessRevealBox.classList.remove('wrong-guess');
        guessRevealBox.style.display = 'none';
            return;
        }

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            if (activeBlankIndex < blanks.length) {
                const currentBlank = blanks[activeBlankIndex];
                const lyricsTime = Number(currentBlank && currentBlank.lyrics_time) || 0;
                if (currentBlank && !currentBlank.answered && lyricsTime > 0 &&
                    curr >= lyricsTime && !currentBlank._lyricsShown) {
                    currentBlank._lyricsShown = true;
                    renderInlineBlank(currentBlank);
                    renderStageMultiBlankPills();
                }
                if (currentBlank && currentBlank.pause_time > 0 && curr >= currentBlank.pause_time) {
                    if (visualizer.classList.contains('playing') && !visualizer.classList.contains('blank-paused')) {
                        visualizer.classList.add('blank-paused');
                        visualizer.classList.remove('playing');
                        window.gameAudio.smoothStop(280);
                        showQuestionPrompter();
                    }
                }
            }
        } else if (currentSong.blank_time >= 5 && !hasCutForBlank && !isAnswered && !isRevealed) {
            if (curr >= currentSong.blank_time && visualizer.classList.contains('playing') && !visualizer.classList.contains('blank-paused')) {
                hasCutForBlank = true;
                visualizer.classList.add('blank-paused');
                visualizer.classList.remove('playing');
                window.gameAudio.smoothStop(280);
                showQuestionPrompter();
            }
        }
    };

    function formatLyrics(lyrics) {
        if (!lyrics) return '';
        return lyrics.split(' / ').map(line => `<div>${escapeHtml(line)}</div>`).join('');
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function showVerdict(type, iconClass, label) {
        if (flashTimeout) clearTimeout(flashTimeout);

        flashOverlay.className = '';
        flashOverlay.classList.add(`flash-${type}`);
        verdictIcon.className = `verdict-icon ${iconClass}`;
        verdictText.textContent = label;

        flashTimeout = setTimeout(() => {
            flashOverlay.className = '';
        }, 1200);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        }
    });

    document.addEventListener('dblclick', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    });

    // =========================================================================
    // STAGE ROULETTE / SPINNER WHEEL
    // =========================================================================
    const stageCard = document.querySelector('.stage-card');
    const stageRouletteContainer = document.getElementById('stage-roulette-container');
    const stageRouletteCanvas = document.getElementById('stage-roulette-canvas');
    const stageWheelPointer = document.getElementById('stage-wheel-pointer');
    const stageCenterHub = document.getElementById('stage-center-hub');
    const stageRouletteStatusBadge = document.getElementById('stage-roulette-status-badge');
    const stageRouletteWinnerBanner = document.getElementById('stage-roulette-winner-banner');
    const stageWinnerTitle = document.getElementById('stage-winner-title');
    const stageWinnerArtist = document.getElementById('stage-winner-artist');

    let stageRouletteCtx = stageRouletteCanvas ? stageRouletteCanvas.getContext('2d') : null;
    let stageActiveSongs = [];
    let stageIsSpinning = false;
    let stageCurrentRotation = 0;
    let stageStartRotation = 0;
    let stageEndRotation = 0;
    let stageSpinStartTime = 0;
    let stageSpinDuration = 5200;
    let stageLastPegIndex = -1;
    let stageAnimationFrameId = null;

    const STAGE_LOGICAL_SIZE = 560;
    const STAGE_DPR = window.devicePixelRatio || 1;
    if (stageRouletteCanvas && stageRouletteCtx) {
        stageRouletteCanvas.width = STAGE_LOGICAL_SIZE * STAGE_DPR;
        stageRouletteCanvas.height = STAGE_LOGICAL_SIZE * STAGE_DPR;
        stageRouletteCtx.scale(STAGE_DPR, STAGE_DPR);
    }

    const STAGE_CENTER_X = STAGE_LOGICAL_SIZE / 2;
    const STAGE_CENTER_Y = STAGE_LOGICAL_SIZE / 2;
    const STAGE_RADIUS = 246;
    const STAGE_HUB_RADIUS = 48;

    const STAGE_PALETTE = [
        { bg: '#176b3a', text: '#ffffff' },
        { bg: '#d9e84f', text: '#123824' },
        { bg: '#1f7a8c', text: '#ffffff' },
        { bg: '#c28a32', text: '#ffffff' },
        { bg: '#6b2d5c', text: '#ffffff' },
        { bg: '#9edb7b', text: '#123824' },
        { bg: '#b83b3b', text: '#ffffff' },
        { bg: '#2e4057', text: '#ffffff' }
    ];

    function cleanRouletteTitle(t) {
        if (!t) return '';
        return String(t)
            .replace(/\s*\(Everybody,\s*Sing!\)/gi, '')
            .replace(/\s*\(Jackpot\)/gi, '')
            .trim();
    }

    function triggerStagePointerKick() {
        if (!stageWheelPointer) return;
        stageWheelPointer.classList.remove('hit');
        void stageWheelPointer.offsetWidth;
        stageWheelPointer.classList.add('hit');
        setTimeout(() => {
            stageWheelPointer.classList.remove('hit');
        }, 80);
    }

    function drawStageWheel() {
        if (!stageRouletteCtx) return;
        stageRouletteCtx.clearRect(0, 0, STAGE_LOGICAL_SIZE, STAGE_LOGICAL_SIZE);

        const numSlices = stageActiveSongs.length;
        if (numSlices === 0) return;

        const sliceAngle = (2 * Math.PI) / numSlices;

        // Outer Rim
        stageRouletteCtx.save();
        stageRouletteCtx.beginPath();
        stageRouletteCtx.arc(STAGE_CENTER_X, STAGE_CENTER_Y, STAGE_RADIUS + 14, 0, 2 * Math.PI);
        stageRouletteCtx.fillStyle = '#123824';
        stageRouletteCtx.fill();

        stageRouletteCtx.beginPath();
        stageRouletteCtx.arc(STAGE_CENTER_X, STAGE_CENTER_Y, STAGE_RADIUS + 8, 0, 2 * Math.PI);
        stageRouletteCtx.fillStyle = '#c28a32';
        stageRouletteCtx.fill();

        stageRouletteCtx.beginPath();
        stageRouletteCtx.arc(STAGE_CENTER_X, STAGE_CENTER_Y, STAGE_RADIUS + 2, 0, 2 * Math.PI);
        stageRouletteCtx.fillStyle = '#f6e27a';
        stageRouletteCtx.fill();
        stageRouletteCtx.restore();

        // Slices
        for (let i = 0; i < numSlices; i++) {
            const startAngle = stageCurrentRotation + (i * sliceAngle);
            const endAngle = startAngle + sliceAngle;
            const color = STAGE_PALETTE[i % STAGE_PALETTE.length];

            stageRouletteCtx.save();
            stageRouletteCtx.beginPath();
            stageRouletteCtx.moveTo(STAGE_CENTER_X, STAGE_CENTER_Y);
            stageRouletteCtx.arc(STAGE_CENTER_X, STAGE_CENTER_Y, STAGE_RADIUS, startAngle, endAngle);
            stageRouletteCtx.closePath();
            stageRouletteCtx.fillStyle = color.bg;
            stageRouletteCtx.fill();

            stageRouletteCtx.strokeStyle = '#123824';
            stageRouletteCtx.lineWidth = 2.5;
            stageRouletteCtx.stroke();
            stageRouletteCtx.restore();

            // Label
            stageRouletteCtx.save();
            stageRouletteCtx.translate(STAGE_CENTER_X, STAGE_CENTER_Y);
            const midAngle = startAngle + (sliceAngle / 2);
            stageRouletteCtx.rotate(midAngle);

            const display = cleanRouletteTitle(stageActiveSongs[i].title);
            stageRouletteCtx.textAlign = 'right';
            stageRouletteCtx.textBaseline = 'middle';
            stageRouletteCtx.fillStyle = color.text;

            let fontSize = 13.5;
            if (numSlices > 16) fontSize = 10.5;
            else if (numSlices > 12) fontSize = 12;

            stageRouletteCtx.font = `800 ${fontSize}px Montserrat, Arial, sans-serif`;

            let text = display;
            const maxChars = numSlices > 14 ? 18 : 24;
            if (text.length > maxChars) {
                text = text.substring(0, maxChars - 1) + '…';
            }

            stageRouletteCtx.shadowColor = 'rgba(0,0,0,0.4)';
            stageRouletteCtx.shadowBlur = 3;
            stageRouletteCtx.shadowOffsetX = 1;
            stageRouletteCtx.shadowOffsetY = 1;

            stageRouletteCtx.fillText(text, STAGE_RADIUS - 22, 0);
            stageRouletteCtx.restore();
        }

        // Pegs
        for (let i = 0; i < numSlices; i++) {
            const pegAngle = stageCurrentRotation + (i * sliceAngle);
            const pegX = STAGE_CENTER_X + Math.cos(pegAngle) * (STAGE_RADIUS + 7);
            const pegY = STAGE_CENTER_Y + Math.sin(pegAngle) * (STAGE_RADIUS + 7);

            stageRouletteCtx.save();
            stageRouletteCtx.beginPath();
            stageRouletteCtx.arc(pegX, pegY, 4.5, 0, 2 * Math.PI);
            stageRouletteCtx.fillStyle = '#ffffff';
            stageRouletteCtx.fill();
            stageRouletteCtx.lineWidth = 1.5;
            stageRouletteCtx.strokeStyle = '#123824';
            stageRouletteCtx.stroke();
            stageRouletteCtx.restore();
        }

        // Center Hole
        stageRouletteCtx.save();
        stageRouletteCtx.beginPath();
        stageRouletteCtx.arc(STAGE_CENTER_X, STAGE_CENTER_Y, STAGE_HUB_RADIUS + 4, 0, 2 * Math.PI);
        stageRouletteCtx.fillStyle = '#123824';
        stageRouletteCtx.fill();
        stageRouletteCtx.restore();
    }

    function showStageRoulette(songs = null) {
        if (!stageRouletteContainer) return;
        if (stageCard) stageCard.style.display = 'none';
        stageRouletteContainer.style.display = 'flex';

        if (stageRouletteWinnerBanner) {
            stageRouletteWinnerBanner.style.display = 'none';
        }

        if (stageRouletteStatusBadge) {
            stageRouletteStatusBadge.textContent = 'READY TO SPIN';
            stageRouletteStatusBadge.className = 'badge badge-yellow';
        }

        if (songs && Array.isArray(songs) && songs.length > 0) {
            stageActiveSongs = songs;
            drawStageWheel();
        } else if (stageActiveSongs.length === 0) {
            fetch('/api/songs')
                .then(r => r.json())
                .then(data => {
                    stageActiveSongs = data.filter(s => s.mode === 'everybody_sing');
                    drawStageWheel();
                })
                .catch(() => {});
        } else {
            drawStageWheel();
        }
    }

    function hideStageRoulette() {
        if (!stageRouletteContainer) return;
        if (stageIsSpinning) return;
        stageRouletteContainer.style.display = 'none';
        if (stageCard) stageCard.style.display = 'block';
    }

    function startStageSpin(data) {
        if (!data) return;
        showStageRoulette(data.songs);

        stageIsSpinning = true;
        if (stageCenterHub) stageCenterHub.classList.add('spinning');
        if (stageRouletteStatusBadge) {
            stageRouletteStatusBadge.textContent = 'SPINNING...';
            stageRouletteStatusBadge.className = 'badge badge-red';
        }
        if (stageRouletteWinnerBanner) {
            stageRouletteWinnerBanner.style.display = 'none';
        }

        stageStartRotation = data.startRotation !== undefined ? data.startRotation : stageCurrentRotation;
        stageEndRotation = stageStartRotation + (data.totalDelta || (Math.PI * 12));
        stageSpinStartTime = performance.now();
        stageSpinDuration = data.duration || 5200;
        stageLastPegIndex = -1;

        if (stageAnimationFrameId) cancelAnimationFrame(stageAnimationFrameId);
        stageAnimationFrameId = requestAnimationFrame((ts) => animateStageSpin(ts, data.winner));
    }

    function animateStageSpin(timestamp, winner) {
        const elapsed = timestamp - stageSpinStartTime;
        const progress = Math.min(1.0, elapsed / stageSpinDuration);
        const ease = 1 - Math.pow(1 - progress, 5); // easeOutQuint

        stageCurrentRotation = stageStartRotation + (stageEndRotation - stageStartRotation) * ease;

        const numSlices = stageActiveSongs.length;
        if (numSlices > 0) {
            const sliceAngle = (2 * Math.PI) / numSlices;
            const pointerAngle = (3 * Math.PI) / 2;
            const wheelAngle = (pointerAngle - (stageCurrentRotation % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
            const currentPeg = Math.floor(wheelAngle / sliceAngle);

            if (currentPeg !== stageLastPegIndex) {
                stageLastPegIndex = currentPeg;
                if (window.gameAudio) {
                    window.gameAudio.playWheelTick();
                }
                triggerStagePointerKick();
            }
        }

        drawStageWheel();

        if (progress < 1.0) {
            stageAnimationFrameId = requestAnimationFrame((ts) => animateStageSpin(ts, winner));
        } else {
            finishStageSpin(winner);
        }
    }

    function finishStageSpin(winner) {
        stageIsSpinning = false;
        if (stageCenterHub) stageCenterHub.classList.remove('spinning');
        if (stageRouletteStatusBadge) {
            stageRouletteStatusBadge.textContent = 'WINNER CHOSEN!';
            stageRouletteStatusBadge.className = 'badge badge-yellow';
        }

        if (winner && stageRouletteWinnerBanner) {
            stageWinnerTitle.textContent = cleanRouletteTitle(winner.title);
            stageWinnerArtist.textContent = winner.artist || 'Unknown Artist';
            stageRouletteWinnerBanner.style.display = 'block';
        }

        // Confetti explosion
        if (window.pixelConfetti) {
            window.pixelConfetti.burst(320);
        }

        // Victory Chime
        if (window.gameAudio) {
            window.gameAudio.playWheelWin();
        }
    }

    // Bus Listeners for Roulette
    window.gameBus.on('ROULETTE_SHOW', (data) => {
        showStageRoulette(data ? data.songs : null);
    });

    window.gameBus.on('ROULETTE_HIDE', () => {
        hideStageRoulette();
    });

    window.gameBus.on('ROULETTE_SPIN', (data) => {
        startStageSpin(data);
    });

    window.gameBus.on('ROULETTE_WIN', (data) => {
        if (!stageIsSpinning && data && data.winner) {
            showStageRoulette();
            finishStageSpin(data.winner);
        }
    });

    // Keyboard shortcut 'R' to toggle stage roulette
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' || e.key === 'R') {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                if (stageRouletteContainer && stageRouletteContainer.style.display === 'flex') {
                    hideStageRoulette();
                } else {
                    showStageRoulette();
                }
            }
        }
    });

    if (stageCenterHub) {
        stageCenterHub.addEventListener('click', () => {
            if (stageIsSpinning) return;
            // Send trigger to roulette bus
            window.gameBus.send('ROULETTE_TRIGGER_SPIN');
        });
    }

    window.gameBus.on('SET_AUDIO_OUTPUT_MODE', (data) => {
        if (!data) return;
        if (data.mode === 'controller') {
            window.gameAudio.setMuted(true);
        } else {
            window.gameAudio.setMuted(false);
        }
    });

    window.gameBus.on('PING_STAGE', () => {
        window.gameBus.send('STAGE_READY', { active: true });
    });

    window.gameAudio.setMuted(true);
    window.gameBus.send('STAGE_READY', { active: true });
    window.gameBus.send('SYNC_REQUEST');
});
