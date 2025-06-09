// Basic 2D side scroller inspired by classic platformers
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Overlay elements
const menuEl = document.getElementById('menu');
const instructionsEl = document.getElementById('instructions');
const charSelectEl = document.getElementById('charSelect');
const gameOverEl = document.getElementById('gameOver');
const playBtn = document.getElementById('playBtn');
const instrBtn = document.getElementById('instrBtn');
const exitBtn = document.getElementById('exitBtn');
const backInstrBtn = document.getElementById('backInstr');
const retryBtn = document.getElementById('retryBtn');
const menuBtn = document.getElementById('menuBtn');
const charOptions = document.querySelectorAll('.character-option');

let gameState = 'menu';
let selectedCharacter = 'Gigi';

function hideAll() {
    [menuEl, instructionsEl, charSelectEl, gameOverEl].forEach(el => {
        if (el) el.style.display = 'none';
    });
}

function show(el) {
    hideAll();
    if (el) el.style.display = 'flex';
}

playBtn.onclick = () => {
    gameState = 'charSelect';
    show(charSelectEl);
};
instrBtn.onclick = () => show(instructionsEl);
backInstrBtn.onclick = () => show(menuEl);
exitBtn.onclick = () => show(menuEl); // placeholder
retryBtn.onclick = () => startGame();
menuBtn.onclick = () => { gameState = 'menu'; show(menuEl); };
charOptions.forEach(opt => {
    opt.addEventListener('click', () => {
        selectedCharacter = opt.dataset.char;
        startGame();
    });
});

function startGame() {
    resetPlayer();
    coinCount = 0;
    flag.reached = false;
    gameState = 'playing';
    show(null);
}

function triggerGameOver() {
    gameState = 'gameOver';
    show(gameOverEl);
}

// World setup
const worldWidth = 8000; // much longer level
const gravity = 0.5;
const jumpPower = 10;

// Input state
const keys = {};

// Player entity
const player = {
    x: 50,
    y: 300,
    vx: 0,
    vy: 0,
    width: 32,
    height: 32,
    onGround: false
};

function resetPlayer() {
    player.x = 50;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;
}

// Goomba-style enemy constructor
function Enemy(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 1; // walking speed
    this.width = 32;
    this.height = 32;
    this.alive = true;
}

const enemies = [];
for (let i = 400; i < worldWidth; i += 600) {
    enemies.push(new Enemy(i, 336));
}

// Question block with coin
function QuestionBlock(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.used = false;
}

const blocks = [];
for (let i = 200; i < worldWidth; i += 500) {
    blocks.push(new QuestionBlock(i, 250));
}

let coinCount = 0;

// holes the player can fall into
const holes = [
    { x: 500, width: 100 },
    { x: 1200, width: 150 },
    { x: 2500, width: 200 },
    { x: 4200, width: 150 },
    { x: 6100, width: 150 }
];

// floating platforms
const platforms = [
    { x: 600, y: 300, width: 100, height: 10 },
    { x: 1600, y: 250, width: 120, height: 10 },
    { x: 3200, y: 280, width: 100, height: 10 },
    { x: 4800, y: 230, width: 150, height: 10 },
    { x: 6500, y: 260, width: 120, height: 10 }
];

// Level end flag
const flag = { x: worldWidth - 200, y: 304, width: 32, height: 96, reached: false };

// Camera offset for scrolling
let cameraX = 0;

// Input handling
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Collision detection helper
function rectsCollide(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

// Main update function
function update() {
    // Horizontal movement
    if (keys['ArrowLeft']) player.vx = -3;
    else if (keys['ArrowRight']) player.vx = 3;
    else player.vx = 0;

    // Jumping
    if (keys['ArrowUp'] && player.onGround) {
        player.vy = -jumpPower;
        player.onGround = false;
    }

    // Apply physics
    player.vy += gravity; // gravity
    player.x += player.vx;
    player.y += player.vy;

    // Simple world bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;

    // Ground collision with holes
    const groundY = 368; // ground height
    player.onGround = false;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (player.y + player.height >= groundY && !overHole) {
      
        player.y = groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    }

    // Platform collisions
    platforms.forEach(p => {
        if (rectsCollide(player, p) && player.vy >= 0 && player.y + player.height - p.y < 10) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
    });

    if (player.y > canvas.height) triggerGameOver();
  
    // Question block collisions
    blocks.forEach(block => {
        if (!block.used &&
            rectsCollide(player, {
                x: block.x,
                y: block.y - 5, // a bit lower to catch head bump
                width: block.width,
                height: 5
            }) && player.vy < 0) {
            block.used = true;
            coinCount += 1; // collect coin
            player.vy = 2; // small bounce down
        }
    });

    // Enemy logic
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemy.vx;
        // turn around at edges
        if (enemy.x < 0 || enemy.x + enemy.width > worldWidth) enemy.vx *= -1;

        // Collision with ground
        if (enemy.y + enemy.height < groundY) enemy.y += gravity;
        else enemy.y = groundY - enemy.height;

        // Collision with player
        if (rectsCollide(player, enemy)) {
            if (player.vy > 0 && player.y + player.height - enemy.y < 10) {
                // Stomp enemy
                enemy.alive = false;
                player.vy = -jumpPower / 1.5; // bounce up
            } else {
                // Hit from side -> game over
                triggerGameOver();

            }
        }
    });

    // Flag collision
    if (rectsCollide(player, flag)) flag.reached = true;

    // Camera follows player
    cameraX = player.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > worldWidth - canvas.width)
        cameraX = worldWidth - canvas.width;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0); // camera movement

    // Draw ground with holes
    ctx.fillStyle = '#654321';
    let gx = 0;
    holes.forEach(h => {
        ctx.fillRect(gx, 368, h.x - gx, 32);
        gx = h.x + h.width;
    });
    ctx.fillRect(gx, 368, worldWidth - gx, 32);

    // Draw platforms
    platforms.forEach(p => {
        ctx.fillStyle = '#964B00';
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Draw question blocks
    blocks.forEach(block => {
        ctx.fillStyle = block.used ? '#888' : '#ff0';
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.fillStyle = '#000';
        ctx.fillText('?', block.x + 10, block.y + 22);
    });

    // Draw enemies
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        ctx.fillStyle = '#b00';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // Draw flag
    ctx.fillStyle = '#fff';
    ctx.fillRect(flag.x, flag.y, flag.width, flag.height);

    // Draw player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.restore();

    // HUD
    ctx.fillStyle = '#fff';
    ctx.fillText('Coins: ' + coinCount, 10, 20);
    if (flag.reached) ctx.fillText('Level Complete!', canvas.width / 2 - 40, 20);
}

// Main game loop
function loop() {
    if (gameState === 'playing') {
        update();
        draw();
    } else if (gameState === 'charSelect' || gameState === 'gameOver') {
        draw(); // show background while overlays displayed
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    requestAnimationFrame(loop);
}

// Kick off
requestAnimationFrame(loop);
