document.addEventListener('DOMContentLoaded', () => {
    const stageRibbon = document.getElementById('stage-card-ribbon');
    const stageMultiBlankBar = document.getElementById('stage-multiblank-bar');
    const promptTextEl = document.getElementById('stage-prompt-text');
    const blankBox = document.getElementById('stage-blank-box');
    const guessRevealBox = document.getElementById('stage-guess-reveal');
    const guessTitleEl = document.getElementById('stage-guess-title');
    const guessArtistEl = document.getElementById('stage-guess-artist');
    const visualizer = document.getElementById('stage-visualizer');
    const timerBox = document.getElementById('stage-timer-box');
    const timerDigits = document.getElementById('stage-timer-digits');
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

    function showTimer() {
        if (timerBox) timerBox.classList.remove('hidden');
    }

    function hideTimer() {
        if (timerBox) timerBox.classList.add('hidden');
    }

    function resetTimerDisplay() {
        if (timerDigits) {
            timerDigits.textContent = '00:10';
            timerDigits.classList.remove('warning', 'critical');
        }
    }

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
        const blank = revealed
            ? `<span class="inline-blank inline-blank-revealed">★ ${escapeHtml(currentBlank.blank_lyrics || currentBlank.answer || '')} ★</span>`
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
            const isCurrent = (idx === activeBlankIndex);
            const isPast = (idx < activeBlankIndex);
            pill.className = `multiblank-pill ${isCurrent ? 'active' : ''} ${isPast ? 'completed' : ''}`;
            
            let label = `BLANK ${idx + 1}`;
            if (isPast) {
                label = `✓ ${escapeHtml(b.blank_lyrics || b.answer)}`;
            } else if (isCurrent) {
                label = `★ BLANK ${idx + 1}`;
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

        blankBox.classList.remove('revealed');
        blankBox.style.display = 'none';
        guessRevealBox.classList.remove('active');
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
        visualizer.classList.add('playing');
        visualizer.classList.remove('blank-paused');
        
        hideTimer();

        if (isRevealed || isAnswered || (data && data.isResume)) {
            const fromTime = (data && data.fromTime !== undefined && data.fromTime !== null) ? data.fromTime : null;
            if (fromTime !== null) {
                window.gameAudio.playTrack(fromTime, currentSong.mode !== 'everybody_sing');
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
                }
                return;
            }
        }

        blankBox.style.display = 'none';
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

                visualizer.classList.add('playing');
                visualizer.classList.remove('blank-paused');
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
        guessRevealBox.style.display = 'none';

        visualizer.classList.add('playing');
        visualizer.classList.remove('blank-paused');
    });

    window.gameBus.on('TRIGGER_WRONG', () => {
        showVerdict('wrong', 'fa-solid fa-xmark', 'MALI!');
        window.gameAudio.playWrongBuzzer();
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

    window.gameBus.on('UPDATE_TIMER', (timerData) => {
        if (!timerData) return;
        const seconds = Math.max(0, timerData.remaining || 0);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDigits.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (timerData.isRunning && seconds > 0 && !isAnswered && !isRevealed) {
            showTimer();
            showQuestionPrompter();
        } else {
            hideTimer();
        }

        timerDigits.classList.remove('warning', 'critical');
        if (seconds <= 5 && seconds > 0 && timerData.isRunning && !isAnswered && !isRevealed) {
            timerDigits.classList.add('critical');
            if (timerData.tick) window.gameAudio.playWarningCountdown(seconds);
        } else if (seconds <= 10 && seconds > 0 && timerData.isRunning && !isAnswered && !isRevealed) {
            timerDigits.classList.add('warning');
            if (timerData.tick) window.gameAudio.playTick(false);
        }
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

    window.gameBus.on('STAGE_GRAND_VICTORY', () => {
        stageRibbon.textContent = '';
        promptTextEl.innerHTML = `
            <div style="font-size:2.4rem; color:var(--accent-yellow); font-weight:bold; margin-bottom:10px;">
                EVERYBODY, SING!
            </div>
        `;
        window.pixelConfetti.burst(400);
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
        if (state.timer) {
            window.gameBus.handleMessage({ type: 'UPDATE_TIMER', payload: state.timer });
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
