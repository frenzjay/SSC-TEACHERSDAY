window.singRound = {
    progress(blanks = [], activeIndex = -1) {
        let total = 0, score = 0, answered = 0, number = 0;
        blanks.forEach((blank, index) => {
            if (blank.is_lyrics_only) return;
            total++;
            if (index <= activeIndex) number++;
            if (blank.answered) {
                answered++;
                if (!blank.wrong) score++;
            }
        });
        return { total, score, number, complete: total > 0 && answered === total };
    },
    reset(blanks = []) {
        blanks.forEach(blank => {
            delete blank.answered;
            delete blank.wrong;
            delete blank._lyricsShown;
        });
    }
};
