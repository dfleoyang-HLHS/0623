// 遊戲常數
const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 20;

// 方塊形狀定義（7種基本俄羅斯方塊）
const TETRIS_SHAPES = {
    I: {
        color: '#00F0F0',
        blocks: [[1, 1, 1, 1]]
    },
    O: {
        color: '#F0F000',
        blocks: [[1, 1], [1, 1]]
    },
    T: {
        color: '#A000F0',
        blocks: [[0, 1, 0], [1, 1, 1]]
    },
    S: {
        color: '#00F000',
        blocks: [[0, 1, 1], [1, 1, 0]]
    },
    Z: {
        color: '#F00000',
        blocks: [[1, 1, 0], [0, 1, 1]]
    },
    J: {
        color: '#0000F0',
        blocks: [[1, 0, 0], [1, 1, 1]]
    },
    L: {
        color: '#F0A000',
        blocks: [[0, 0, 1], [1, 1, 1]]
    }
};

class TetrisGame {
    constructor() {
        this.gameCanvas = document.getElementById('gameCanvas');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = this.initBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameActive = false;
        this.gamePaused = false;
        this.dropSpeed = 1000; // 初始下落速度（毫秒）
        this.dropInterval = null;
        
        this.setupEventListeners();
        this.updateDisplay();
    }

    initBoard() {
        return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    start() {
        if (this.gameActive) return;
        this.gameActive = true;
        this.gamePaused = false;
        this.board = this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.updateDisplay();
        this.spawnPiece();
        this.startDropInterval();
        this.updateStatus('正在遊戲中...');
    }

    togglePause() {
        if (!this.gameActive) return;
        this.gamePaused = !this.gamePaused;
        if (this.gamePaused) {
            clearInterval(this.dropInterval);
            this.updateStatus('已暫停');
        } else {
            this.startDropInterval();
            this.updateStatus('正在遊戲中...');
        }
    }

    reset() {
        clearInterval(this.dropInterval);
        this.gameActive = false;
        this.gamePaused = false;
        this.board = this.initBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.updateDisplay();
        this.draw();
        this.updateStatus('遊戲已重置');
    }

    startDropInterval() {
        this.dropInterval = setInterval(() => {
            if (!this.gamePaused && this.gameActive) {
                this.dropPiece();
            }
        }, this.dropSpeed);
    }

    spawnPiece() {
        if (this.nextPiece === null) {
            this.nextPiece = this.randomPiece();
        }
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.randomPiece();
        
        this.currentPiece.x = Math.floor(COLS / 2) - 1;
        this.currentPiece.y = 0;
        
        // 檢查遊戲是否結束
        if (!this.canPlacePiece(this.currentPiece)) {
            this.gameOver();
        }
        
        this.drawNextPiece();
    }

    randomPiece() {
        const shapeKeys = Object.keys(TETRIS_SHAPES);
        const shapeKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        const shape = TETRIS_SHAPES[shapeKey];
        return {
            blocks: shape.blocks.map(row => [...row]),
            color: shape.color,
            x: 0,
            y: 0
        };
    }

    handleKeyPress(e) {
        if (!this.gameActive || this.gamePaused) return;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.dropPiece();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }

    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (!this.canPlacePiece(this.currentPiece)) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        this.draw();
        return true;
    }

    rotatePiece() {
        const originalBlocks = this.currentPiece.blocks;
        this.currentPiece.blocks = this.rotateMatrix(this.currentPiece.blocks);
        
        if (!this.canPlacePiece(this.currentPiece)) {
            this.currentPiece.blocks = originalBlocks;
            return false;
        }
        this.draw();
        return true;
    }

    rotateMatrix(matrix) {
        const n = matrix.length;
        const m = matrix[0].length;
        const rotated = Array(m).fill(null).map(() => Array(n).fill(0));
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < m; j++) {
                rotated[j][n - 1 - i] = matrix[i][j];
            }
        }
        return rotated;
    }

    dropPiece() {
        if (!this.movePiece(0, 1)) {
            this.lockPiece();
        }
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }

    canPlacePiece(piece) {
        const blocks = piece.blocks;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                if (blocks[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    if (x < 0 || x >= COLS || y >= ROWS) {
                        return false;
                    }
                    if (y >= 0 && this.board[y][x]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    lockPiece() {
        const blocks = this.currentPiece.blocks;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                if (blocks[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        const clearedLines = this.clearLines();
        this.updateScore(clearedLines);
        this.spawnPiece();
        this.draw();
    }

    clearLines() {
        let clearedLines = 0;
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(COLS).fill(0));
                clearedLines++;
                row++; // 檢查同一行，因為新行已插入
            }
        }
        return clearedLines;
    }

    updateScore(clearedLines) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[clearedLines] * this.level;
        this.lines += clearedLines;
        
        // 每消除10行升級
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropSpeed = Math.max(200, 1000 - (this.level - 1) * 50);
            clearInterval(this.dropInterval);
            this.startDropInterval();
        }
        
        this.updateDisplay();
    }

    gameOver() {
        this.gameActive = false;
        clearInterval(this.dropInterval);
        this.updateStatus(`遊戲結束！最終得分：${this.score}`);
    }

    draw() {
        // 清空畫布
        this.gameCtx.fillStyle = '#222';
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // 繪製網格線
        this.gameCtx.strokeStyle = '#444';
        this.gameCtx.lineWidth = 0.5;
        for (let i = 0; i <= COLS; i++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(i * BLOCK_SIZE, 0);
            this.gameCtx.lineTo(i * BLOCK_SIZE, this.gameCanvas.height);
            this.gameCtx.stroke();
        }
        for (let i = 0; i <= ROWS; i++) {
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, i * BLOCK_SIZE);
            this.gameCtx.lineTo(this.gameCanvas.width, i * BLOCK_SIZE);
            this.gameCtx.stroke();
        }
        
        // 繪製已落地的方塊
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(this.gameCtx, col, row, this.board[row][col]);
                }
            }
        }
        
        // 繪製當前下落的方塊
        if (this.currentPiece) {
            const blocks = this.currentPiece.blocks;
            for (let row = 0; row < blocks.length; row++) {
                for (let col = 0; col < blocks[row].length; col++) {
                    if (blocks[row][col]) {
                        const x = this.currentPiece.x + col;
                        const y = this.currentPiece.y + row;
                        if (y >= 0) {
                            this.drawBlock(this.gameCtx, x, y, this.currentPiece.color);
                        }
                    }
                }
            }
        }
    }

    drawBlock(ctx, col, row, color) {
        const x = col * BLOCK_SIZE;
        const y = row * BLOCK_SIZE;
        const padding = 1;
        
        ctx.fillStyle = color;
        ctx.fillRect(x + padding, y + padding, BLOCK_SIZE - 2 * padding, BLOCK_SIZE - 2 * padding);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + padding, y + padding, BLOCK_SIZE - 2 * padding, BLOCK_SIZE - 2 * padding);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#222';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (this.nextPiece) {
            const blocks = this.nextPiece.blocks;
            const offsetX = (this.nextCanvas.width - blocks[0].length * 20) / 2;
            const offsetY = (this.nextCanvas.height - blocks.length * 20) / 2;
            
            for (let row = 0; row < blocks.length; row++) {
                for (let col = 0; col < blocks[row].length; col++) {
                    if (blocks[row][col]) {
                        const x = offsetX + col * 20;
                        const y = offsetY + row * 20;
                        this.nextCtx.fillStyle = this.nextPiece.color;
                        this.nextCtx.fillRect(x, y, 18, 18);
                        this.nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(x, y, 18, 18);
                    }
                }
            }
        }
    }

    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    updateStatus(message) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = '';
        
        if (message.includes('結束')) {
            statusEl.classList.add('game-over');
        } else if (message.includes('暫停')) {
            statusEl.classList.add('paused');
        } else if (message.includes('中')) {
            statusEl.classList.add('playing');
        }
    }
}

// 初始化遊戲
window.addEventListener('DOMContentLoaded', () => {
    const game = new TetrisGame();
});
