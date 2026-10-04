/**
 * ============================================================================
 * SONG ROULETTE - EVERYBODY, SING!
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Canvas & Context
    const canvas = document.getElementById('roulette-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // UI Elements
    const pointerEl = document.getElementById('wheel-pointer');
    const centerHubBtn = document.getElementById('btn-center-spin');
    const btnSpinMain = document.getElementById('btn-spin-main');
    const wheelStatusBadge = document.getElementById('wheel-status-badge');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const btnToggleFullscreen = document.getElementById('btn-toggle-fullscreen');
    const btnToggleStageWheel = document.getElementById('btn-toggle-stage-wheel');
    let isStageWheelShowing = false;

    // Pointed Song Elements
    const pointedSongCard = document.getElementById('pointed-song-card');
    const pointedStatusPill = document.getElementById('pointed-status-pill');
    const pointedSongTitle = document.getElementById('pointed-song-title');
    const pointedSongArtist = document.getElementById('pointed-song-artist');
    const pointedBlanksPreview = document.getElementById('pointed-blanks-preview');
    const pointedBlanksCount = document.getElementById('pointed-blanks-count');
    const pointedStartTime = document.getElementById('pointed-start-time');
    const pointedLyricsSnippet = document.getElementById('pointed-lyrics-snippet');
    const pointedAudioControls = document.getElementById('pointed-audio-controls');
    const audioProgressBar = document.getElementById('audio-progress-bar');
    const audioProgressFill = document.getElementById('audio-progress-fill');
    const audioTimeDisplay = document.getElementById('audio-time-display');
    const btnPlayPointed = document.getElementById('btn-play-pointed');
    const btnPausePointed = document.getElementById('btn-pause-pointed');
    const btnSyncStage = document.getElementById('btn-sync-stage');
    const pointedActionsRow = document.getElementById('pointed-actions-row');
    const btnMarkPlayed = document.getElementById('btn-mark-played');

    // Pool Settings Elements
    const poolActiveCount = document.getElementById('pool-active-count');
    const poolTotalCount = document.getElementById('pool-total-count');
    const poolListScroll = document.getElementById('pool-list-scroll');
    const poolSearchInput = document.getElementById('pool-search-input');
    const btnSelectAll = document.getElementById('btn-select-all');
    const btnUnselectAll = document.getElementById('btn-unselect-all');
    const btnResetPlayed = document.getElementById('btn-reset-played');
    const checkAutoPlay = document.getElementById('check-auto-play');
    const checkAutoRemove = document.getElementById('check-auto-remove');

    // Winner Modal Elements
    const winnerModal = document.getElementById('winner-modal');
    const winnerSongTitle = document.getElementById('winner-song-title');
    const winnerSongArtist = document.getElementById('winner-song-artist');
    const winnerBlanksCount = document.getElementById('winner-blanks-count');
    const winnerLyricsQuote = document.getElementById('winner-lyrics-quote');
    const btnWinnerPlayNow = document.getElementById('btn-winner-play-now');
    const btnWinnerReadyStage = document.getElementById('btn-winner-ready-stage');
    const btnWinnerSpinAgain = document.getElementById('btn-winner-spin-again');
    const btnWinnerClose = document.getElementById('btn-winner-close');

    // Palette for Wheel Wedges (Theme Aligned Neo-Brutalist Colors)
    const PALETTE = [
        { bg: '#176b3a', text: '#ffffff', border: '#0e4625' }, // Forest Green
        { bg: '#d9e84f', text: '#123824', border: '#9aa820' }, // Sunny Yellow
        { bg: '#1f7a8c', text: '#ffffff', border: '#124e5b' }, // Vibrant Teal
        { bg: '#c28a32', text: '#ffffff', border: '#8c611c' }, // Warm Amber Gold
        { bg: '#6b2d5c', text: '#ffffff', border: '#421a38' }, // Velvet Purple
        { bg: '#9edb7b', text: '#123824', border: '#6ea84d' }, // Bright Lime
        { bg: '#b83b3b', text: '#ffffff', border: '#7d2020' }, // Crimson Red
        { bg: '#2e4057', text: '#ffffff', border: '#192534' }  // Slate Navy
    ];

    // State
    let allSongs = [];
    let everybodySongs = [];
    let activeSongs = [];
    let playedSongIds = new Set();
    let checkedSongIds = new Set();
    let currentPointedSong = null;
    let isSoundEnabled = true;

    // Wheel Animation State
    let isSpinning = false;
    let currentRotation = 0; // in radians
    let spinStartRotation = 0;
    let spinEndRotation = 0;
    let spinStartTime = 0;
    let spinDuration = 5200; // ms
    let lastPegIndex = -1;
    let animationFrameId = null;

    // Local Audio State
    let isLocalAudioPlaying = false;

    // High DPI Canvas Setup
    const LOGICAL_SIZE = 600;
    const DPR = window.devicePixelRatio || 1;
    canvas.width = LOGICAL_SIZE * DPR;
    canvas.height = LOGICAL_SIZE * DPR;
    ctx.scale(DPR, DPR);

    const CENTER_X = LOGICAL_SIZE / 2;
    const CENTER_Y = LOGICAL_SIZE / 2;
    const RADIUS = 264;
    const HUB_RADIUS = 52;

    // Helper: Clean title for wedge
    function cleanSongTitle(title) {
        if (!title) return '';
        return String(title)
            .replace(/\s*\(Everybody,\s*Sing!\)/gi, '')
            .replace(/\s*\(Jackpot\)/gi, '')
            .trim();
    }

    // Helper: Format time seconds to mm:ss
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Easing Function: Quintic Ease-Out
    function easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
    }

    // Trigger visual kick on top pointer when peg is hit
    function triggerPointerKick() {
        if (!pointerEl) return;
        pointerEl.classList.remove('hit');
        // Force reflow
        void pointerEl.offsetWidth;
        pointerEl.classList.add('hit');
        setTimeout(() => {
            pointerEl.classList.remove('hit');
        }, 80);
    }

    // =========================================================================
    // DRAWING THE WHEEL
    // =========================================================================
    function drawWheel() {
        ctx.clearRect(0, 0, LOGICAL_SIZE, LOGICAL_SIZE);

        const numSlices = activeSongs.length;

        // If no active songs in wheel
        if (numSlices === 0) {
            drawEmptyWheel();
            return;
        }

        const sliceAngle = (2 * Math.PI) / numSlices;

        // 1. Draw Outer Gold/Dark Border Rim
        ctx.save();
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, RADIUS + 16, 0, 2 * Math.PI);
        ctx.fillStyle = '#123824';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, RADIUS + 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#c28a32';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, RADIUS + 3, 0, 2 * Math.PI);
        ctx.fillStyle = '#f6e27a';
        ctx.fill();
        ctx.restore();

        // 2. Draw Slices
        for (let i = 0; i < numSlices; i++) {
            const startAngle = currentRotation + (i * sliceAngle);
            const endAngle = startAngle + sliceAngle;
            const colorScheme = PALETTE[i % PALETTE.length];

            // Fill Slice Wedge
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(CENTER_X, CENTER_Y);
            ctx.arc(CENTER_X, CENTER_Y, RADIUS, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = colorScheme.bg;
            ctx.fill();

            // Slice Divider Line
            ctx.strokeStyle = '#123824';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // Draw Slice Label (Song Title)
            ctx.save();
            ctx.translate(CENTER_X, CENTER_Y);
            const midAngle = startAngle + (sliceAngle / 2);
            ctx.rotate(midAngle);

            const displayTitle = cleanSongTitle(activeSongs[i].title);
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colorScheme.text;

            // Dynamically scale font size based on slice count
            let fontSize = 14;
            if (numSlices > 16) fontSize = 11;
            else if (numSlices > 12) fontSize = 12.5;
            else if (numSlices > 8) fontSize = 14;
            else fontSize = 16;

            ctx.font = `800 ${fontSize}px Montserrat, Arial, sans-serif`;

            // Max length check and truncate if needed
            let textToRender = displayTitle;
            const maxChars = numSlices > 14 ? 18 : 24;
            if (textToRender.length > maxChars) {
                textToRender = textToRender.substring(0, maxChars - 1) + '…';
            }

            // Text Shadow / Outline for readability
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillText(textToRender, RADIUS - 24, 0);

            // Small blanks indicator number near rim
            const blanks = activeSongs[i].blanks || [];
            if (blanks.length > 0 && numSlices <= 14) {
                ctx.font = `700 9px Montserrat, Arial, sans-serif`;
                ctx.globalAlpha = 0.85;
                ctx.fillText(`[${blanks.length}]`, RADIUS - 8, 0);
            }

            ctx.restore();
        }

        // 3. Draw Outer Light Bulbs / Metallic Pegs
        for (let i = 0; i < numSlices; i++) {
            const pegAngle = currentRotation + (i * sliceAngle);
            const pegX = CENTER_X + Math.cos(pegAngle) * (RADIUS + 8);
            const pegY = CENTER_Y + Math.sin(pegAngle) * (RADIUS + 8);

            ctx.save();
            ctx.beginPath();
            ctx.arc(pegX, pegY, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#123824';
            ctx.stroke();

            // Tiny light gleam
            ctx.beginPath();
            ctx.arc(pegX - 1.5, pegY - 1.5, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#fffae0';
            ctx.fill();
            ctx.restore();
        }

        // 4. Draw Center Hole/Ring
        ctx.save();
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, HUB_RADIUS + 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#123824';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, HUB_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = '#eef5eb';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#d9e84f';
        ctx.stroke();
        ctx.restore();
    }

    function drawEmptyWheel() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = '#eef5eb';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#123824';
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#176b3a';
        ctx.font = '800 18px Montserrat, sans-serif';
        ctx.fillText('NO SONGS IN WHEEL', CENTER_X, CENTER_Y - 15);

        ctx.fillStyle = '#666';
        ctx.font = '600 12px Montserrat, sans-serif';
        ctx.fillText('Check songs below or click RESET ALL', CENTER_X, CENTER_Y + 15);
        ctx.restore();
    }

    // =========================================================================
    // CALCULATION: POINTED / WINNING SONG
    // =========================================================================
    function getSliceUnderPointer() {
        if (activeSongs.length === 0) return null;
        const numSlices = activeSongs.length;
        const sliceAngle = (2 * Math.PI) / numSlices;

        // Pointer is at top: 12 o'clock, which is -pi/2 or 3pi/2 in canvas radians
        const pointerAngle = (3 * Math.PI) / 2;

        // Angle on the wheel canvas under the pointer
        const wheelAngle = (pointerAngle - (currentRotation % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
        const index = Math.floor(wheelAngle / sliceAngle) % numSlices;
        return { index, song: activeSongs[index] };
    }

    // =========================================================================
    // SPIN EXECUTION & ANIMATION
    // =========================================================================
    function spinWheel() {
        if (isSpinning) return;
        if (activeSongs.length === 0) {
            alert('No songs available in the wheel! Check songs in the list or click "RESET ALL".');
            return;
        }

        // Initialize audio engine on user interaction
        if (window.gameAudio) {
            window.gameAudio.initContext();
        }

        isSpinning = true;
        btnSpinMain.disabled = true;
        centerHubBtn.classList.add('spinning');
        wheelStatusBadge.textContent = 'SPINNING...';
        wheelStatusBadge.className = 'badge badge-red';

        // Choose random target index fairly
        const targetIndex = Math.floor(Math.random() * activeSongs.length);
        const numSlices = activeSongs.length;
        const sliceAngle = (2 * Math.PI) / numSlices;

        // Add 6 to 9 full revolutions for suspense
        const extraTurns = 6 + Math.floor(Math.random() * 3);

        // Pointer is at 3pi/2.
        // We want the wheel's localAngle under the pointer to land inside targetIndex wedge.
        // Add random jitter between 20% and 80% of wedge width
        const jitter = sliceAngle * (0.2 + Math.random() * 0.6);
        const targetLocalAngle = targetIndex * sliceAngle + jitter;

        // targetRotation mod 2pi = 3pi/2 - targetLocalAngle
        const pointerAngle = (3 * Math.PI) / 2;
        const targetModulo = (pointerAngle - targetLocalAngle + 4 * Math.PI) % (2 * Math.PI);

        const currentModulo = ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        let delta = (targetModulo - currentModulo + 2 * Math.PI) % (2 * Math.PI);
        if (delta < Math.PI * 0.5) {
            delta += 2 * Math.PI;
        }

        const totalDelta = extraTurns * 2 * Math.PI + delta;

        spinStartRotation = currentRotation;
        spinEndRotation = spinStartRotation + totalDelta;
        spinStartTime = performance.now();
        spinDuration = 4800 + Math.random() * 700; // 4.8s - 5.5s
        lastPegIndex = -1;

        if (window.gameBus) {
            window.gameBus.send('ROULETTE_SPIN', {
                songs: activeSongs,
                targetIndex: targetIndex,
                startRotation: spinStartRotation,
                totalDelta: totalDelta,
                duration: spinDuration,
                winner: activeSongs[targetIndex]
            });
        }

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animateSpin);
    }

    function animateSpin(timestamp) {
        const elapsed = timestamp - spinStartTime;
        const progress = Math.min(1.0, elapsed / spinDuration);
        const ease = easeOutQuint(progress);

        currentRotation = spinStartRotation + (spinEndRotation - spinStartRotation) * ease;

        // Check peg ticks
        const numSlices = activeSongs.length;
        if (numSlices > 0) {
            const sliceAngle = (2 * Math.PI) / numSlices;
            const pointerAngle = (3 * Math.PI) / 2;
            const wheelAngle = (pointerAngle - (currentRotation % (2 * Math.PI)) + 4 * Math.PI) % (2 * Math.PI);
            const currentPeg = Math.floor(wheelAngle / sliceAngle);

            if (currentPeg !== lastPegIndex) {
                lastPegIndex = currentPeg;
                if (window.gameAudio && isSoundEnabled) {
                    window.gameAudio.playWheelTick();
                }
                triggerPointerKick();
            }
        }

        drawWheel();

        if (progress < 1.0) {
            animationFrameId = requestAnimationFrame(animateSpin);
        } else {
            // Spin Finished!
            finishSpin();
        }
    }

    function finishSpin() {
        isSpinning = false;
        btnSpinMain.disabled = false;
        centerHubBtn.classList.remove('spinning');
        wheelStatusBadge.textContent = 'READY TO SPIN';
        wheelStatusBadge.className = 'badge badge-yellow';

        const result = getSliceUnderPointer();
        if (!result || !result.song) return;

        const winner = result.song;
        handleWinnerSelection(winner);
    }

    // =========================================================================
    // WINNER SELECTION & "PLAYED NEXT" LOGIC
    // =========================================================================
    function handleWinnerSelection(song) {
        currentPointedSong = song;

        // 1. Confetti Burst
        if (window.pixelConfetti) {
            window.pixelConfetti.burst(150);
        }

        // 2. Play Victory Fanfare Sound
        if (window.gameAudio && isSoundEnabled) {
            window.gameAudio.playWheelWin();
        }

        // 3. Update Pointed Song Dashboard Card
        updatePointedCard(song);

        // 4. Auto-Options Check
        const shouldAutoPlay = checkAutoPlay && checkAutoPlay.checked;
        const shouldAutoRemove = checkAutoRemove && checkAutoRemove.checked;

        // 5. Broadcast to Controller and Stage Screen via gameBus
        // - SELECT_SONG notifies controller.js to select this song (and optionally play immediately)
        // - SET_SONG notifies display.js to display this song on the stage LED screen
        if (window.gameBus) {
            window.gameBus.send('SELECT_SONG', {
                songId: song.id,
                song: song,
                playNow: shouldAutoPlay
            });
            window.gameBus.send('SET_SONG', song);
            window.gameBus.send('ROULETTE_WIN', {
                winner: song
            });
        }

        // 6. If Auto-Play is enabled, also trigger local playback preview
        if (shouldAutoPlay) {
            playSongAudio(song);
        }

        // 7. If Auto-Remove is enabled, mark the song as played
        if (shouldAutoRemove) {
            markSongPlayed(song.id);
        }

        // 8. Open Winner Celebration Modal
        openWinnerModal(song);
    }

    // Update the Dashboard "UP NEXT TO PLAY" Card
    function updatePointedCard(song) {
        if (!song) return;

        pointedSongTitle.textContent = cleanSongTitle(song.title);
        pointedSongArtist.textContent = song.artist || 'Unknown Artist';
        pointedStatusPill.textContent = 'POINTED & READY';
        pointedStatusPill.className = 'badge badge-yellow';

        const blanks = song.blanks || [];
        pointedBlanksPreview.style.display = 'block';
        pointedBlanksCount.textContent = `${blanks.length} BLANKS`;

        const startSec = (blanks.length > 0 && blanks[0].lyrics_time !== undefined)
            ? blanks[0].lyrics_time
            : (song.start_time || 0);
        pointedStartTime.textContent = `START: ${formatTime(startSec)}`;

        // Snippet: first blank prompt or opening lyrics
        const firstPrompt = blanks.length > 0 && blanks[0].prompt_lyrics
            ? blanks[0].prompt_lyrics
            : (song.prompt_lyrics || 'No prompt lyrics preview available');
        pointedLyricsSnippet.innerHTML = `"${escapeHtml(firstPrompt)}"`;

        // Audio controls
        pointedAudioControls.style.display = 'flex';
        pointedActionsRow.style.display = 'flex';

        // Load into audio engine for preview
        if (song.audio_url && window.gameAudio) {
            window.gameAudio.loadTrack(song.audio_url, startSec);
        }
    }

    // Audio Playback
    function playSongAudio(song) {
        if (!song || !song.audio_url || !window.gameAudio) return;
        const blanks = song.blanks || [];
        const startSec = (blanks.length > 0 && blanks[0].lyrics_time !== undefined)
            ? blanks[0].lyrics_time
            : (song.start_time || 0);

        window.gameAudio.seek(startSec);
        window.gameAudio.playTrack(startSec, false);
        isLocalAudioPlaying = true;
        btnPlayPointed.innerHTML = '<i class="fa-solid fa-play"></i> PLAYING...';
        btnPlayPointed.className = 'btn btn-sm btn-yellow';

        if (window.gameBus) {
            window.gameBus.send('PLAY_AUDIO', { fromTime: startSec });
        }
    }

    function pauseSongAudio() {
        if (window.gameAudio) {
            window.gameAudio.pauseTrack();
        }
        isLocalAudioPlaying = false;
        btnPlayPointed.innerHTML = '<i class="fa-solid fa-play"></i> PLAY AUDIO';
        btnPlayPointed.className = 'btn btn-sm btn-primary';

        if (window.gameBus) {
            window.gameBus.send('STOP_AUDIO');
        }
    }

    // Winner Modal Setup
    function openWinnerModal(song) {
        if (!winnerModal || !song) return;
        winnerSongTitle.textContent = cleanSongTitle(song.title);
        winnerSongArtist.textContent = song.artist || 'Unknown Artist';

        const blanks = song.blanks || [];
        winnerBlanksCount.textContent = `${blanks.length} BLANKS`;

        const firstPrompt = blanks.length > 0 && blanks[0].prompt_lyrics
            ? blanks[0].prompt_lyrics
            : (song.prompt_lyrics || '');
        winnerLyricsQuote.textContent = firstPrompt ? `"${firstPrompt}"` : '';

        winnerModal.classList.remove('hidden');
    }

    function closeWinnerModal() {
        if (winnerModal) winnerModal.classList.add('hidden');
    }

    // =========================================================================
    // SONG POOL MANAGEMENT
    // =========================================================================
    function markSongPlayed(songId) {
        playedSongIds.add(songId);
        recomputeActiveSongs();
        renderPoolList();
        drawWheel();
    }

    function unmarkSongPlayed(songId) {
        playedSongIds.delete(songId);
        recomputeActiveSongs();
        renderPoolList();
        drawWheel();
    }

    function toggleSongChecked(songId) {
        if (checkedSongIds.has(songId)) {
            checkedSongIds.delete(songId);
        } else {
            checkedSongIds.add(songId);
        }
        recomputeActiveSongs();
        renderPoolList();
        drawWheel();
    }

    function recomputeActiveSongs() {
        // Active songs = in everybodySongs, checked, and NOT played
        activeSongs = everybodySongs.filter(s => checkedSongIds.has(s.id) && !playedSongIds.has(s.id));
        if (poolActiveCount) poolActiveCount.textContent = activeSongs.length;
        if (poolTotalCount) poolTotalCount.textContent = everybodySongs.length;

        if (isStageWheelShowing && window.gameBus) {
            window.gameBus.send('ROULETTE_SHOW', { songs: activeSongs });
        }
    }

    function renderPoolList() {
        if (!poolListScroll) return;
        const query = (poolSearchInput ? poolSearchInput.value : '').toLowerCase().trim();

        poolListScroll.innerHTML = '';

        everybodySongs.forEach((song, idx) => {
            const titleClean = cleanSongTitle(song.title);
            const artist = song.artist || '';
            const matches = !query || titleClean.toLowerCase().includes(query) || artist.toLowerCase().includes(query);
            if (!matches) return;

            const isChecked = checkedSongIds.has(song.id);
            const isPlayed = playedSongIds.has(song.id);
            const blanksCount = (song.blanks || []).length;

            const item = document.createElement('div');
            item.className = `pool-item ${isPlayed ? 'played' : ''}`;

            item.innerHTML = `
                <div class="pool-item-left">
                    <input type="checkbox" class="pool-song-check" data-id="${song.id}" ${isChecked ? 'checked' : ''}>
                    <div class="pool-item-title-col">
                        <div class="pool-item-title" title="${escapeHtml(song.title)}">${escapeHtml(titleClean)}</div>
                        <div class="pool-item-artist">${escapeHtml(artist)} • ${blanksCount} blanks</div>
                    </div>
                </div>
                <div class="pool-item-right">
                    ${isPlayed 
                        ? `<button type="button" class="btn btn-sm btn-restore" data-id="${song.id}" title="Restore to wheel" style="padding: 2px 6px; font-size: 0.5rem;">RESTORE</button>`
                        : `<button type="button" class="btn btn-sm btn-action btn-select-quick" data-id="${song.id}" title="Select as next song" style="padding: 2px 6px; font-size: 0.5rem;">POINT</button>`
                    }
                </div>
            `;

            // Checkbox event
            const check = item.querySelector('.pool-song-check');
            check.addEventListener('change', () => {
                toggleSongChecked(song.id);
            });

            // Restore / Quick Select event
            const restoreBtn = item.querySelector('.btn-restore');
            if (restoreBtn) {
                restoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    unmarkSongPlayed(song.id);
                });
            }

            const selectQuickBtn = item.querySelector('.btn-select-quick');
            if (selectQuickBtn) {
                selectQuickBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleWinnerSelection(song);
                });
            }

            poolListScroll.appendChild(item);
        });
    }

    // =========================================================================
    // FETCH SONGS API
    // =========================================================================
    async function fetchSongs() {
        try {
            const res = await fetch('/api/songs');
            allSongs = await res.json();

            // Filter for Everybody, Sing! mode songs
            everybodySongs = allSongs.filter(s => s.mode === 'everybody_sing');

            // Default: all everybody songs are checked initially
            checkedSongIds = new Set(everybodySongs.map(s => s.id));
            playedSongIds = new Set();

            recomputeActiveSongs();
            renderPoolList();
            drawWheel();

            // If there are songs, pre-select the first one for dashboard view
            if (everybodySongs.length > 0 && !currentPointedSong) {
                updatePointedCard(everybodySongs[0]);
                currentPointedSong = everybodySongs[0];
            }
        } catch (err) {
            console.error('Failed to load songs from /api/songs:', err);
        }
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    // Spin triggers
    if (btnSpinMain) {
        btnSpinMain.addEventListener('click', spinWheel);
    }
    if (centerHubBtn) {
        centerHubBtn.addEventListener('click', spinWheel);
    }
    canvas.addEventListener('click', spinWheel);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        // Spacebar or Enter to spin
        if (e.code === 'Space' || e.key === 'Enter') {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                e.preventDefault();
                spinWheel();
            }
        }
        // P to play/pause pointed song
        else if (e.key === 'p' || e.key === 'P') {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
                e.preventDefault();
                if (isLocalAudioPlaying) pauseSongAudio();
                else if (currentPointedSong) playSongAudio(currentPointedSong);
            }
        }
        // Esc to close modal
        else if (e.key === 'Escape') {
            closeWinnerModal();
        }
    });

    // Sound toggle
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            isSoundEnabled = !isSoundEnabled;
            if (window.gameAudio) {
                window.gameAudio.setMuted(!isSoundEnabled);
            }
            btnToggleSound.innerHTML = isSoundEnabled
                ? '<i class="fa-solid fa-volume-high"></i> SOUND: ON'
                : '<i class="fa-solid fa-volume-xmark"></i> SOUND: MUTED';
        });
    }

    // Fullscreen toggle
    if (btnToggleFullscreen) {
        btnToggleFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
                btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i> EXIT FULL';
            } else {
                document.exitFullscreen().catch(() => {});
                btnToggleFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i> FULLSCREEN';
            }
        });
    }

    // Stage Wheel Toggle
    if (btnToggleStageWheel) {
        btnToggleStageWheel.addEventListener('click', () => {
            isStageWheelShowing = !isStageWheelShowing;
            if (isStageWheelShowing) {
                if (window.gameBus) {
                    window.gameBus.send('ROULETTE_SHOW', { songs: activeSongs });
                }
                btnToggleStageWheel.innerHTML = '<i class="fa-solid fa-tv"></i> HIDE ON STAGE';
                btnToggleStageWheel.className = 'btn btn-sm btn-danger';
            } else {
                if (window.gameBus) {
                    window.gameBus.send('ROULETTE_HIDE');
                }
                btnToggleStageWheel.innerHTML = '<i class="fa-solid fa-tv"></i> SHOW ON STAGE';
                btnToggleStageWheel.className = 'btn btn-sm btn-action';
            }
        });
    }

    // Pointed Card Actions
    if (btnPlayPointed) {
        btnPlayPointed.addEventListener('click', () => {
            if (currentPointedSong) playSongAudio(currentPointedSong);
        });
    }

    if (btnPausePointed) {
        btnPausePointed.addEventListener('click', () => {
            pauseSongAudio();
        });
    }

    if (btnSyncStage) {
        btnSyncStage.addEventListener('click', () => {
            if (currentPointedSong && window.gameBus) {
                window.gameBus.send('SELECT_SONG', { songId: currentPointedSong.id, song: currentPointedSong, playNow: false });
                window.gameBus.send('SET_SONG', currentPointedSong);
                btnSyncStage.innerHTML = '<i class="fa-solid fa-check"></i> SENT TO STAGE!';
                setTimeout(() => {
                    btnSyncStage.innerHTML = '<i class="fa-solid fa-paper-plane"></i> SEND TO STAGE';
                }, 1500);
            }
        });
    }

    if (btnMarkPlayed) {
        btnMarkPlayed.addEventListener('click', () => {
            if (currentPointedSong) {
                markSongPlayed(currentPointedSong.id);
            }
        });
    }

    // Pool Quick Action Buttons
    if (btnSelectAll) {
        btnSelectAll.addEventListener('click', () => {
            everybodySongs.forEach(s => checkedSongIds.add(s.id));
            recomputeActiveSongs();
            renderPoolList();
            drawWheel();
        });
    }

    if (btnUnselectAll) {
        btnUnselectAll.addEventListener('click', () => {
            checkedSongIds.clear();
            recomputeActiveSongs();
            renderPoolList();
            drawWheel();
        });
    }

    if (btnResetPlayed) {
        btnResetPlayed.addEventListener('click', () => {
            playedSongIds.clear();
            checkedSongIds = new Set(everybodySongs.map(s => s.id));
            recomputeActiveSongs();
            renderPoolList();
            drawWheel();
        });
    }

    if (poolSearchInput) {
        poolSearchInput.addEventListener('input', () => {
            renderPoolList();
        });
    }

    // Winner Modal Actions
    if (btnWinnerPlayNow) {
        btnWinnerPlayNow.addEventListener('click', () => {
            if (currentPointedSong) {
                playSongAudio(currentPointedSong);
                if (window.gameBus) {
                    window.gameBus.send('SELECT_SONG', { songId: currentPointedSong.id, song: currentPointedSong, playNow: true });
                }
            }
            closeWinnerModal();
        });
    }

    if (btnWinnerReadyStage) {
        btnWinnerReadyStage.addEventListener('click', () => {
            if (currentPointedSong && window.gameBus) {
                window.gameBus.send('SELECT_SONG', { songId: currentPointedSong.id, song: currentPointedSong, playNow: false });
                window.gameBus.send('SET_SONG', currentPointedSong);
            }
            closeWinnerModal();
        });
    }

    if (btnWinnerSpinAgain) {
        btnWinnerSpinAgain.addEventListener('click', () => {
            closeWinnerModal();
            setTimeout(spinWheel, 300);
        });
    }

    if (btnWinnerClose) {
        btnWinnerClose.addEventListener('click', closeWinnerModal);
    }

    // Audio Engine Listeners for Seek & Time
    if (window.gameAudio) {
        window.gameAudio.onTimeUpdate = (currentTime, duration) => {
            if (audioTimeDisplay) {
                audioTimeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
            }
            if (audioProgressFill && duration > 0) {
                audioProgressFill.style.width = `${(currentTime / duration) * 100}%`;
            }
        };

        window.gameAudio.onPlayStateChange = (playing) => {
            isLocalAudioPlaying = playing;
            if (btnPlayPointed) {
                if (playing) {
                    btnPlayPointed.innerHTML = '<i class="fa-solid fa-volume-high"></i> PLAYING';
                    btnPlayPointed.className = 'btn btn-sm btn-yellow';
                } else {
                    btnPlayPointed.innerHTML = '<i class="fa-solid fa-play"></i> PLAY AUDIO';
                    btnPlayPointed.className = 'btn btn-sm btn-primary';
                }
            }
        };
    }

    // Click on progress bar to seek
    if (audioProgressBar) {
        audioProgressBar.addEventListener('click', (e) => {
            if (!window.gameAudio || !window.gameAudio.player || !window.gameAudio.player.duration) return;
            const rect = audioProgressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            const targetSec = pct * window.gameAudio.player.duration;
            window.gameAudio.seek(targetSec);
        });
    }

    // Helper: HTML escape
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Bus Listeners
    if (window.gameBus) {
        window.gameBus.on('ROULETTE_TRIGGER_SPIN', () => {
            spinWheel();
        });
    }

    // Kickoff
    fetchSongs();
});
