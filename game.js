// Basic 2D side scroller inspired by classic platformers
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// World setup
const worldWidth = 2000; // simple long level
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

// Goomba-style enemy constructor
function Enemy(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 1; // walking speed
    this.width = 32;
    this.height = 32;
    this.alive = true;
}

const enemies = [new Enemy(400, 336), new Enemy(600, 336)];

// Question block with coin
function QuestionBlock(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.used = false;
}

const blocks = [new QuestionBlock(200, 250), new QuestionBlock(750, 250)];

let coinCount = 0;

// Level end flag
const flag = { x: 1800, y: 304, width: 32, height: 96, reached: false };

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

    // Ground collision (simple flat ground)
    const groundY = 368; // ground height
    if (player.y + player.height >= groundY) {
        player.y = groundY - player.height;
        player.vy = 0;
        player.onGround = true;
    }

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
                // Hit from side -> reset player position
                player.x = 50;
                player.y = 300;
                cameraX = 0;
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

    // Draw ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, 368, worldWidth, 32);

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
    update();
    draw();
    requestAnimationFrame(loop);
}

// Kick off
requestAnimationFrame(loop);
