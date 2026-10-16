(() => {
    function escapeHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    function formatLyrics(lyrics) {
        if (!lyrics) return '';
        return lyrics.split(' / ').map(line => `<div>${escapeHtml(line)}</div>`).join('');
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

    window.gameUtils = { escapeHtml, formatLyrics, formatWordBlanksHtml };
})();
