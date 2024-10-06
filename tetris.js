const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

let isDragging = false;
let lastMouseX = null;

// Scale up the pieces
context.scale(20, 20);

// Create the playing field (matrix)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Define the shapes of the Tetris pieces
function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2],
            ];
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];
        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
    }
}

// Collision detection
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (
                m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0
            ) {
                return true;
            }
        }
    }
    return false;
}

// Merge the player's piece into the arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Clear completed rows
function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        // Remove the row
        const row = arena.splice(y, 1)[0].fill(0);
        // Add new empty row at the top
        arena.unshift(row);
        ++y;

        player.score += 10;
    }
}

// Rotate the matrix (piece)
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Move the player piece
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    const dir = offset > 0 ? 1 : -1;
    for (let i = 0; i < Math.abs(offset); i++) {
        player.pos.x += dir;
        if (collide(arena, player) || player.pos.x < 0 || player.pos.x + player.matrix[0].length > arena[0].length) {
            player.pos.x -= dir;
            break; // Stop moving if collision or boundary exceeded
        }
    }
}



// Reset the player when a piece is placed
function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(
        pieces[(pieces.length * Math.random()) | 0]
    );
    player.pos.y = 0;
    player.pos.x =
        ((arena[0].length / 2) | 0) -
        ((player.matrix[0].length / 2) | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function playerRotate(dir) {
    const posX = player.pos.x;
    rotate(player.matrix, dir);

    const offsets = [0, -1, 1]; // Try not moving, then left, then right
    let rotated = false;

    for (let i = 0; i < offsets.length; i++) {
        player.pos.x = posX + offsets[i];
        if (!collide(arena, player)) {
            rotated = true;
            break;
        }
    }

    if (!rotated) {
        // Rotate back to original orientation
        rotate(player.matrix, -dir);
        player.pos.x = posX;
    }
}


// Draw the game
function draw() {
    context.fillStyle = '#f0f0f0';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// Draw a matrix (arena or piece)
function drawMatrix(matrix, offset) {
    const colors = [
        null,
        '#FF0D72', // T
        '#0DC2FF', // O
        '#0DFF72', // L
        '#F538FF', // J
        '#FF8E0D', // I
        '#FFE138', // S
        '#3877FF', // Z
    ];

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(
                    x + offset.x,
                    y + offset.y,
                    1,
                    1
                );
            }
        });
    });
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

// Update game logic
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// Update the score display
function updateScore() {
    document.getElementById('score').innerText = player.score;
}

const arena = createMatrix(12, 20);

const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
};

function handleCanvasClick(event) {
    // Get the canvas position and size
    const rect = canvas.getBoundingClientRect();

    // Calculate the scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the click coordinates relative to the canvas
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Convert the click coordinates to grid positions
    const gridX = Math.floor(x / 20); // Each block is 20 pixels due to context scaling
    const gridY = Math.floor(y / 20);

    // Define the clickable area dimensions (2x4 blocks)
    const clickAreaWidth = 4;
    const clickAreaHeight = 4;

    // Calculate the clickable area's top-left corner
    const areaX = player.pos.x - Math.floor(clickAreaWidth / 2);
    const areaY = player.pos.y - Math.floor(clickAreaHeight / 2);

    // Optional: Adjust for arena bounds
    const adjustedAreaX = Math.max(0, areaX);
    const adjustedAreaY = Math.max(0, areaY);

    // Check if the click is within the clickable area
    if (
        gridX >= adjustedAreaX &&
        gridX < adjustedAreaX + clickAreaWidth &&
        gridY >= adjustedAreaY &&
        gridY < adjustedAreaY + clickAreaHeight
    ) {
        // Rotate the piece left
        playerRotate(-1);
    }
}

function handleMouseDown(event) {
    // Get the canvas position and size
    const rect = canvas.getBoundingClientRect();

    // Calculate the scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the click coordinates relative to the canvas
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Convert the click coordinates to grid positions
    const gridX = Math.floor(x / 20); // Each block is 20 pixels due to context scaling
    const gridY = Math.floor(y / 20);

    // Get the player's piece position and dimensions
    const { x: pieceX, y: pieceY } = player.pos;
    const pieceWidth = player.matrix[0].length;
    const pieceHeight = player.matrix.length;

    // Check if the click is within the bounds of the current piece
    if (
        gridX >= pieceX &&
        gridX < pieceX + pieceWidth &&
        gridY >= pieceY &&
        gridY < pieceY + pieceHeight &&
        player.matrix[gridY - pieceY][gridX - pieceX] !== 0
    ) {
        // Start dragging
        isDragging = true;
        lastMouseX = gridX;
    }
}

function handleMouseMove(event) {
    if (!isDragging) return;

    // Get the canvas position and size
    const rect = canvas.getBoundingClientRect();

    // Calculate the scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the current mouse coordinates relative to the canvas
    const x = (event.clientX - rect.left) * scaleX;

    // Convert the mouse x-coordinate to grid position
    const gridX = Math.floor(x / 20);

    // Calculate the difference in grid positions
    const deltaX = gridX - lastMouseX;

    // If there's movement, attempt to move the piece
    if (deltaX !== 0) {
        // Move the piece left or right
        playerMove(deltaX);

        // Update lastMouseX
        lastMouseX = gridX;
    }
}

function handleMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        lastMouseX = null;
    }
}


// Add click event listener to rotate the piece
canvas.addEventListener('click', handleCanvasClick);

// Add mouse event listeners for dragging
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);


document.addEventListener('keydown', event => {
    switch (event.keyCode) {
        case 37: // Left arrow
            playerMove(-1);
            break;
        case 39: // Right arrow
            playerMove(1);
            break;
        case 40: // Down arrow
            playerDrop();
            break;
        case 81: // Q
            playerRotate(-1);
            break;
        case 87: // W
            playerRotate(1);
            break;
    }
});

// Initialize the game
playerReset();
updateScore();
update();