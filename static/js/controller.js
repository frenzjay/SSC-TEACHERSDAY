document.addEventListener('DOMContentLoaded', () => {
    let songs = [];
    let currentSong = null;
    let isRevealed = false;
    let isPlaying = false;
    let activeFilterMode = 'all';
    let searchTerm = '';
    let openTimingEditorSongId = null;
    let activeBlankIndex = 0;
    let audioOutputMode = 'controller';
    let isStageConnected = false;
    let isSmartAutoPlayRunning = false;
    let timerDuration = 10;
    let timerRemaining = 10;
    let timerInterval = null;
    let isTimerRunning = false;
    let isAnswered = false;
    let hasCutForBlank = false;

    let facultyTeams = [
        { id: 'sci', name: 'Science Dept', score: 0 },
        { id: 'math', name: 'Math Dept', score: 0 },
        { id: 'eng', name: 'English Dept', score: 0 },
        { id: 'fil', name: 'Filipino Dept', score: 0 },
        { id: 'mapeh', name: 'MAPEH Dept', score: 0 },
        { id: 'admin', name: 'Admin / Staff', score: 0 }
    ];

    const songListScroll = document.getElementById('song-list-scroll');
    const searchInput = document.getElementById('search-song-input');
    const modeTabs = document.querySelectorAll('.filter-tab-mode');
    const audioUploadInput = document.getElementById('audio-upload-input');
    const songCardFileInput = document.getElementById('song-card-file-input');
    const uploadStatus = document.getElementById('upload-status-badge');
    const btnOpenAddSong = document.getElementById('btn-open-add-song');
    const addSongModal = document.getElementById('add-song-modal');
    const btnCloseAddSong = document.getElementById('btn-close-add-song');
    const addSongForm = document.getElementById('add-song-form');
    let targetUploadSongId = null;
    let isPausedAtBlank = false;
    let waitingForNextBlank = false;

    const blankEditorModal = document.getElementById('blank-editor-modal');
    const btnCloseBlankEditor = document.getElementById('btn-close-blank-editor');
    const btnCancelBlankEditor = document.getElementById('btn-cancel-blank-editor');
    const btnSaveBlankEditor = document.getElementById('btn-save-blank-editor');
    const btnEditorAddBlank = document.getElementById('btn-editor-add-blank');
    const btnEditorPlaySong = document.getElementById('btn-editor-play-song');
    const btnEditorPauseSong = document.getElementById('btn-editor-pause-song');
    const btnEditorQuickPause = document.getElementById('btn-editor-quick-pause');
    const btnEditorCaptureLyrics = document.getElementById('btn-editor-capture-lyrics');
    const btnEditorCaptureCut = document.getElementById('btn-editor-capture-cut');
    const btnEditorCaptureNext = document.getElementById('btn-editor-capture-next');
    const btnEditorAiTranscribe = document.getElementById('btn-editor-ai-transcribe');
    const editorAiStatus = document.getElementById('editor-ai-status');
    const editorBlanksList = document.getElementById('editor-blanks-list');
    const editorTotalBlanksCount = document.getElementById('editor-total-blanks-count');
    const editorSongStartTime = document.getElementById('editor-song-start-time');
    const btnGrabSongStart = document.getElementById('btn-grab-song-start');
    const editorSaveStatus = document.getElementById('editor-save-status');
    const editorSongSubtitle = document.getElementById('editor-song-subtitle');
    const btnOpenBlankEditor = document.getElementById('btn-open-blank-editor');
    let editingSong = null;
    let editingBlanks = [];
    let editorCaptureIndex = 0;

    const activeTitle = document.getElementById('prompter-song-title');
    const activeArtist = document.getElementById('prompter-song-artist');
    const activeBadgeMode = document.getElementById('prompter-badge-mode');
    const lyricsPrecedingEl = document.getElementById('prompter-lyrics-preceding');
    const maskedSegmentEl = document.getElementById('prompter-masked-segment');
    const answerKeyEl = document.getElementById('prompter-answer-key-text');
    const triviaEl = document.getElementById('prompter-trivia-text');
    const prompterMultiBlankDeck = document.getElementById('prompter-multiblank-deck');
    const prompterMultiBlankList = document.getElementById('prompter-multiblank-list');
    const multiblankCurrentCount = document.getElementById('multiblank-current-count');
    const btnPrevBlank = document.getElementById('btn-prev-blank');
    const btnNextBlank = document.getElementById('btn-next-blank');
    const btnMarkBlankCut = document.getElementById('btn-mark-blank-cut');
    const btnSmartAutoplay = document.getElementById('btn-smart-autoplay');
    const btnPlayAudio = document.getElementById('btn-play-audio');
    const btnPlaySection = document.getElementById('btn-play-section');
    const playSectionBadge = document.getElementById('play-section-badge');
    const checkAlwaysStartSection = document.getElementById('check-always-start-section');
    const btnReplaySection = document.getElementById('btn-replay-section');
    const btnEmergencyCut = document.getElementById('btn-emergency-cut');
    const audioProgressBar = document.getElementById('audio-progress-bar');
    const audioProgressFill = document.getElementById('audio-progress-fill');
    const audioProgressMarkers = document.getElementById('audio-progress-markers');
    const audioTimeDisplay = document.getElementById('audio-time-display');
    const audioOutputModeBtn = document.getElementById('audio-output-mode');
    const monitorSoundToggle = document.getElementById('monitor-sound-toggle');
    const inputStartTime = document.getElementById('input-start-time');
    const inputHulaReplayTime = document.getElementById('input-hula-replay-time');
    const inputBlankTime = document.getElementById('input-blank-time');
    const btnCaptureStart = document.getElementById('btn-capture-start');
    const btnCaptureHulaReplay = document.getElementById('btn-capture-hula-replay');
    const btnCaptureBlank = document.getElementById('btn-capture-blank');
    const btnSaveTimestamps = document.getElementById('btn-save-timestamps');
    const checkAutoPauseBlank = document.getElementById('check-auto-pause-blank');
    const timestampSavedIndicator = document.getElementById('timestamp-saved-indicator');
    const addStartTimeInput = document.getElementById('add-start-time');
    const addBlankTimeInput = document.getElementById('add-blank-time');

    const btnReveal = document.getElementById('btn-reveal-answer');
    const btnCorrect = document.getElementById('btn-trigger-correct');
    const btnWrong = document.getElementById('btn-trigger-wrong');
    const btnTension = document.getElementById('btn-trigger-tension');
    const timerDisplay = document.getElementById('controller-timer-digits');
    const btnTimerToggle = document.getElementById('btn-timer-toggle');
    const btnTimerReset = document.getElementById('btn-timer-reset');
    const btnTimerAdd5 = document.getElementById('btn-timer-add5');
    const btnTimerSub5 = document.getElementById('btn-timer-sub5');
    const timerPresetBtns = document.querySelectorAll('.btn-timer-preset');
    const teamsListContainer = document.getElementById('controller-teams-list');
    const newTeamNameInput = document.getElementById('new-team-name-input');
    const btnAddTeam = document.getElementById('btn-add-team');
    const btnResetScores = document.getElementById('btn-reset-scores');

    function updateAudioOutputMode(mode) {
        audioOutputMode = mode;
        localStorage.setItem('ssc_audio_output_mode', mode);
        if (mode === 'controller') {
            window.gameAudio.setMuted(false);
            if (window.gameAudio.player) {
                window.gameAudio.player.muted = false;
                window.gameAudio.player.volume = window.gameAudio.masterVolume || 1.0;
            }
            window.gameBus.send('SET_AUDIO_OUTPUT_MODE', { mode: 'controller' });
            if (audioOutputModeBtn) {
                audioOutputModeBtn.innerHTML = 'SOUND: ACTIVE (MASTER)';
                audioOutputModeBtn.style.background = 'var(--accent-green)';
                audioOutputModeBtn.style.color = '#FFF';
            }
        } else if (mode === 'stage') {
            window.gameAudio.setMuted(true);
            window.gameBus.send('SET_AUDIO_OUTPUT_MODE', { mode: 'stage' });
            if (audioOutputModeBtn) {
                audioOutputModeBtn.innerHTML = 'SOUND: STAGE MASTER (MUTED HERE)';
                audioOutputModeBtn.style.background = 'var(--surface-subtle)';
                audioOutputModeBtn.style.color = '#333';
            }
        } else {
            window.gameAudio.setMuted(false);
            if (window.gameAudio.player) {
                window.gameAudio.player.muted = false;
                window.gameAudio.player.volume = window.gameAudio.masterVolume || 1.0;
            }
            window.gameBus.send('SET_AUDIO_OUTPUT_MODE', { mode: 'both' });
            if (audioOutputModeBtn) {
                audioOutputModeBtn.innerHTML = 'SOUND: DUAL (BOTH)';
                audioOutputModeBtn.style.background = 'var(--accent-yellow)';
                audioOutputModeBtn.style.color = '#000';
            }
        }
    }

    if (audioOutputModeBtn) {
        audioOutputModeBtn.addEventListener('click', () => {
            if (audioOutputMode === 'controller') {
                updateAudioOutputMode('stage');
            } else if (audioOutputMode === 'stage') {
                updateAudioOutputMode('both');
            } else {
                updateAudioOutputMode('controller');
            }
        });
    }

    const savedAudioMode = localStorage.getItem('ssc_audio_output_mode') || 'controller';
    updateAudioOutputMode(savedAudioMode);

    fetchSongs();
    renderTeams();
    updateTimerDisplay();

    window.gameBus.on('SYNC_REQUEST', () => {
        broadcastSyncState();
        window.gameBus.send('SET_AUDIO_OUTPUT_MODE', { mode: audioOutputMode });
    });

    window.gameBus.on('STAGE_READY', () => {
        isStageConnected = true;
        broadcastSyncState();
        window.gameBus.send('SET_AUDIO_OUTPUT_MODE', { mode: audioOutputMode });
    });

    window.gameBus.on('SELECT_SONG', (payload) => {
        if (!payload) return;
        const songId = typeof payload === 'string' ? payload : (payload.songId || (payload.song && payload.song.id));
        if (!songId || !songs || songs.length === 0) return;
        const target = songs.find(s => s.id === songId);
        if (target) {
            selectSong(target);
            if (payload.playNow) {
                setTimeout(() => {
                    const startSec = (target.mode === 'everybody_sing')
                        ? (target.blanks && target.blanks[0] ? target.blanks[0].lyrics_time || target.start_time || 0 : target.start_time || 0)
                        : (target.start_time || 0);
                    window.gameAudio.seek(startSec);
                    window.gameAudio.playTrack(startSec, false);
                    window.gameBus.send('PLAY_AUDIO', { fromTime: startSec });
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                }, 120);
            }
        }
    });

    window.gameBus.send('PING_STAGE');

    function broadcastSyncState() {
        window.gameBus.send('SYNC_STATE', {
            currentSong,
            isRevealed,
            activeBlankIndex,
            timer: {
                remaining: timerRemaining,
                duration: timerDuration,
                isRunning: isTimerRunning
            },
            teams: facultyTeams
        });
    }

    async function fetchSongs() {
        try {
            const res = await fetch('/api/songs');
            songs = await res.json();
            renderSongList();
            if (songs.length > 0 && !currentSong) {
                selectSong(songs[0]);
            }
        } catch (err) {
            console.error('Failed to load songs:', err);
        }
    }

    function renderSongList() {
        songListScroll.innerHTML = '';
        const filtered = songs.filter(song => {
            const matchesMode = (activeFilterMode === 'all') || (song.mode === activeFilterMode);
            const query = searchTerm.toLowerCase();
            const matchesSearch = !query || 
                song.title.toLowerCase().includes(query) ||
                song.artist.toLowerCase().includes(query) ||
                (song.prompt_lyrics && song.prompt_lyrics.toLowerCase().includes(query)) ||
                (song.answer && song.answer.toLowerCase().includes(query));

            return matchesMode && matchesSearch;
        });

        if (filtered.length === 0) {
            songListScroll.innerHTML = `<div style="font-size:0.6rem; color:#888; padding:20px; text-align:center;">NO SONGS FOUND</div>`;
            return;
        }

        filtered.forEach(song => {
            const item = document.createElement('div');
            item.className = `song-card-item ${currentSong && currentSong.id === song.id ? 'selected' : ''}`;
            const isEverybodySing = (song.mode === 'everybody_sing');
            const isComplete = (song.mode === 'complete');
            const hasAudio = !!song.audio_url;
            const hasTiming = (song.start_time > 0 || song.blank_time > 0 || (isEverybodySing && song.blanks && song.blanks.length > 0));

            let modeBadgeHtml = '';
            if (isEverybodySing) {
                modeBadgeHtml = `<span class="badge badge-purple" style="font-size:0.45rem;"><i class="fa-solid fa-users"></i> SING! (${(song.blanks || []).length} BLANKS)</span>`;
            } else if (isComplete) {
                modeBadgeHtml = `<span class="badge badge-yellow">COMPLETE</span>`;
            } else {
                modeBadgeHtml = `<span class="badge badge-blue">HULA-SING</span>`;
            }

            let timingBadgeText = '';
            if (isEverybodySing) {
                const blankCount = (song.blanks || []).length;
                timingBadgeText = `START: ${formatTime(song.start_time || 0, true)} ➔ ${blankCount} BLANKS`;
            } else {
                timingBadgeText = `START: ${formatTime(song.start_time || 0, true)} ➔ BLANK: ${formatTime(song.blank_time || 0, true)}`;
            }

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
                    <div class="song-item-title">${escapeHtml(song.title)}</div>
                    <span class="badge ${hasAudio ? 'badge-green' : 'badge-red'}" style="font-size:0.45rem; white-space:nowrap;">
                        ${hasAudio ? '<i class="fa-solid fa-file-audio"></i> MP3 READY' : 'NO MP3'}
                    </span>
                </div>
                <div class="song-item-artist">${escapeHtml(song.artist)}</div>
                <div class="song-item-meta" style="flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                    ${modeBadgeHtml}
                    <span class="card-timing-badge ${hasTiming ? '' : 'not-set'}" title="Hardcoded start and blank pause timestamps">
                        ${timingBadgeText}
                    </span>
                </div>
                <div class="song-card-actions">
                    <button type="button" class="btn btn-card-action btn-play-card-section" data-id="${song.id}" title="Play directly at section start time (${formatTime(song.start_time || 0, true)})">
                        <i class="fa-solid fa-play"></i> PLAY SECTION
                    </button>
                    <button type="button" class="btn btn-card-action btn-upload-song-card" data-id="${song.id}" title="Upload or change audio file for this specific song">
                        <i class="fa-solid fa-cloud-arrow-up"></i> ATTACH MP3
                    </button>
                    ${isEverybodySing ? `
                    <button type="button" class="btn btn-card-action btn-edit-song-blanks" data-id="${song.id}" style="background: var(--surface-subtle); font-weight: bold;" title="Edit how many blanks and lyrics timestamps">
                        <i class="fa-solid fa-sliders"></i> EDIT BLANKS (${(song.blanks || []).length})
                    </button>
                    ` : `
                    <button type="button" class="btn btn-card-action btn-toggle-timing-editor" data-id="${song.id}" title="Edit hardcoded start and pause timestamps">
                        <i class="fa-solid fa-stopwatch"></i> SET TIMES
                    </button>
                    `}
                    <button type="button" class="btn btn-card-action btn-card-load" data-id="${song.id}" title="Load to active prompter">
                        LOAD
                    </button>
                </div>

                <div class="inline-timing-editor ${openTimingEditorSongId === song.id ? '' : 'hidden'}" id="timing-editor-${song.id}">
                    <div style="font-size:0.5rem; font-weight:bold; color:var(--brand-blue); display:flex; justify-content:space-between; align-items:center;">
                        <span><i class="fa-solid fa-sliders"></i> HARDCODE TIMESTAMPS:</span>
                        <span class="save-status-text" style="color:var(--accent-green); display:none; font-weight:bold;">SAVED!</span>
                    </div>
                    <div class="inline-timing-grid">
                        <div>
                            <label>${isEverybodySing ? 'START PLAYING AT' : 'PLAY AFTER CORRECT / REVEAL FROM'} (MM:SS.mmm):</label>
                            <input type="text" class="card-input-start" value="${formatTime(song.start_time || 0, true)}" placeholder="00:00.000">
                        </div>
                        ${!isEverybodySing ? `
                        <div>
                            <label>HULA ANSWER REPLAY POINT (MM:SS.mmm):</label>
                            <input type="text" class="card-input-hula-replay" value="${formatTime(song.hula_replay_time ?? song.start_time ?? 0, true)}" placeholder="00:00.000">
                        </div>
                        ` : ''}
                        <div>
                            <label>${isEverybodySing ? 'PAUSE AT BLANK' : 'HULA REPLAY END'} (MM:SS.mmm):</label>
                            <input type="text" class="card-input-blank" value="${formatTime(song.blank_time || 0, true)}" placeholder="00:00.000">
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:4px; margin-top:4px;">
                        <button type="button" class="btn btn-sm btn-action btn-save-card-timing" data-id="${song.id}" style="font-size:0.48rem; padding:3px 8px;">
                            <i class="fa-solid fa-floppy-disk"></i> SAVE
                        </button>
                    </div>
                </div>
            `;

            item.addEventListener('click', () => {
                selectSong(song);
            });

            const playSectionBtn = item.querySelector('.btn-play-card-section');
            if (playSectionBtn) {
                playSectionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playFromCertainPart(song);
                });
            }

            const uploadBtn = item.querySelector('.btn-upload-song-card');
            if (uploadBtn) {
                uploadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    targetUploadSongId = song.id;
                    if (songCardFileInput) {
                        songCardFileInput.value = '';
                        songCardFileInput.click();
                    }
                });
            }

            const editBlanksBtn = item.querySelector('.btn-edit-song-blanks');
            if (editBlanksBtn) {
                editBlanksBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openBlankEditor(song);
                });
            }

            const toggleTimingBtn = item.querySelector('.btn-toggle-timing-editor');
            const timingEditor = item.querySelector(`#timing-editor-${song.id}`);
            if (toggleTimingBtn && timingEditor) {
                toggleTimingBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isNowHidden = timingEditor.classList.toggle('hidden');
                    openTimingEditorSongId = isNowHidden ? null : song.id;
                });
            }

            if (timingEditor) {
                timingEditor.addEventListener('click', (e) => e.stopPropagation());
                timingEditor.addEventListener('mousedown', (e) => e.stopPropagation());
                const startInput = timingEditor.querySelector('.card-input-start');
                const hulaReplayInput = timingEditor.querySelector('.card-input-hula-replay');
                const blankInput = timingEditor.querySelector('.card-input-blank');
                if (startInput) {
                    startInput.addEventListener('click', (e) => e.stopPropagation());
                    startInput.addEventListener('mousedown', (e) => e.stopPropagation());
                    startInput.addEventListener('focus', (e) => e.stopPropagation());
                }
                if (blankInput) {
                    blankInput.addEventListener('click', (e) => e.stopPropagation());
                    blankInput.addEventListener('mousedown', (e) => e.stopPropagation());
                    blankInput.addEventListener('focus', (e) => e.stopPropagation());
                }
            }

            const saveTimingBtn = item.querySelector('.btn-save-card-timing');
            if (saveTimingBtn && timingEditor) {
                saveTimingBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const startInput = timingEditor.querySelector('.card-input-start');
                    const hulaReplayInput = timingEditor.querySelector('.card-input-hula-replay');
                    const blankInput = timingEditor.querySelector('.card-input-blank');
                    const statusText = timingEditor.querySelector('.save-status-text');
                    const startSec = parseTime(startInput.value);
                    const blankSec = parseTime(blankInput.value);

                    song.start_time = startSec;
                    if (hulaReplayInput) song.hula_replay_time = parseTime(hulaReplayInput.value);
                    song.blank_time = blankSec;

                    startInput.value = formatTime(startSec, true);
                    blankInput.value = formatTime(blankSec, true);

                    try {
                        const res = await fetch('/api/songs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(song)
                        });
                        const data = await res.json();
                        if (data.success) {
                            if (statusText) {
                                statusText.style.display = 'inline';
                                setTimeout(() => { if (statusText) statusText.style.display = 'none'; }, 2000);
                            }
                            const timingBadge = item.querySelector('.card-timing-badge');
                            const hasTiming = (startSec > 0 || blankSec > 0);
                            if (timingBadge) {
                                timingBadge.className = `card-timing-badge ${hasTiming ? '' : 'not-set'}`;
                                timingBadge.textContent = `START: ${formatTime(startSec, true)} ➔ BLANK: ${formatTime(blankSec, true)}`;
                            }
                            const cardPlaySectionBtn = item.querySelector('.btn-play-card-section');
                            if (cardPlaySectionBtn) {
                                cardPlaySectionBtn.title = `Play directly at section start time (${formatTime(startSec, true)})`;
                            }

                            if (currentSong && currentSong.id === song.id) {
                                currentSong.start_time = startSec;
                                if (hulaReplayInput) currentSong.hula_replay_time = song.hula_replay_time;
                                currentSong.blank_time = blankSec;
                                if (inputStartTime) inputStartTime.value = formatTime(startSec, true);
                                if (inputBlankTime) inputBlankTime.value = formatTime(blankSec, true);
                                if (playSectionBadge) playSectionBadge.textContent = formatTime(startSec, true);
                            }
                        }
                    } catch (err) {
                        console.error('Failed to save timing:', err);
                        alert('Error saving timestamp to server');
                    }
                });
            }

            const loadBtn = item.querySelector('.btn-card-load');
            if (loadBtn) {
                loadBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectSong(song);
                });
            }

            songListScroll.appendChild(item);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            renderSongList();
        });
    }

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilterMode = tab.dataset.mode;
            renderSongList();
        });
    });

    if (audioUploadInput) {
        audioUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            uploadStatus.textContent = 'UPLOADING...';
            uploadStatus.className = 'status-badge';
            uploadStatus.style.background = 'var(--brand-blue)';

            const formData = new FormData();
            formData.append('audio', file);

            try {
                const res = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    uploadStatus.textContent = 'UPLOADED!';
                    uploadStatus.style.background = 'var(--accent-green)';
                    if (currentSong) {
                        currentSong.audio_url = data.file_url;
                        window.gameAudio.loadTrack(data.file_url);
                        await fetch('/api/songs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentSong)
                        });
                        window.gameBus.send('SET_SONG', currentSong);
                    }
                } else {
                    uploadStatus.textContent = 'FAILED';
                    uploadStatus.style.background = 'var(--accent-red)';
                }
            } catch (err) {
                console.error(err);
                uploadStatus.textContent = 'ERROR';
                uploadStatus.style.background = 'var(--accent-red)';
            }
        });
    }

    if (songCardFileInput) {
        songCardFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file || !targetUploadSongId) return;

            uploadStatus.textContent = 'UPLOADING TO SONG...';
            uploadStatus.className = 'status-badge';
            uploadStatus.style.background = 'var(--brand-blue)';

            const formData = new FormData();
            formData.append('audio', file);
            formData.append('song_id', targetUploadSongId);

            try {
                const res = await fetch('/api/upload-audio', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    uploadStatus.textContent = 'AUDIO ATTACHED!';
                    uploadStatus.style.background = 'var(--accent-green)';

                    const targetSong = songs.find(s => s.id === targetUploadSongId);
                    if (targetSong) {
                        targetSong.audio_url = data.file_url;
                    }
                    renderSongList();

                    if (currentSong && currentSong.id === targetUploadSongId) {
                        currentSong.audio_url = data.file_url;
                        window.gameAudio.loadTrack(data.file_url, currentSong.start_time || 0);
                        window.gameBus.send('SET_SONG', currentSong);
                    }
                } else {
                    uploadStatus.textContent = 'ATTACH FAILED';
                    uploadStatus.style.background = 'var(--accent-red)';
                }
            } catch (err) {
                console.error('Failed to attach audio:', err);
                uploadStatus.textContent = 'ATTACH ERROR';
                uploadStatus.style.background = 'var(--accent-red)';
            }
        });
    }

    if (btnOpenAddSong && addSongModal && btnCloseAddSong) {
        btnOpenAddSong.addEventListener('click', () => addSongModal.classList.remove('hidden'));
        btnCloseAddSong.addEventListener('click', () => addSongModal.classList.add('hidden'));

        addSongForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const modeVal = document.getElementById('add-mode').value;
            const promptVal = document.getElementById('add-prompt').value;
            const blankVal = document.getElementById('add-blank').value;
            const followingVal = document.getElementById('add-following').value;
            const answerVal = document.getElementById('add-answer').value || blankVal || document.getElementById('add-title').value;
            const startVal = addStartTimeInput ? parseTime(addStartTimeInput.value) : 0;
            const blankValTime = addBlankTimeInput ? parseTime(addBlankTimeInput.value) : 0;

            const newSongPayload = {
                title: document.getElementById('add-title').value,
                artist: document.getElementById('add-artist').value,
                era: '',
                mode: modeVal,
                prompt_lyrics: promptVal,
                blank_lyrics: blankVal,
                following_lyrics: followingVal,
                answer: answerVal,
                trivia: document.getElementById('add-trivia').value,
                start_time: startVal,
                blank_time: blankValTime
            };

            if (modeVal === 'everybody_sing') {
                newSongPayload.blanks = [
                    {
                        index: 0,
                        pause_time: blankValTime,
                        prompt_lyrics: promptVal,
                        blank_lyrics: blankVal,
                        following_lyrics: followingVal,
                        answer: answerVal
                    }
                ];
            }

            try {
                const res = await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSongPayload)
                });
                const result = await res.json();
                if (result.success) {
                    addSongForm.reset();
                    addSongModal.classList.add('hidden');
                    await fetchSongs();
                    selectSong(result.song);
                }
            } catch (err) {
                alert('Failed to add song');
            }
        });
    }

    function selectSong(song) {
        currentSong = song;
        isRevealed = false;
        isAnswered = false;
        isPausedAtBlank = false;
        hasCutForBlank = false;
        isPlaying = false;

        resetTimer(timerDuration);

        document.querySelectorAll('.song-card-item').forEach(el => el.classList.remove('selected'));
        renderSongList();

        activeTitle.textContent = song.title;
        activeArtist.textContent = song.artist;
        const isComplete = (song.mode === 'complete');
        activeBadgeMode.textContent = isComplete ? 'SING IN THE BLANK' : 'HULA-SING';
        activeBadgeMode.className = `badge ${isComplete ? 'badge-yellow' : 'badge-blue'}`;
        activeBlankIndex = 0;
        isSmartAutoPlayRunning = false;

        if (song.mode === 'everybody_sing') {
            activeBadgeMode.textContent = 'EVERYBODY, SING!';
            activeBadgeMode.className = 'badge badge-purple';
            if (prompterMultiBlankDeck) prompterMultiBlankDeck.style.display = 'block';
            if (btnSmartAutoplay) {
                btnSmartAutoplay.style.display = 'block';
                btnSmartAutoplay.classList.remove('running');
                btnSmartAutoplay.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> START SMART FULL-SONG AUTO-PLAY';
            }
            updatePrompterForMultiBlank();
        } else if (isComplete) {
            activeBadgeMode.textContent = 'SING IN THE BLANK';
            activeBadgeMode.className = 'badge badge-yellow';
            if (prompterMultiBlankDeck) prompterMultiBlankDeck.style.display = 'none';
            if (btnSmartAutoplay) btnSmartAutoplay.style.display = 'none';
            lyricsPrecedingEl.innerHTML = formatLyrics(song.prompt_lyrics || 'No prompt lyrics');
            maskedSegmentEl.style.display = 'inline-block';
            maskedSegmentEl.innerHTML = `[ ${formatWordBlanksHtml(song.blank_lyrics || '_____')} ]`;
            answerKeyEl.textContent = `ANSWER: ${song.blank_lyrics || song.answer}`;
        } else {
            activeBadgeMode.textContent = 'HULA-SING';
            activeBadgeMode.className = 'badge badge-blue';
            if (prompterMultiBlankDeck) prompterMultiBlankDeck.style.display = 'none';
            if (btnSmartAutoplay) btnSmartAutoplay.style.display = 'none';
            lyricsPrecedingEl.innerHTML = formatLyrics(song.prompt_lyrics || '♫ INTRO / CHORUS RECOGNITION ♫');
            maskedSegmentEl.style.display = 'none';
            answerKeyEl.textContent = `ANSWER: ${song.title} - ${song.artist}`;
        }

        triviaEl.textContent = song.trivia ? `NOTE: ${song.trivia}` : '';

        if (inputStartTime) inputStartTime.value = formatTime(song.start_time || 0, true);
        if (inputHulaReplayTime) inputHulaReplayTime.value = formatTime(song.hula_replay_time ?? song.start_time ?? 0, true);
        if (inputBlankTime) inputBlankTime.value = formatTime(song.blank_time || 0, true);
        if (playSectionBadge) playSectionBadge.textContent = formatTime(song.start_time || 0, true);

        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY AUDIO';
        btnPlayAudio.style.background = 'var(--brand-blue)';
        btnPlayAudio.style.color = '#FFF';
        audioProgressFill.style.width = '0%';
        audioTimeDisplay.textContent = '00:00 / 00:00';

        if (song.audio_url) {
            window.gameAudio.loadTrack(song.audio_url, song.start_time || 0);
        }

        renderTimelineBlankMarkers();

        window.gameBus.send('SET_SONG', song);
    }

    function updatePrompterForMultiBlank() {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        const blanks = currentSong.blanks || [];
        const currentBlank = blanks[activeBlankIndex] || blanks[0] || {};

        if (multiblankCurrentCount) {
            multiblankCurrentCount.textContent = `${activeBlankIndex + 1} / ${blanks.length}`;
        }

        lyricsPrecedingEl.innerHTML = formatLyrics(currentBlank.prompt_lyrics || 'No prompt lyrics');
        
        if (currentBlank.is_lyrics_only) {
            maskedSegmentEl.style.display = 'none';
            answerKeyEl.innerHTML = `<i class="fa-solid fa-info-circle"></i> LYRICS ONLY (No answer required) (Blank ${activeBlankIndex + 1}/${blanks.length})`;
        } else {
            maskedSegmentEl.style.display = 'inline-block';
            if (currentBlank.answered) {
                maskedSegmentEl.className = 'prompter-masked-segment revealed';
                maskedSegmentEl.innerHTML = `★ ${escapeHtml(currentBlank.blank_lyrics || currentBlank.answer || '')} ★`;
            } else {
                maskedSegmentEl.className = 'prompter-masked-segment';
                maskedSegmentEl.innerHTML = `[ ${formatWordBlanksHtml(currentBlank.blank_lyrics || '_____')} ]`;
            }
            answerKeyEl.innerHTML = `<i class="fa-solid fa-key"></i> ANSWER: <strong>${escapeHtml(currentBlank.blank_lyrics || currentBlank.answer || '')}</strong> (Blank ${activeBlankIndex + 1}/${blanks.length})`;
        }
        triviaEl.textContent = currentBlank.following_lyrics ? `NEXT LINE: ${currentBlank.following_lyrics}` : (currentSong.trivia ? `NOTE: ${currentSong.trivia}` : '');

        if (inputBlankTime) {
            inputBlankTime.value = formatTime(currentBlank.pause_time || 0, true);
        }

        if (prompterMultiBlankList) {
            prompterMultiBlankList.innerHTML = '';
            blanks.forEach((b, idx) => {
                const row = document.createElement('div');
                const isCur = (idx === activeBlankIndex);
                const isDone = b.answered || (idx < activeBlankIndex && b.answered);
                row.className = `prompter-blank-row ${isCur ? 'active' : ''} ${isDone ? 'completed' : ''}`;
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px; flex: 1; overflow: hidden;">
                        <span style="font-family: var(--font-pixel); font-size: 0.55rem; color: var(--brand-blue);">${isDone ? '✓' : '#' + (idx + 1)}</span>
                        <span style="font-family: var(--font-mono); font-size: 0.48rem; color: #555;">[♫ ${formatTime(b.lyrics_time || 0, true)} ➔ ✂ ${formatTime(b.pause_time, true)}]</span>
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: bold;">${escapeHtml(b.blank_lyrics || b.answer)}</span>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <button type="button" class="btn btn-sm btn-play-lyrics-blank" data-idx="${idx}" style="font-size: 0.45rem; padding: 2px 6px; background: var(--brand-blue); color: #FFF; font-weight: bold;" title="Play audio from lyrics start time (${formatTime(b.lyrics_time || 0, true)}) so you can press M to mark cut">
                            <i class="fa-solid fa-play"></i> ♫ Play
                        </button>
                        <button type="button" class="btn btn-sm btn-pause-lyrics-blank" data-idx="${idx}" style="font-size: 0.45rem; padding: 2px 6px; background: var(--accent-red, #ff4444); color: #FFF; font-weight: bold;" title="Pause audio playback">
                            <i class="fa-solid fa-pause"></i> Pause
                        </button>
                        <button type="button" class="btn btn-sm btn-preview-blank" data-idx="${idx}" title="Preview 5 seconds leading right into this blank cut">
                             -5s
                        </button>
                        <button type="button" class="btn btn-sm btn-jump-blank" style="font-size: 0.45rem; padding: 2px 6px;">
                            ${isCur ? 'ACTIVE' : 'JUMP'}
                        </button>
                    </div>
                `;

                const playLyricsRowBtn = row.querySelector('.btn-play-lyrics-blank');
                if (playLyricsRowBtn) {
                    playLyricsRowBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        activeBlankIndex = idx;
                        isPausedAtBlank = false;
                        hasCutForBlank = false;
                        isRevealed = false;
                        isAnswered = false;
                        updatePrompterForMultiBlank();
                        renderTimelineBlankMarkers();
                        window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });

                        const lyricsSec = Number(b.lyrics_time) || 0;
                        isPlaying = true;
                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                        btnPlayAudio.style.background = 'var(--accent-yellow)';
                        btnPlayAudio.style.color = '#000';

                        window.gameAudio.seek(lyricsSec);
                        window.gameAudio.playTrack(lyricsSec, false);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: lyricsSec });
                    });
                }

                const pauseLyricsRowBtn = row.querySelector('.btn-pause-lyrics-blank');
                if (pauseLyricsRowBtn) {
                    pauseLyricsRowBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        pauseAudioPlayback();
                    });
                }

                const previewBtn = row.querySelector('.btn-preview-blank');
                if (previewBtn) {
                    previewBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        activeBlankIndex = idx;
                        isPausedAtBlank = false;
                        hasCutForBlank = false;
                        isRevealed = false;
                        isAnswered = false;
                        updatePrompterForMultiBlank();
                        renderTimelineBlankMarkers();
                        window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });

                        const pauseSec = Number(b.pause_time) || 0;
                        const previewStart = Math.max(0, pauseSec - 5);
                        isPlaying = true;
                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                        btnPlayAudio.style.background = 'var(--accent-yellow)';
                        btnPlayAudio.style.color = '#000';

                        window.gameAudio.seek(previewStart);
                        window.gameAudio.playTrack(previewStart, true);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: previewStart });
                    });
                }

                row.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activeBlankIndex = idx;
                    isPausedAtBlank = false;
                    hasCutForBlank = false;
                    isRevealed = false;
                    isAnswered = false;
                    updatePrompterForMultiBlank();
                    renderTimelineBlankMarkers();
                    window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });
                });
                prompterMultiBlankList.appendChild(row);
            });
        }
    }

    if (btnPrevBlank) {
        btnPrevBlank.addEventListener('click', () => {
            if (!currentSong || currentSong.mode !== 'everybody_sing') return;
            activeBlankIndex = Math.max(0, activeBlankIndex - 1);
            isPausedAtBlank = false;
            hasCutForBlank = false;
            isRevealed = false;
            isAnswered = false;
            waitingForNextBlank = false;
            updatePrompterForMultiBlank();
            renderTimelineBlankMarkers();
            window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });
        });
    }

    if (btnNextBlank) {
        btnNextBlank.addEventListener('click', () => {
            if (!currentSong || currentSong.mode !== 'everybody_sing') return;
            const blanks = currentSong.blanks || [];
            activeBlankIndex = Math.min(blanks.length - 1, activeBlankIndex + 1);
            isPausedAtBlank = false;
            hasCutForBlank = false;
            isRevealed = false;
            isAnswered = false;
            waitingForNextBlank = false;
            updatePrompterForMultiBlank();
            renderTimelineBlankMarkers();
            window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });
        });
    }

    function renderTimelineBlankMarkers() {
        if (!audioProgressMarkers) return;
        audioProgressMarkers.innerHTML = '';
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        const dur = window.gameAudio.player.duration || 0;
        if (dur <= 0) return;

        const blanks = currentSong.blanks || [];
        blanks.forEach((b, idx) => {
            const pauseSec = Number(b.pause_time) || 0;
            if (pauseSec > 0 && pauseSec <= dur) {
                const pct = (pauseSec / dur) * 100;
                const pin = document.createElement('div');
                const isCur = (idx === activeBlankIndex);
                const isDone = b.answered || (idx < activeBlankIndex);
                pin.className = `timeline-marker-pin ${isCur ? 'active' : ''} ${isDone ? 'completed' : ''}`;
                pin.style.left = `${pct}%`;
                pin.setAttribute('data-label', `#${idx + 1}`);
                pin.title = `Blank #${idx + 1} (${formatTime(pauseSec, true)}): "${b.blank_lyrics || b.answer}" - Click to test lead-up`;
                pin.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activeBlankIndex = idx;
                    isPausedAtBlank = false;
                    hasCutForBlank = false;
                    isRevealed = false;
                    isAnswered = false;
                    updatePrompterForMultiBlank();
                    renderTimelineBlankMarkers();
                    window.gameBus.send('SET_ACTIVE_BLANK', { index: activeBlankIndex });

                    const testSeek = Math.max(0, pauseSec - 4);
                    window.gameAudio.seek(testSeek);
                    window.gameAudio.playTrack(testSeek, true);
                    window.gameBus.send('PLAY_AUDIO', { fromTime: testSeek });
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                });
                audioProgressMarkers.appendChild(pin);
            }
        });
    }

    async function markCurrentBlankCut() {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        const blanks = currentSong.blanks || [];
        if (!blanks[activeBlankIndex]) return;

        const curr = window.gameAudio.player.currentTime || 0;
        const stamp = Math.round(curr * 1000) / 1000;
        
        // Only edit this specific blank - do not touch or influence any other blanks
        blanks[activeBlankIndex].pause_time = stamp;
        
        window.gameBus.send('UPDATE_BLANKS', currentSong.blanks);

        if (inputBlankTime) {
            inputBlankTime.value = formatTime(stamp, true);
        }

        try {
            await fetch('/api/songs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentSong)
            });
            if (timestampSavedIndicator) {
                timestampSavedIndicator.textContent = `MARKED #${activeBlankIndex + 1} AT ${formatTime(stamp, true)}!`;
                timestampSavedIndicator.style.display = 'inline';
                setTimeout(() => {
                    if (timestampSavedIndicator) timestampSavedIndicator.style.display = 'none';
                }, 2500);
            }
        } catch (e) {
            console.error('Failed to save stamped timestamp', e);
        }

        updatePrompterForMultiBlank();
        renderTimelineBlankMarkers();
    }

    if (btnMarkBlankCut) {
        btnMarkBlankCut.addEventListener('click', (e) => {
            e.stopPropagation();
            markCurrentBlankCut();
        });
    }


    function openBlankEditor(song) {
        if (!song) return;
        editingSong = song;

        if (editorSongSubtitle) {
            editorSongSubtitle.textContent = `Configure lyrics timestamps & blanks for "${song.title}" (${song.artist})`;
        }
        if (editorSongStartTime) {
            editorSongStartTime.value = formatTime(song.start_time || 0, true);
        }

        if (Array.isArray(song.blanks) && song.blanks.length > 0) {
            editingBlanks = JSON.parse(JSON.stringify(song.blanks));
        } else {
            editingBlanks = [
                {
                    index: 1,
                    lyrics_time: song.start_time || 0,
                    pause_time: song.blank_time || 0,
                    prompt_lyrics: song.prompt_lyrics || '',
                    blank_lyrics: song.blank_lyrics || '',
                    following_lyrics: song.following_lyrics || '',
                    answer: song.answer || song.blank_lyrics || ''
                }
            ];
        }

        renderEditorBlanks();
        editorCaptureIndex = 0;
        if (blankEditorModal) blankEditorModal.classList.remove('hidden');
    }

    function pauseAudioPlayback() {
        isPlaying = false;
        if (window.gameAudio) {
            window.gameAudio.pauseTrack();
        }
        window.gameBus.send('STOP_AUDIO');
        if (btnPlayAudio) {
            btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY AUDIO';
            btnPlayAudio.style.background = 'var(--brand-blue)';
            btnPlayAudio.style.color = '#FFF';
        }
    }

    function highlightEditorCard(targetIdx) {
        if (!editorBlanksList) return;
        Array.from(editorBlanksList.children).forEach((el, i) => {
            if (i === targetIdx) {
                el.style.borderColor = 'var(--brand-blue)';
                el.style.background = '#F0F7FF';
                el.style.boxShadow = '0 0 10px rgba(0, 102, 204, 0.4)';
            } else {
                el.style.borderColor = '#000';
                el.style.background = '#FFF';
                el.style.boxShadow = '2px 2px 0px rgba(0,0,0,0.15)';
            }
        });
    }

    function renderEditorBlanks() {
        if (!editorBlanksList) return;
        editorBlanksList.innerHTML = '';
        if (editorTotalBlanksCount) {
            editorTotalBlanksCount.textContent = editingBlanks.length;
        }

        editingBlanks.forEach((b, idx) => {
            const card = document.createElement('div');
            card.className = 'blank-editor-card';
            const isCur = (idx === editorCaptureIndex);
            card.style.cssText = `background: ${isCur ? '#F0F7FF' : '#FFF'}; border: 2px solid ${isCur ? 'var(--brand-blue)' : '#000'}; padding: 10px; box-shadow: ${isCur ? '0 0 10px rgba(0,102,204,0.4)' : '2px 2px 0px rgba(0,0,0,0.15)'}; transition: all 0.2s ease;`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #DDD; padding-bottom: 4px;">
                    <span style="font-size: 0.65rem; font-weight: bold; color: var(--brand-purple);">
                        BLANK #${idx + 1}
                    </span>
                    <div style="display: flex; gap: 4px;">
                        <button type="button" class="btn btn-sm btn-card-audition" data-idx="${idx}" title="Play audio 5 seconds before this cut">
                            Audition Cut
                        </button>
                        <button type="button" class="btn btn-sm btn-danger btn-card-delete" data-idx="${idx}" ${editingBlanks.length <= 1 ? 'disabled style="opacity:0.4;"' : ''} title="Delete this blank">
                            Remove
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div>
                        <div style="font-size: 0.52rem; font-weight: bold; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <span>LYRICS START TIME (MM:SS.mmm):</span>
                            <div style="display: flex; gap: 3px;">
                                <button type="button" class="btn btn-sm btn-card-play-lyrics" data-idx="${idx}" style="font-size: 0.45rem; padding: 1px 6px; background: var(--brand-blue); color: #FFF; font-weight: bold;" title="Play audio starting from this lyric start time so you can press M to mark cut">
                                    <i class="fa-solid fa-play"></i> Play
                                </button>
                                <button type="button" class="btn btn-sm btn-card-pause-lyrics" data-idx="${idx}" style="font-size: 0.45rem; padding: 1px 6px; background: var(--accent-red, #ff4444); color: #FFF; font-weight: bold;" title="Pause audio playback immediately">
                                    <i class="fa-solid fa-pause"></i> Pause
                                </button>
                                <button type="button" class="btn btn-sm btn-grab-lyrics-time" data-idx="${idx}" style="font-size: 0.45rem; padding: 1px 4px; background: var(--surface-subtle);" title="Set to current audio playback time">
                                    <i class="fa-solid fa-stopwatch"></i> Grab
                                </button>
                            </div>
                        </div>
                        <input type="text" class="input-mono card-lyrics-time" data-idx="${idx}" value="${formatTime(b.lyrics_time || 0, true)}" placeholder="00:00.000" style="width: 100%; font-size: 0.62rem; padding: 4px; border: 1px solid #000;">
                    </div>
                    <div>
                        <div style="font-size: 0.52rem; font-weight: bold; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                            <span>BLANK CUT TIME (MM:SS.mmm):</span>
                            <div style="display: flex; gap: 3px;">
                                <button type="button" class="btn btn-sm btn-card-mark-cut" data-idx="${idx}" style="font-size: 0.45rem; padding: 1px 6px; background: var(--accent-yellow); color: #000; font-weight: bold;" title="Mark cut time right now [Hotkey: M]">
                                    <i class="fa-solid fa-location-crosshairs"></i> Mark Cut [M]
                                </button>
                                <button type="button" class="btn btn-sm btn-grab-pause-time" data-idx="${idx}" style="font-size: 0.45rem; padding: 1px 4px; background: var(--surface-subtle);" title="Set to current audio playback time">
                                    <i class="fa-solid fa-stopwatch"></i> Grab
                                </button>
                            </div>
                        </div>
                        <input type="text" class="input-mono card-pause-time" data-idx="${idx}" value="${formatTime(b.pause_time || 0, true)}" placeholder="00:00.000" style="width: 100%; font-size: 0.62rem; padding: 4px; border: 1px solid #000;">
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div>
                        <label style="font-size: 0.52rem; font-weight: bold; display: block; margin-bottom: 2px;">PROMPT LYRICS (Sung before cut):</label>
                        <textarea class="card-prompt-lyrics" data-idx="${idx}" rows="2" style="width: 100%; font-size: 0.6rem; padding: 4px; border: 1px solid #000;" placeholder="e.g. Ang isang pag-ibig / Ay parang">${escapeHtml(b.prompt_lyrics || '')}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div>
                            <label style="font-size: 0.52rem; font-weight: bold; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span>MISSING WORD(S) / BLANK ANSWER:</span>
                                <label style="display:flex; align-items:center; gap:4px; font-weight:normal; cursor:pointer;" title="If checked, this will just display the prompt lyrics on screen without a blank to guess.">
                                    <input type="checkbox" class="card-lyrics-only-check" data-idx="${idx}" ${b.is_lyrics_only ? 'checked' : ''}>
                                    <span style="font-size:0.45rem;">Lyrics Only</span>
                                </label>
                            </label>
                            <input type="text" class="card-blank-answer" data-idx="${idx}" value="${escapeHtml(b.blank_lyrics || b.answer || '')}" style="width: 100%; font-size: 0.6rem; font-weight: bold; padding: 4px; border: 1px solid #000; ${b.is_lyrics_only ? 'opacity:0.4;' : ''}" placeholder="e.g. LANSANGAN" ${b.is_lyrics_only ? 'disabled' : ''}>
                        </div>
                        <div>
                            <label style="font-size: 0.52rem; font-weight: bold; display: block; margin-bottom: 2px;">FOLLOWING LYRICS (Optional):</label>
                            <input type="text" class="card-following-lyrics" data-idx="${idx}" value="${escapeHtml(b.following_lyrics || '')}" style="width: 100%; font-size: 0.6rem; padding: 4px; border: 1px solid #000;" placeholder="e.g. Na pandalawahan...">
                        </div>
                    </div>
                </div>
            `;

            const playLyricsBtn = card.querySelector('.btn-card-play-lyrics');
            if (playLyricsBtn) {
                playLyricsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editorCaptureIndex = idx;
                    highlightEditorCard(idx);

                    const lyricsInput = card.querySelector('.card-lyrics-time');
                    const lyricsSec = lyricsInput ? parseTime(lyricsInput.value) : (Number(b.lyrics_time) || 0);

                    document.activeElement?.blur();

                    window.gameAudio.seek(lyricsSec);
                    window.gameAudio.playTrack(lyricsSec, false);
                    window.gameBus.send('PLAY_AUDIO', { fromTime: lyricsSec });
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                });
            }

            const pauseLyricsBtn = card.querySelector('.btn-card-pause-lyrics');
            if (pauseLyricsBtn) {
                pauseLyricsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    pauseAudioPlayback();
                });
            }

            const markCutBtn = card.querySelector('.btn-card-mark-cut');
            if (markCutBtn) {
                markCutBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editorCaptureIndex = idx;
                    highlightEditorCard(idx);
                    const curr = window.gameAudio.player.currentTime || 0;
                    const stamp = Math.round(curr * 1000) / 1000;

                    const pauseInput = card.querySelector('.card-pause-time');
                    if (pauseInput) {
                        pauseInput.value = formatTime(stamp, true);
                        pauseInput.style.transition = 'background 0.3s ease';
                        pauseInput.style.background = 'var(--accent-yellow)';
                        setTimeout(() => { pauseInput.style.background = ''; }, 600);
                    }
                    if (editingBlanks[idx]) {
                        editingBlanks[idx].pause_time = stamp;
                    }
                });
            }

            const cardLyricsInput = card.querySelector('.card-lyrics-time');
            if (cardLyricsInput) {
                cardLyricsInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        playLyricsBtn?.click();
                    }
                });
            }

            card.addEventListener('click', () => {
                editorCaptureIndex = idx;
                highlightEditorCard(idx);
            });

            const auditionBtn = card.querySelector('.btn-card-audition');
            if (auditionBtn) {
                auditionBtn.addEventListener('click', () => {
                    const pauseVal = parseTime(card.querySelector('.card-pause-time').value);
                    const testSeek = Math.max(0, pauseVal - 5);
                    window.gameAudio.seek(testSeek);
                    window.gameAudio.playTrack(testSeek, true);
                    window.gameBus.send('PLAY_AUDIO', { fromTime: testSeek });
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                });
            }

            const lyricsOnlyCheck = card.querySelector('.card-lyrics-only-check');
            const blankAnswerInput = card.querySelector('.card-blank-answer');
            if (lyricsOnlyCheck && blankAnswerInput) {
                lyricsOnlyCheck.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        blankAnswerInput.disabled = true;
                        blankAnswerInput.style.opacity = '0.4';
                    } else {
                        blankAnswerInput.disabled = false;
                        blankAnswerInput.style.opacity = '1';
                    }
                });
            }

            const deleteBtn = card.querySelector('.btn-card-delete');
            if (deleteBtn && editingBlanks.length > 1) {
                deleteBtn.addEventListener('click', () => {
                    syncEditorInputsToState();
                    editingBlanks.splice(idx, 1);
                    renderEditorBlanks();
                });
            }

            const grabLyricsBtn = card.querySelector('.btn-grab-lyrics-time');
            if (grabLyricsBtn) {
                grabLyricsBtn.addEventListener('click', () => {
                    const curr = window.gameAudio.player.currentTime || 0;
                    card.querySelector('.card-lyrics-time').value = formatTime(curr, true);
                });
            }

            const grabPauseBtn = card.querySelector('.btn-grab-pause-time');
            if (grabPauseBtn) {
                grabPauseBtn.addEventListener('click', () => {
                    const curr = window.gameAudio.player.currentTime || 0;
                    card.querySelector('.card-pause-time').value = formatTime(curr, true);
                });
            }

            editorBlanksList.appendChild(card);
        });
    }

    function syncEditorInputsToState() {
        if (!editorBlanksList) return;
        const cards = editorBlanksList.querySelectorAll('.blank-editor-card');
        cards.forEach((card, idx) => {
            if (!editingBlanks[idx]) return;
            const lInput = card.querySelector('.card-lyrics-time');
            const pInput = card.querySelector('.card-pause-time');
            const prInput = card.querySelector('.card-prompt-lyrics');
            const aInput = card.querySelector('.card-blank-answer');
            const fInput = card.querySelector('.card-following-lyrics');
            const lyricsOnlyCheck = card.querySelector('.card-lyrics-only-check');

            editingBlanks[idx].index = idx + 1;
            if (lInput) editingBlanks[idx].lyrics_time = parseTime(lInput.value);
            if (pInput) editingBlanks[idx].pause_time = parseTime(pInput.value);
            if (prInput) editingBlanks[idx].prompt_lyrics = prInput.value.trim();
            if (lyricsOnlyCheck) {
                editingBlanks[idx].is_lyrics_only = lyricsOnlyCheck.checked;
            }
            if (aInput) {
                editingBlanks[idx].blank_lyrics = aInput.value.trim();
                editingBlanks[idx].answer = aInput.value.trim();
            }
            if (fInput) editingBlanks[idx].following_lyrics = fInput.value.trim();
        });
    }

    if (btnGrabSongStart) {
        btnGrabSongStart.addEventListener('click', () => {
            const curr = window.gameAudio.player.currentTime || 0;
            if (editorSongStartTime) editorSongStartTime.value = formatTime(curr, true);
        });
    }

    if (btnCloseBlankEditor) {
        btnCloseBlankEditor.addEventListener('click', () => {
            pauseAudioPlayback();
            if (blankEditorModal) blankEditorModal.classList.add('hidden');
        });
    }

    function editorCurrentTime() {
        return Number(window.gameAudio.player.currentTime) || 0;
    }

    function captureEditorTime(field) {
        if (!editingBlanks.length) return;
        syncEditorInputsToState();
        const blank = editingBlanks[editorCaptureIndex] || editingBlanks[editingBlanks.length - 1];
        if (!blank) return;
        blank[field] = Math.round(editorCurrentTime() * 1000) / 1000;
        renderEditorBlanks();
        const input = editorBlanksList.querySelector(`.card-${field === 'lyrics_time' ? 'lyrics' : 'pause'}-time[data-idx="${editorCaptureIndex}"]`);
        if (input) input.focus();
    }

    function addEditorBlank() {
        syncEditorInputsToState();
        editingBlanks.push({
            index: editingBlanks.length + 1,
            lyrics_time: 0,
            pause_time: 0,
            prompt_lyrics: '',
            blank_lyrics: '',
            following_lyrics: '',
            answer: ''
        });
        editorCaptureIndex = editingBlanks.length - 1;
        renderEditorBlanks();
        const newCard = editorBlanksList.lastElementChild;
        if (newCard) {
            newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const answerInput = newCard.querySelector('.card-blank-answer');
            if (answerInput) answerInput.focus();
        }
    }

    if (btnEditorPlaySong) {
        btnEditorPlaySong.addEventListener('click', () => {
            if (isPlaying && window.gameAudio.player && !window.gameAudio.player.paused) {
                pauseAudioPlayback();
            } else {
                const start = editorSongStartTime ? parseTime(editorSongStartTime.value) : 0;
                window.gameAudio.seek(start);
                window.gameAudio.playTrack(start, false);
                window.gameBus.send('PLAY_AUDIO', { fromTime: start });
                isPlaying = true;
                btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                btnPlayAudio.style.background = 'var(--accent-yellow)';
                btnPlayAudio.style.color = '#000';
            }
        });
    }

    if (btnEditorPauseSong) {
        btnEditorPauseSong.addEventListener('click', () => {
            pauseAudioPlayback();
        });
    }

    if (btnEditorQuickPause) {
        btnEditorQuickPause.addEventListener('click', () => {
            pauseAudioPlayback();
        });
    }

    if (btnEditorCaptureLyrics) {
        btnEditorCaptureLyrics.addEventListener('click', () => captureEditorTime('lyrics_time'));
    }
    if (btnEditorCaptureCut) {
        btnEditorCaptureCut.addEventListener('click', () => captureEditorTime('pause_time'));
    }
    if (btnEditorCaptureNext) {
        btnEditorCaptureNext.addEventListener('click', () => {
            captureEditorTime('pause_time');
            if (editorCaptureIndex >= editingBlanks.length - 1) {
                addEditorBlank();
            } else {
                editorCaptureIndex += 1;
                renderEditorBlanks();
            }
        });
    }
    if (btnEditorAddBlank) {
        btnEditorAddBlank.addEventListener('click', addEditorBlank);
    }

    if (btnEditorAiTranscribe) {
        btnEditorAiTranscribe.addEventListener('click', async () => {
            if (!editingSong || !editingSong.audio_url) return;
            btnEditorAiTranscribe.disabled = true;
            if (editorAiStatus) editorAiStatus.textContent = 'SENDING AUDIO TO FREE WHISPER TRANSCRIPTION...';
            try {
                const response = await fetch(`/api/songs/${encodeURIComponent(editingSong.id)}/transcribe`, { method: 'POST' });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Transcription failed');
                editingBlanks = data.blanks || [];
                editorCaptureIndex = 0;
                renderEditorBlanks();
                if (editorAiStatus) {
                    editorAiStatus.textContent = `${editingBlanks.length} TIMED PROMPT LINES CREATED. ADD THE MISSING WORD(S) MANUALLY, THEN REVIEW BEFORE SAVING.`;
                }
            } catch (error) {
                console.error('[Controller] AI transcription failed', error);
                if (editorAiStatus) editorAiStatus.textContent = error.message;
            } finally {
                btnEditorAiTranscribe.disabled = false;
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!blankEditorModal || blankEditorModal.classList.contains('hidden')) return;
        if (event.target.matches('input, textarea, select')) return;
        const key = event.key.toLowerCase();
        if (key === 'l') {
            event.preventDefault();
            captureEditorTime('lyrics_time');
        } else if (key === 'c' || key === 'm') {
            event.preventDefault();
            const targetCard = editorBlanksList ? editorBlanksList.children[editorCaptureIndex] : null;
            if (targetCard) {
                const markCutBtn = targetCard.querySelector('.btn-card-mark-cut');
                if (markCutBtn) {
                    markCutBtn.click();
                    return;
                }
            }
            captureEditorTime('pause_time');
        } else if (key === 'n') {
            event.preventDefault();
            btnEditorCaptureNext?.click();
        } else if (event.code === 'Space') {
            event.preventDefault();
            if (isPlaying && window.gameAudio.player && !window.gameAudio.player.paused) {
                pauseAudioPlayback();
            } else if (window.gameAudio.player) {
                window.gameAudio.player.play();
                isPlaying = true;
                btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                btnPlayAudio.style.background = 'var(--accent-yellow)';
                btnPlayAudio.style.color = '#000';
            }
        }
    });

    if (btnCancelBlankEditor) {
        btnCancelBlankEditor.addEventListener('click', () => {
            pauseAudioPlayback();
            if (blankEditorModal) blankEditorModal.classList.add('hidden');
        });
    }

    if (btnSaveBlankEditor) {
        btnSaveBlankEditor.addEventListener('click', async () => {
            if (!editingSong) return;
            syncEditorInputsToState();

            const startSec = editorSongStartTime ? parseTime(editorSongStartTime.value) : 0;
            editingSong.start_time = startSec;
            editingSong.mode = 'everybody_sing';
            editingSong.blanks = editingBlanks;

            try {
                const res = await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingSong)
                });
                const data = await res.json();
                if (data.success) {
                    if (editorSaveStatus) {
                        editorSaveStatus.style.display = 'inline';
                        setTimeout(() => {
                            if (editorSaveStatus) editorSaveStatus.style.display = 'none';
                        }, 2500);
                    }

                    await fetchSongs();

                    if (currentSong && currentSong.id === editingSong.id) {
                        selectSong(data.song || editingSong);
                    }

                    setTimeout(() => {
                        if (blankEditorModal) blankEditorModal.classList.add('hidden');
                    }, 500);
                } else {
                    alert('Failed to save blanks: ' + (data.error || 'Server error'));
                }
            } catch (err) {
                console.error('Error saving blanks:', err);
                alert('Error saving blanks to server.');
            }
        });
    }

    if (btnOpenBlankEditor) {
        btnOpenBlankEditor.addEventListener('click', () => {
            if (currentSong) {
                openBlankEditor(currentSong);
            } else {
                alert('Please select a song from the library first!');
            }
        });
    }

    function startSmartAutoPlay() {
        if (!currentSong || currentSong.mode !== 'everybody_sing') return;
        if (!currentSong.audio_url) {
            alert('No audio file attached to this song yet!\nClick "ATTACH MP3" on this song in the list to upload audio.');
            return;
        }

        isSmartAutoPlayRunning = true;
        activeBlankIndex = 0;
        isPausedAtBlank = false;
        hasCutForBlank = false;
        isRevealed = false;
        isAnswered = false;

        if (btnSmartAutoplay) {
            btnSmartAutoplay.classList.add('running');
            btnSmartAutoplay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> SMART AUTO-PLAY RUNNING';
        }

        updatePrompterForMultiBlank();
        renderTimelineBlankMarkers();
        window.gameBus.send('SET_ACTIVE_BLANK', { index: 0 });

        const startSec = (inputStartTime ? parseTime(inputStartTime.value) : 0) || Number(currentSong.start_time) || 0;
        isPlaying = true;
        btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
        btnPlayAudio.style.background = 'var(--accent-yellow)';
        btnPlayAudio.style.color = '#000';

        window.gameAudio.playTrack(startSec, currentSong.mode !== 'everybody_sing');
        window.gameBus.send('PLAY_AUDIO', { fromTime: startSec });
    }

    if (btnSmartAutoplay) {
        btnSmartAutoplay.addEventListener('click', () => {
            if (isSmartAutoPlayRunning && isPlaying) {
                togglePlay();
            } else {
                startSmartAutoPlay();
            }
        });
    }

    function playFromCertainPart(song = currentSong) {
        if (!song) return;
        if (!currentSong || currentSong.id !== song.id) {
            selectSong(song);
        }
        if (!song.audio_url) {
            alert('No audio file attached to this song yet!\nClick "ATTACH MP3" on this song in the list to upload audio.');
            return;
        }

        const startSec = (inputStartTime ? parseTime(inputStartTime.value) : 0) || Number(song.start_time) || 0;
        
        isPlaying = true;
        isPausedAtBlank = false;
        isAnswered = false;
        isRevealed = false;
        hasCutForBlank = false;

        btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
        btnPlayAudio.style.background = 'var(--accent-yellow)';
        btnPlayAudio.style.color = '#000';
        window.gameAudio.playTrack(startSec, song.mode !== 'everybody_sing');
        window.gameBus.send('PLAY_AUDIO', { fromTime: startSec });
    }

    function togglePlay() {
        if (!currentSong) return;
        if (!currentSong.audio_url) {
            alert('No audio file attached to this song yet!\nClick "ATTACH MP3" on this song in the list to upload audio.');
            return;
        }

        isPlaying = !isPlaying;

        if (isPlaying) {
            btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
            btnPlayAudio.style.background = 'var(--accent-yellow)';
            btnPlayAudio.style.color = '#000';

            const startSec = (inputStartTime ? parseTime(inputStartTime.value) : 0) || Number(currentSong.start_time) || 0;
            const blankSec = (inputBlankTime ? parseTime(inputBlankTime.value) : 0) || Number(currentSong.blank_time) || 0;
            const curr = window.gameAudio.player.currentTime;

            let playFrom = null;
            if (isPausedAtBlank) {
                isPausedAtBlank = false;
                playFrom = null;
            } else if (checkAlwaysStartSection && checkAlwaysStartSection.checked && (curr < startSec - 0.5 || (blankSec > 0 && curr >= blankSec) || curr <= 0.5)) {
                playFrom = startSec;
            } else if (curr < startSec - 0.5 || (blankSec > 0 && curr >= blankSec)) {
                playFrom = startSec;
            } else {
                playFrom = null;
            }

            window.gameAudio.playTrack(playFrom, currentSong.mode !== 'everybody_sing');
            window.gameBus.send('PLAY_AUDIO', { fromTime: playFrom });
        } else {
            btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY AUDIO';
            btnPlayAudio.style.background = 'var(--brand-blue)';
            btnPlayAudio.style.color = '#FFF';
            window.gameBus.send('STOP_AUDIO');
            window.gameAudio.smoothStop(250);
        }
    }

    function triggerEmergencyCut() {
        isPlaying = false;
        isPausedAtBlank = true;
        hasCutForBlank = true;
        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> CONTINUE SONG [SPACE]';
        btnPlayAudio.style.background = 'var(--accent-green)';
        btnPlayAudio.style.color = '#FFF';

        window.gameAudio.emergencyCut();
        window.gameBus.send('STOP_AUDIO');

        if (!isTimerRunning) {
            toggleTimer();
        }
    }

    if (btnPlayAudio) btnPlayAudio.addEventListener('click', togglePlay);
    if (btnPlaySection) btnPlaySection.addEventListener('click', () => playFromCertainPart(currentSong));
    if (btnReplaySection) btnReplaySection.addEventListener('click', () => playFromCertainPart(currentSong));
    if (btnEmergencyCut) btnEmergencyCut.addEventListener('click', triggerEmergencyCut);

    window.gameAudio.onTimeUpdate = (curr, dur) => {
        if (dur > 0) {
            const pct = (curr / dur) * 100;
            audioProgressFill.style.width = `${pct}%`;
            audioTimeDisplay.textContent = `${formatTime(curr)} / ${formatTime(dur)}`;

            if (audioProgressMarkers && (!audioProgressMarkers.hasChildNodes() || audioProgressMarkers.children.length === 0)) {
                renderTimelineBlankMarkers();
            }

            const isEverybodySing = (currentSong && currentSong.mode === 'everybody_sing');
            if (isEverybodySing) {
                const blanks = currentSong.blanks || [];
                const curBlank = blanks[activeBlankIndex];

                if (curBlank && !curBlank.answered && !hasCutForBlank && !isPausedAtBlank && isPlaying) {
                    const lTime = Number(curBlank.lyrics_time) || 0;
                    if (lTime > 0 && curr >= lTime && !curBlank._lyricsShown) {
                        curBlank._lyricsShown = true;
                        window.gameBus.send('SHOW_BLANK_LYRICS', { activeBlankIndex });
                    }
                    
                    if (curBlank && curBlank.is_lyrics_only) {
                        waitingForNextBlank = true;
                    }
                }

                let pauseSec = (inputBlankTime ? parseTime(inputBlankTime.value) : 0) || (curBlank ? Number(curBlank.pause_time) : 0);
                if (checkAutoPauseBlank && checkAutoPauseBlank.checked && pauseSec > 0 && isPlaying && !hasCutForBlank && !curBlank?.answered) {
                    if (curr >= pauseSec && !isPausedAtBlank) {
                        hasCutForBlank = true;
                        isPausedAtBlank = true;
                        isPlaying = false;

                        window.gameAudio.smoothStop(280);
                        window.gameBus.send('STOP_AUDIO');

                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> CONTINUE SONG [SPACE]';
                        btnPlayAudio.style.background = 'var(--accent-green)';
                        btnPlayAudio.style.color = '#FFF';

                        if (!isTimerRunning) {
                            toggleTimer();
                        }
                    }
                }

                if (waitingForNextBlank && activeBlankIndex < blanks.length - 1 && isPlaying) {
                    const nextIdx = activeBlankIndex + 1;
                    const nextBlank = blanks[nextIdx];
                    if (nextBlank) {
                        const prevPause = Number(curBlank?.pause_time) || 0;
                        const nextLyrics = Number(nextBlank.lyrics_time) || 0;
                        const transitionTime = (nextLyrics > prevPause) ? nextLyrics : (prevPause + 3.5);

                        if (curr >= transitionTime) {
                            waitingForNextBlank = false;
                            activeBlankIndex = nextIdx;
                            hasCutForBlank = false;
                            isPausedAtBlank = false;
                            isRevealed = false;
                            isAnswered = false;

                            updatePrompterForMultiBlank();
                            renderTimelineBlankMarkers();

                            window.gameBus.send('SHOW_NEXT_BLANK', {
                                activeBlankIndex: nextIdx,
                                blank: nextBlank
                            });
                        }
                    }
                }
            } else {
                let blankSec = (inputBlankTime ? parseTime(inputBlankTime.value) : 0) || Number(currentSong?.blank_time) || 0;
                if (checkAutoPauseBlank && checkAutoPauseBlank.checked && blankSec >= 5 && isPlaying && !hasCutForBlank && !isAnswered && !isRevealed) {
                    if (curr >= blankSec && !isPausedAtBlank) {
                        hasCutForBlank = true;
                        isPausedAtBlank = true;
                        isPlaying = false;

                        window.gameAudio.smoothStop(280);
                        window.gameBus.send('STOP_AUDIO');

                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> CONTINUE SONG [SPACE]';
                        btnPlayAudio.style.background = 'var(--accent-green)';
                        btnPlayAudio.style.color = '#FFF';

                        if (!isTimerRunning) {
                            toggleTimer();
                        }
                    }
                }
            }
        }
    };

    if (audioProgressBar) {
        audioProgressBar.addEventListener('click', (e) => {
            const rect = audioProgressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = clickX / rect.width;
            if (window.gameAudio.player.duration) {
                const targetTime = pct * window.gameAudio.player.duration;
                window.gameAudio.seek(targetTime);
                if (isPlaying) {
                    window.gameBus.send('PLAY_AUDIO', { fromTime: targetTime, isResume: true });
                }
            }
        });
    }

    if (monitorSoundToggle) {
        monitorSoundToggle.addEventListener('click', () => {
            const isMuted = window.gameAudio.toggleMute();
            monitorSoundToggle.textContent = isMuted ? 'OPERATOR PREVIEW: MUTED' : 'OPERATOR PREVIEW: ACTIVE';
            monitorSoundToggle.style.background = isMuted ? '#DDD' : 'var(--accent-yellow)';
        });
    }

    function triggerReveal() {
        if (!currentSong) return;

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            if (isTimerRunning) {
                resetTimer(timerDuration);
            }
            window.gameBus.send('REVEAL_ANSWER');
            if (activeBlankIndex < blanks.length - 1) {
                activeBlankIndex++;
                isAnswered = false;
                isRevealed = false;
                hasCutForBlank = false;
                isPausedAtBlank = false;
                updatePrompterForMultiBlank();
                renderTimelineBlankMarkers();
            } else {
                activeBlankIndex = blanks.length;
                isAnswered = true;
                isRevealed = true;
                hasCutForBlank = true;
                updatePrompterForMultiBlank();
                renderTimelineBlankMarkers();
            }
            return;
        }

        isRevealed = true;
        isAnswered = true;
        hasCutForBlank = true;
        if (isTimerRunning) {
            resetTimer(timerDuration);
        }
        const hulaReplayFrom = Number(currentSong.hula_replay_time ?? currentSong.start_time) || 0;
        const configuredCut = Number(currentSong.blank_time) || 0;
        const hulaReplayUntil = configuredCut > hulaReplayFrom
            ? configuredCut
            : hulaReplayFrom + 4;
        const replayData = currentSong.mode === 'guess' ? {
            mode: 'guess',
            replayFrom: hulaReplayFrom,
            replayUntil: hulaReplayUntil
        } : {};
        window.gameBus.send('REVEAL_ANSWER', replayData);

        if (currentSong.mode === 'guess' && currentSong.audio_url) {
            isPlaying = true;
            isPausedAtBlank = false;
            setTimeout(() => {
                window.gameAudio.playTrack(hulaReplayFrom, true);
                const stopReplay = () => {
                    if (window.gameAudio.player.currentTime >= hulaReplayUntil) {
                        window.gameAudio.player.removeEventListener('timeupdate', stopReplay);
                        isPlaying = false;
                        window.gameAudio.smoothStop(3000);
                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY NEXT HULA';
                        btnPlayAudio.style.background = 'var(--brand-blue)';
                        btnPlayAudio.style.color = '#FFF';
                    }
                };
                window.gameAudio.player.addEventListener('timeupdate', stopReplay);
            }, 350);
        }
    }

    function triggerCorrect() {
        if (!currentSong) return; if (isAnswered) return;

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            const curBlank = blanks[activeBlankIndex] || {};
            curBlank.answered = true;
            const configuredBlankCut = (inputBlankTime ? parseTime(inputBlankTime.value) : 0)
                || Number(curBlank.pause_time)
                || 0;
            const resumeFrom = configuredBlankCut > 0
                ? Math.max(0, configuredBlankCut - 0.5)
                : null;

            resetTimer(timerDuration);

            isAnswered = true;
            isRevealed = true;
            updatePrompterForMultiBlank();
            renderTimelineBlankMarkers();

            const isLastBlank = (activeBlankIndex >= blanks.length - 1);

            window.gameBus.send('TRIGGER_CORRECT', {
                mode: 'everybody_sing',
                activeBlankIndex,
                blank: curBlank,
                isLastBlank
            });
            window.gameAudio.playCorrectDing();

            if (isLastBlank) {
                hasCutForBlank = true;
                isSmartAutoPlayRunning = false;
                waitingForNextBlank = false;
                if (btnSmartAutoplay) {
                    btnSmartAutoplay.classList.remove('running');
                    btnSmartAutoplay.innerHTML = '<i class="fa-solid fa-trophy"></i> ALL BLANKS CLEARED!';
                }
                setTimeout(() => {
                    window.gameBus.send('STAGE_GRAND_VICTORY');
                    window.gameAudio.playCorrectDing();
                }, 1200);

                if (currentSong.audio_url) {
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                    setTimeout(() => {
                        window.gameAudio.playTrack(resumeFrom, false);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: resumeFrom, isResume: true });
                    }, 400);
                }
            } else {
                waitingForNextBlank = true;
                if (currentSong.audio_url) {
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                    setTimeout(() => {
                        window.gameAudio.playTrack(resumeFrom, false);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: resumeFrom, isResume: true });
                    }, 400);
                }
            }
            return;
        }

        isAnswered = true;
        isRevealed = true;
        hasCutForBlank = true;
        resetTimer(timerDuration);

        const hulaReplayFrom = Number(currentSong.hula_replay_time ?? currentSong.start_time) || 0;
        const configuredCut = Number(currentSong.blank_time) || 0;
        const hulaReplayUntil = configuredCut > hulaReplayFrom
            ? configuredCut
            : hulaReplayFrom + 4;
        window.gameBus.send('TRIGGER_CORRECT', currentSong.mode === 'guess' ? {
            mode: 'guess',
            replayFrom: hulaReplayFrom,
            replayUntil: hulaReplayUntil
        } : {});
        window.gameAudio.playCorrectDing();

        if (currentSong && currentSong.audio_url && currentSong.mode === 'guess') {
            isPlaying = true;
            isPausedAtBlank = false;
            setTimeout(() => {
                window.gameAudio.playTrack(hulaReplayFrom, true);
                window.gameBus.send('PLAY_AUDIO', { fromTime: hulaReplayFrom, isResume: true });
                const stopReplay = () => {
                    if (window.gameAudio.player.currentTime >= hulaReplayUntil) {
                        window.gameAudio.player.removeEventListener('timeupdate', stopReplay);
                        isPlaying = false;
                        window.gameAudio.smoothStop(3000);
                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY NEXT HULA';
                        btnPlayAudio.style.background = 'var(--brand-blue)';
                        btnPlayAudio.style.color = '#FFF';
                    }
                };
                window.gameAudio.player.addEventListener('timeupdate', stopReplay);
            }, 350);
        } else if (currentSong && currentSong.audio_url) {
            isPlaying = true;
            setTimeout(() => {
                window.gameAudio.playTrack(null, currentSong.mode !== 'everybody_sing');
                window.gameBus.send('PLAY_AUDIO', { fromTime: null, isResume: true });
            }, 350);
        }
    }

    function triggerWrong() {
        if (!currentSong) return; if (isAnswered) return;

        if (currentSong.mode === 'everybody_sing') {
            const blanks = currentSong.blanks || [];
            const curBlank = blanks[activeBlankIndex] || {};
            curBlank.answered = true;
            curBlank.wrong = true;
            const configuredBlankCut = (inputBlankTime ? parseTime(inputBlankTime.value) : 0)
                || Number(curBlank.pause_time)
                || 0;
            const resumeFrom = configuredBlankCut > 0
                ? Math.max(0, configuredBlankCut - 0.5)
                : null;

            resetTimer(timerDuration);

            isAnswered = true;
            isRevealed = true;
            updatePrompterForMultiBlank();
            renderTimelineBlankMarkers();

            const isLastBlank = (activeBlankIndex >= blanks.length - 1);

            window.gameBus.send('TRIGGER_WRONG', {
                mode: 'everybody_sing',
                activeBlankIndex,
                blank: curBlank,
                isLastBlank
            });
            window.gameAudio.playWrongBuzzer();

            if (isLastBlank) {
                hasCutForBlank = true;
                isSmartAutoPlayRunning = false;
                waitingForNextBlank = false;
                if (btnSmartAutoplay) {
                    btnSmartAutoplay.classList.remove('running');
                    btnSmartAutoplay.innerHTML = '<i class="fa-solid fa-trophy"></i> ALL BLANKS CLEARED!';
                }
                setTimeout(() => {
                    window.gameBus.send('STAGE_GRAND_VICTORY');
                    window.gameAudio.playWrongBuzzer();
                }, 1200);

                if (currentSong.audio_url) {
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                    setTimeout(() => {
                        window.gameAudio.playTrack(resumeFrom, false);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: resumeFrom, isResume: true });
                    }, 400);
                }
            } else {
                waitingForNextBlank = true;
                if (currentSong.audio_url) {
                    isPlaying = true;
                    btnPlayAudio.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
                    btnPlayAudio.style.background = 'var(--accent-yellow)';
                    btnPlayAudio.style.color = '#000';
                    setTimeout(() => {
                        window.gameAudio.playTrack(resumeFrom, false);
                        window.gameBus.send('PLAY_AUDIO', { fromTime: resumeFrom, isResume: true });
                    }, 400);
                }
            }
            return;
        }

        isAnswered = true;
        isRevealed = true;
        hasCutForBlank = true;
        resetTimer(timerDuration);

        const hulaReplayFrom = Number(currentSong.hula_replay_time ?? currentSong.start_time) || 0;
        const configuredCut = Number(currentSong.blank_time) || 0;
        const hulaReplayUntil = configuredCut > hulaReplayFrom
            ? configuredCut
            : hulaReplayFrom + 4;
        window.gameBus.send('TRIGGER_WRONG', currentSong.mode === 'guess' ? {
            mode: 'guess',
            replayFrom: hulaReplayFrom,
            replayUntil: hulaReplayUntil
        } : {});
        window.gameAudio.playWrongBuzzer();

        if (currentSong && currentSong.audio_url && currentSong.mode === 'guess') {
            isPlaying = true;
            isPausedAtBlank = false;
            setTimeout(() => {
                window.gameAudio.playTrack(hulaReplayFrom, true);
                window.gameBus.send('PLAY_AUDIO', { fromTime: hulaReplayFrom, isResume: true });
                const stopReplay = () => {
                    if (window.gameAudio.player.currentTime >= hulaReplayUntil) {
                        window.gameAudio.player.removeEventListener('timeupdate', stopReplay);
                        isPlaying = false;
                        window.gameAudio.smoothStop(3000);
                        btnPlayAudio.innerHTML = '<i class="fa-solid fa-play"></i> PLAY NEXT HULA';
                        btnPlayAudio.style.background = 'var(--brand-blue)';
                        btnPlayAudio.style.color = '#FFF';
                    }
                };
                window.gameAudio.player.addEventListener('timeupdate', stopReplay);
            }, 350);
        } else if (currentSong && currentSong.audio_url) {
            isPlaying = true;
            setTimeout(() => {
                window.gameAudio.playTrack(null, currentSong.mode !== 'everybody_sing');
                window.gameBus.send('PLAY_AUDIO', { fromTime: null, isResume: true });
            }, 350);
        }
    }

    function triggerTimeout() {
        window.gameBus.send('TRIGGER_TIMEOUT');
        window.gameAudio.playTimeoutBuzzer();
    }

    function triggerTension() {
        window.gameBus.send('TENSION_ROLL', { duration: 3.0 });
        window.gameAudio.playTensionRoll(3.0);
    }

    if (btnReveal) btnReveal.addEventListener('click', triggerReveal);
    if (btnCorrect) btnCorrect.addEventListener('click', triggerCorrect);
    if (btnWrong) btnWrong.addEventListener('click', triggerWrong);
    if (btnTension) btnTension.addEventListener('click', triggerTension);

    function updateTimerDisplay(tick = false) {
        const mins = Math.floor(timerRemaining / 60);
        const secs = timerRemaining % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        timerDisplay.textContent = formatted;

        window.gameBus.send('UPDATE_TIMER', {
            remaining: timerRemaining,
            duration: timerDuration,
            isRunning: isTimerRunning,
            tick
        });
    }

    function toggleTimer() {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            timerInterval = null;
            isTimerRunning = false;
            btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> START [T]';
            btnTimerToggle.style.background = 'var(--accent-green)';
            btnTimerToggle.style.color = '#FFF';
        } else {
            if (timerRemaining <= 0) timerRemaining = timerDuration;
            isTimerRunning = true;
            btnTimerToggle.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE [T]';
            btnTimerToggle.style.background = 'var(--accent-yellow)';
            btnTimerToggle.style.color = '#000';

            timerInterval = setInterval(() => {
                if (timerRemaining > 0) {
                    timerRemaining--;
                    updateTimerDisplay(true);

                    if (timerRemaining <= 5 && timerRemaining > 0) {
                        window.gameAudio.playWarningCountdown(timerRemaining);
                    }

                    if (timerRemaining === 0) {
                        clearInterval(timerInterval);
                        timerInterval = null;
                        isTimerRunning = false;
                        btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> START [T]';
                        btnTimerToggle.style.background = 'var(--accent-green)';
                        btnTimerToggle.style.color = '#FFF';

                        if (!isAnswered) {
                            triggerTimeout();
                        }
                    }
                }
            }, 1000);
        }
        updateTimerDisplay(false);
    }

    function resetTimer(seconds = timerDuration) {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isTimerRunning = false;
        timerRemaining = seconds;
        timerDuration = seconds;
        isAnswered = false;
        btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> START [T]';
        btnTimerToggle.style.background = 'var(--accent-green)';
        btnTimerToggle.style.color = '#FFF';
        updateTimerDisplay(false);
    }

    if (btnTimerToggle) btnTimerToggle.addEventListener('click', toggleTimer);
    if (btnTimerReset) btnTimerReset.addEventListener('click', () => resetTimer(timerDuration));
    if (btnTimerAdd5) btnTimerAdd5.addEventListener('click', () => {
        timerRemaining += 5;
        updateTimerDisplay(false);
    });
    if (btnTimerSub5) btnTimerSub5.addEventListener('click', () => {
        timerRemaining = Math.max(0, timerRemaining - 5);
        updateTimerDisplay(false);
    });

    timerPresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timerPresetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const secs = parseInt(btn.dataset.seconds, 10);
            resetTimer(secs);
        });
    });

    function renderTeams() {
        if (!teamsListContainer) return;
        teamsListContainer.innerHTML = '';
        facultyTeams.forEach(team => {
            const row = document.createElement('div');
            row.className = 'controller-team-row';
            row.innerHTML = `
                <span class="controller-team-name">${escapeHtml(team.name)}</span>
                <span class="controller-team-score">${team.score}</span>
                <div class="score-btn-group">
                    <button class="score-btn score-plus" data-id="${team.id}">+1</button>
                    <button class="score-btn score-minus" data-id="${team.id}">-1</button>
                </div>
            `;
            teamsListContainer.appendChild(row);
        });

        teamsListContainer.querySelectorAll('.score-plus').forEach(b => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                updateScore(b.dataset.id, 1);
            });
        });
        teamsListContainer.querySelectorAll('.score-minus').forEach(b => {
            b.addEventListener('click', (e) => {
                e.stopPropagation();
                updateScore(b.dataset.id, -1);
            });
        });

        window.gameBus.send('UPDATE_SCORE', { teams: facultyTeams });
    }

    function updateScore(teamId, delta) {
        const team = facultyTeams.find(t => t.id === teamId);
        if (team) {
            team.score = Math.max(0, team.score + delta);
            renderTeams();
        }
    }

    if (btnAddTeam) {
        btnAddTeam.addEventListener('click', () => {
            const name = newTeamNameInput.value.trim();
            if (!name) return;
            facultyTeams.push({
                id: `team-${Date.now()}`,
                name: name,
                score: 0
            });
            newTeamNameInput.value = '';
            renderTeams();
        });
    }

    if (btnResetScores) {
        btnResetScores.addEventListener('click', () => {
            if (confirm('Reset all faculty scores to 0?')) {
                facultyTeams.forEach(t => t.score = 0);
                renderTeams();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }
        if (e.repeat) return;
        if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            document.activeElement.blur();
        }

        if (e.code === 'Space') {
            e.preventDefault();
            if (isPlaying) {
                triggerEmergencyCut();
            } else {
                togglePlay();
            }
        } else if (e.code === 'Enter') {
            e.preventDefault();
            triggerReveal();
        } else if (e.key === '1') {
            e.preventDefault();
            triggerCorrect();
        } else if (e.key === '2') {
            e.preventDefault();
            triggerWrong();
        } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            markCurrentBlankCut();
        } else if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            btnNextBlank?.click();
        } else if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            btnPrevBlank?.click();
        } else if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            toggleTimer();
        }
    });

    if (btnCaptureStart && inputStartTime) {
        btnCaptureStart.addEventListener('click', () => {
            const curr = window.gameAudio.player.currentTime || 0;
            inputStartTime.value = formatTime(curr, true);
        });
    }

    if (btnCaptureHulaReplay && inputHulaReplayTime) {
        btnCaptureHulaReplay.addEventListener('click', () => {
            const curr = window.gameAudio.player.currentTime || 0;
            inputHulaReplayTime.value = formatTime(curr, true);
        });
    }

    if (btnCaptureBlank && inputBlankTime) {
        btnCaptureBlank.addEventListener('click', () => {
            const curr = window.gameAudio.player.currentTime || 0;
            inputBlankTime.value = formatTime(curr, true);
        });
    }

    if (btnSaveTimestamps) {
        btnSaveTimestamps.addEventListener('click', async () => {
            if (!currentSong) return;
            const startSec = parseTime(inputStartTime.value);
            const hulaReplaySec = parseTime(inputHulaReplayTime ? inputHulaReplayTime.value : '');
            const blankSec = parseTime(inputBlankTime.value);

            currentSong.start_time = startSec;
            currentSong.hula_replay_time = hulaReplaySec;
            if (currentSong.mode === 'everybody_sing') {
                const blanks = currentSong.blanks || [];
                if (blanks[activeBlankIndex]) {
                    blanks[activeBlankIndex].pause_time = blankSec;
                }
                window.gameBus.send('UPDATE_BLANKS', currentSong.blanks);
            } else {
                currentSong.blank_time = blankSec;
            }

            inputStartTime.value = formatTime(startSec, true);
            inputBlankTime.value = formatTime(blankSec, true);
            if (playSectionBadge) playSectionBadge.textContent = formatTime(startSec, true);

            try {
                const res = await fetch('/api/songs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentSong)
                });
                const data = await res.json();
                if (data.success) {
                    if (timestampSavedIndicator) {
                        timestampSavedIndicator.style.display = 'inline';
                        setTimeout(() => {
                            if (timestampSavedIndicator) timestampSavedIndicator.style.display = 'none';
                        }, 2000);
                    }
                    renderSongList();
                }
            } catch (err) {
                console.error('Failed to save timestamps:', err);
                alert('Failed to save timestamps to server.');
            }
        });
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

    function parseTime(val) {
        if (!val && val !== 0) return 0;
        if (typeof val === 'number') return Math.round(val * 1000) / 1000;
        val = String(val).trim();
        if (val.includes(':')) {
            const parts = val.split(':');
            const m = parseFloat(parts[0]) || 0;
            const s = parseFloat(parts[1]) || 0;
            return Math.round((m * 60 + s) * 1000) / 1000;
        }
        const num = parseFloat(val);
        return isNaN(num) ? 0 : Math.round(num * 1000) / 1000;
    }

    function formatLyrics(lyrics) {
        if (!lyrics) return '';
        return lyrics.split(' / ').map(line => `<div>${escapeHtml(line)}</div>`).join('');
    }

    function formatTime(secs, includeMs = false) {
        if (isNaN(secs) || secs < 0) return includeMs ? '00:00.000' : '00:00';
        const totalMs = Math.round(secs * 1000);
        const m = Math.floor(totalMs / 60000);
        const remMs = totalMs % 60000;
        const s = Math.floor(remMs / 1000);
        const ms = remMs % 1000;
        const base = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return includeMs ? `${base}.${ms.toString().padStart(3, '0')}` : base;
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }
});