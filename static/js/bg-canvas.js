(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    const blockSize = 48; 
    let blocks = [];

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        initBlocks();
    }

    function initBlocks() {
        blocks = [];
        const cols = Math.ceil(width / blockSize);
        const rows = Math.ceil(height / blockSize);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (Math.random() > 0.88) {
                    blocks.push({ x: c * blockSize, y: r * blockSize });
                }
            }
        }
    }

    function drawCanvas() {
        ctx.fillStyle = '#2f7045';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'rgba(231, 244, 224, 0.18)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += blockSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += blockSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.fillStyle = 'rgba(231, 244, 224, 0.22)';
        blocks.forEach(b => ctx.fillRect(b.x + 2, b.y + 2, 4, 4));
    }

    function animateCanvas() {
        if (Math.random() > 0.6) {
            const cols = Math.ceil(width / blockSize);
            const rows = Math.ceil(height / blockSize);
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            
            const existingIndex = blocks.findIndex(b => b.x === c * blockSize && b.y === r * blockSize);
            if (existingIndex > -1) {
                blocks.splice(existingIndex, 1);
            } else {
                blocks.push({ x: c * blockSize, y: r * blockSize });
            }
        }
        drawCanvas();
        requestAnimationFrame(animateCanvas);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateCanvas();
})();
