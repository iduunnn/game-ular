const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const gridSize = 20;
const canvasSize = canvas.width / gridSize;

let snake = [{ x: 10, y: 10 }];
let direction = 'right';
let nextDirection = 'right';
let food = getRandomFood();
let score = 0;
let highScore = 0;
let speed = 100;
let initialSpeed = speed;
let isPaused = false;
let gameLoopId = null;
let gameState = 'START'; // START | PLAYING | GAMEOVER

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let particles = [];

function getRandomFood() {
    return {
        x: Math.floor(Math.random() * canvasSize),
        y: Math.floor(Math.random() * canvasSize)
    };
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.shadowBlur = isHead ? 15 : 0;
        ctx.shadowColor = isHead ? '#00d9ff' : 'transparent';

        ctx.beginPath();
        const r = isHead ? 8 : 7;
        ctx.roundRect
            ? ctx.roundRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4, r)
            : ctx.arc(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);

        ctx.fillStyle = isHead ? '#00d9ff' : '#a8edea';
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function drawFood() {
    const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
    const r = (gridSize / 2 - 3) * pulse;

    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        r,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff6b6b';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2 - 3,
        food.y * gridSize + gridSize / 2 - 3,
        3,
        0,
        Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
}

function createParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x * gridSize + gridSize / 2,
            y: y * gridSize + gridSize / 2,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 1.0,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function moveSnake() {
    direction = nextDirection;
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y = (head.y - 1 + canvasSize) % canvasSize; break;
        case 'down': head.y = (head.y + 1) % canvasSize; break;
        case 'left': head.x = (head.x - 1 + canvasSize) % canvasSize; break;
        case 'right': head.x = (head.x + 1) % canvasSize; break;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        food = getRandomFood();
        score += 10;
        updateScore();
        increaseSpeed();
        createParticles(head.x, head.y);
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    return snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y);
}

function increaseSpeed() {
    speed = Math.max(40, initialSpeed - Math.floor(score / 50) * 5);
}

function updateScore() {
    scoreEl.innerText = score;
    if (score > highScore) {
        highScore = score;
        highScoreEl.innerText = highScore;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSnake();
    drawFood();
    drawParticles();
    updateParticles();

    ctx.fillStyle = '#fff';
    ctx.font = '16px Segoe UI';
    ctx.fillText(`Score: ${score}`, 10, 25);
}

function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = 'right';
    nextDirection = 'right';
    food = getRandomFood();
    score = 0;
    speed = initialScoreSpeed();
    particles = [];
    updateScore();
}

function initialScoreSpeed() {
    return 100;
}

function startGame() {
    gameState = 'PLAYING';
    isPaused = false;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseBtn.style.display = 'inline-block';
    pauseBtn.textContent = '⏸ Pause';
    resetGame();
    if (gameLoopId) clearTimeout(gameLoopId);
    gameLoop();
}

function gameOver() {
    gameState = 'GAMEOVER';
    isPaused = false;
    finalScoreEl.innerText = score;
    pauseBtn.style.display = 'none';
    gameOverScreen.classList.remove('hidden');
}

function gameLoop() {
    if (gameState !== 'PLAYING' || isPaused) return;

    moveSnake();
    if (checkCollision()) {
        gameOver();
        return;
    }

    draw();
    gameLoopId = setTimeout(gameLoop, speed);
}

document.addEventListener('keydown', e => {
    if (gameState === 'START' && e.key === 'Enter') {
        startGame();
        return;
    }
    if (gameState === 'GAMEOVER' && e.key === 'Enter') {
        startGame();
        return;
    }
    if (gameState !== 'PLAYING') return;

    switch (e.key) {
        case 'ArrowUp': if (direction !== 'down') nextDirection = 'up'; break;
        case 'ArrowDown': if (direction !== 'up') nextDirection = 'down'; break;
        case 'ArrowLeft': if (direction !== 'right') nextDirection = 'left'; break;
        case 'ArrowRight': if (direction !== 'left') nextDirection = 'right'; break;
    }
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
    if (gameState !== 'PLAYING') return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Lanjutkan' : '⏸ Pause';
    pauseBtn.style.display = 'inline-block';
    if (!isPaused) gameLoop();
});

document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (gameState !== 'PLAYING') return;
        const dir = btn.dataset.dir;
        switch (dir) {
            case 'up': if (direction !== 'down') nextDirection = 'up'; break;
            case 'down': if (direction !== 'up') nextDirection = 'down'; break;
            case 'left': if (direction !== 'right') nextDirection = 'left'; break;
            case 'right': if (direction !== 'left') nextDirection = 'right'; break;
        }
    });
    btn.addEventListener('mousedown', e => {
        e.preventDefault();
        if (gameState !== 'PLAYING') return;
        const dir = btn.dataset.dir;
        switch (dir) {
            case 'up': if (direction !== 'down') nextDirection = 'up'; break;
            case 'down': if (direction !== 'up') nextDirection = 'down'; break;
            case 'left': if (direction !== 'right') nextDirection = 'left'; break;
            case 'right': if (direction !== 'left') nextDirection = 'right'; break;
        }
    });
});

resetGame();
updateScore();
