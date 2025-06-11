// Basic 2D side scroller inspired by classic platformers
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // keep crisp pixels

// Utility to create a 1x1 transparent image data URL
function createPlaceholder() {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    return c.toDataURL();
}

const placeholderSrc = createPlaceholder();
const placeholderImg = new Image();
placeholderImg.src = placeholderSrc;

// Sprite paths for the player states
const spritePaths = {
    idle: 'assets/player/player_idle.png',
    run: 'assets/player/player_run.png',
    jump: 'assets/player/player_jump.png',
    dead: 'assets/player/player_dead.png'
};

// Loaded Image objects will be stored here
const sprites = {};

function loadSprites() {
    const promises = Object.entries(spritePaths).map(([state, path]) => {
        const img = new Image();
        sprites[state] = img;
        return new Promise(resolve => {
            img.onload = () => resolve();
            img.onerror = () => {
                img.onerror = null;
                img.src = placeholderSrc;
            };
            img.addEventListener('load', resolve, { once: true });
            img.src = path;
        });
    });
    return Promise.all(promises);
}

// Scale factor to zoom in the camera for a closer view
const ZOOM = 2;
// Resize canvas to full screen and update ground position
const groundHeight = 32;
let groundY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // groundY is calculated on the unscaled coordinate system
    groundY = canvas.height / ZOOM - groundHeight;
    flag.y = groundY - flag.height;
    setupWorld();
}

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
let playerState = 'idle';

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

// Show main menu on load
show(menuEl);

function startGame() {
    setupWorld();

// Physics tuning for a tighter jump feel
const gravity = 0.8; // stronger gravity so jumps fall faster
const jumpPower = 10; // reduced jump power for shorter arc
    flag.reached = false;
    gameState = 'playing';
    playerState = 'idle';
    show(null);
}

function triggerGameOver() {
    gameState = 'gameOver';
    playerState = 'dead';
    show(gameOverEl);
}

// World setup
const worldWidth = 8000; // much longer level
const gravity = 0.4; // slightly lower for floatier jumps
const jumpPower = 12; // higher jump power
const moveSpeed = 4; // horizontal speed

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
    player.y = groundY - player.height;
    player.vx = 0;
    player.vy = 0;
    cameraX = 0;
}

// Goomba-style enemy constructor
function Enemy(x) {
    this.x = x;
    this.y = groundY - 32;
    this.vx = 1; // walking speed
    this.width = 32;
    this.height = 32;
    this.alive = true;
}

// Populated in setupWorld()
const enemies = [];

// Question block with coin
function QuestionBlock(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.used = false;
}

// Populated in setupWorld()
const blocks = [];

let coinCount = 0;

// holes the player can fall into
const holes = [
    { x: 500, width: 100 },
    { x: 1200, width: 150 },
    { x: 2500, width: 200 },
    { x: 4200, width: 150 },
    { x: 6100, width: 150 }
];

// floating platforms (rel values are height above ground)
const platforms = [
    { x: 600, rel: 100, width: 100, height: 10 },
    { x: 1600, rel: 150, width: 120, height: 10 },
    { x: 3200, rel: 120, width: 100, height: 10 },
    { x: 4800, rel: 170, width: 150, height: 10 },
    { x: 6500, rel: 140, width: 120, height: 10 }
];

// Level end flag
const flag = { x: worldWidth - 200, y: 0, width: 32, height: 96, reached: false };

// Position enemies, blocks and platforms relative to ground
function setupWorld() {
    enemies.length = 0;
    for (let i = 400; i < worldWidth; i += 600) {
        enemies.push(new Enemy(i));
    }

    blocks.length = 0;
    for (let i = 200; i < worldWidth; i += 500) {
        const insideHole = holes.some(h => i + 32 > h.x && i < h.x + h.width);
        if (!insideHole) {
            blocks.push(new QuestionBlock(i, groundY - 96));
        }
    }

    platforms.forEach(p => {
        p.y = groundY - p.rel;
    });

    flag.y = groundY - flag.height;
}
// Initialize canvas size now that flag exists
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
    // Previous position before applying physics
    const prevY = player.y;
    // Horizontal movement with basic acceleration
    if (keys['ArrowLeft']) {
        player.vx -= 0.5;
    } else if (keys['ArrowRight']) {
        player.vx += 0.5;
    } else {
        player.vx *= 0.8; // friction
    }
    if (player.vx > moveSpeed) player.vx = moveSpeed;
    if (player.vx < -moveSpeed) player.vx = -moveSpeed;

    // Jumping
    if (keys['ArrowUp'] && player.onGround) {
        player.vy = -jumpPower;
        player.onGround = false;
    }

    // Apply physics
    player.vy += gravity; // gravity
    const nextX = player.x + player.vx;
    const nextY = player.y + player.vy;
    player.x = nextX;

    // Simple world bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > worldWidth)
        player.x = worldWidth - player.width;

    // Ground collision with holes
    player.onGround = false;
    const overHole = holes.some(h => player.x + player.width > h.x && player.x < h.x + h.width);
    if (nextY + player.height >= groundY && !overHole) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    } else {
        player.y = nextY;
    }

    // Platform collisions (solid from all sides)
    platforms.forEach(p => {
        // landing on top
        if (player.vy > 0 &&
            player.x + player.width > p.x && player.x < p.x + p.width &&
            prevY + player.height <= p.y && player.y + player.height >= p.y) {
            player.y = p.y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
        // hitting the underside
        if (player.vy < 0 &&
            player.x + player.width > p.x && player.x < p.x + p.width &&
            prevY >= p.y + p.height && player.y <= p.y + p.height) {
            player.y = p.y + p.height;
            player.vy = 0;
        }
    });

    if (player.y > canvas.height / ZOOM) triggerGameOver();
    // Question block collisions (solid blocks)
    blocks.forEach(block => {
        const overlapX = player.x + player.width > block.x && player.x < block.x + block.width;
        // hit from below to get coin
        if (player.vy < 0 && overlapX &&
            prevY >= block.y + block.height && player.y <= block.y + block.height) {
            player.y = block.y + block.height;
            player.vy = 0;
            if (!block.used) {
                block.used = true;
                coinCount += 1;
            }
        }
        // land on top
        if (player.vy > 0 && overlapX &&
            prevY + player.height <= block.y && player.y + player.height >= block.y) {
            player.y = block.y - player.height;
            player.vy = 0;
            player.onGround = true;
        }
    });

    // Enemy logic
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        // move away from the player
        enemy.vx = player.x < enemy.x ? 1 : -1;
        enemy.x += enemy.vx;
        // prevent leaving the world
        if (enemy.x < 0) enemy.x = 0;
        if (enemy.x + enemy.width > worldWidth) enemy.x = worldWidth - enemy.width;

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

    // Update player animation state
    if (gameState === 'playing') {
        if (!player.onGround) playerState = 'jump';
        else if (Math.abs(player.vx) > 0.2) playerState = 'run';
        else playerState = 'idle';
    }

    // Camera follows player with a bit of smoothing
    let targetCameraX = player.x - (canvas.width / ZOOM) / 2;
    if (targetCameraX < 0) targetCameraX = 0;
    if (targetCameraX > worldWidth - canvas.width / ZOOM)
        targetCameraX = worldWidth - canvas.width / ZOOM;
    cameraX += (targetCameraX - cameraX) * 0.1;
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(ZOOM, ZOOM); // zoom in the scene
    ctx.translate(-cameraX, 0); // camera movement

    // Draw ground with holes
    ctx.fillStyle = '#654321';
    let gx = 0;
    holes.forEach(h => {
        ctx.fillRect(gx, groundY, h.x - gx, groundHeight);
        gx = h.x + h.width;
    });
    ctx.fillRect(gx, groundY, worldWidth - gx, groundHeight);

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

    // Draw player using sprite based on state
    const currentImg = sprites[playerState] ?? placeholderImg;
    ctx.drawImage(currentImg, player.x, player.y, 128, 128);

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

// Kick off after sprites load
loadSprites().then(() => {
    requestAnimationFrame(loop);
});
