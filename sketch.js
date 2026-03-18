// My digital snooker application is engineered to provide an engaging simulation, distinguished by several unique extensions that enhances the player’s 
// experience and replayability, all built upon an intuitive design for cue manipulation. The primary interaction involves a synergistic use of mouse and 
// keyboard for shot execution. After the player places the cue ball within the “D” zone, the gameplay state is transitioned to activate the cue’s visibility 
// and tethers it to the cue ball with keyboard inputs (“A” and “D”) to precisely control the shot angle. The cue is drawn on-screen, visually indicating the 
// intended line of play. Mouse input then governs the shot power with a click-and-drag action away from the cue ball simulating a pullback. A key visual here 
// is my power indicator extension, which dynamically renders a series of tapering dots along the aiming line. This indicator’s length and intensity directly 
// correlates with charged power, offering players immediate, clear feedback to gauge their shot strength effectively, moving beyond guesswork and fostering a 
// more skillful interaction.

//My application’s true distinctiveness, however, lies in its advanced gameplay extensions. Foremost among these is the sophisticated CPU player. This is not 
// merely a random opponent; it is an intelligent agent designed with decision-making capabilities that mimic human strategic thinking. The CPU can analyse the 
// table, identify legal targets based on the game state (reds or specific colours), calculate viable potting angles considering obstacles, and execute shots 
// with varying power. It even handles its own cue ball placement within the “D” zone when required. This extension elevates my game significantly, transforming
// it from a simple physics simulation into a challenging competitive experience where players can test their skills against a competent CPU player.

//To complement the challenge posed by the CPU, I implemented a “Force Pot Mode” as well. While features like this often serves as a developer’s debugging aids, 
// here it has been reimaged as a unique player-centric tool that adds an additional playful dimension. Activated via the “M” key, this mode empowers the player 
// to select any ball on the table with a mouse click, instantly sending it to the nearest pocket and appropriately updating the game score and state. Beyond 
// just a cheat, it also offers several benefits. It can be used as a learning tool to understand complex potting angles and cue ball reactions without penalty. 
// More significantly, it also provides a fun, rule-bending mechanism for players to playfully “level the playing field” against the CPU player, or to simply 
// experiment with impossible shots and game scenarios. This playful cheat ability gives the player the power to experiment with various styles of gameplay, 
// setting it apart from other traditional snooker simulations. These extensions, particularly the CPU player and Force Pot Mode, with user-friendly visual aids 
// like power indicator, works hand-in-hand with intuitive gameplay mechanics to help deliver an engaging snooker experience. 


// --- Global Variables ---
let engine, world;

// Layout and Dimensions (calculated in setup)
let tableLayout = { x: 0, y: 0, lengthPx: 0, widthPx: 0 };
let railingThicknessPx;
let railingCornerRadiusPx;
let pixelScale = 1;
let ballDim = { diameterPx: 0, radiusPx: 0 };
let pocketDim = { radiusPx: 0 };
let pocketPositions = []; // Stores {x, y, label} for 6 pockets
let ballSpots = {}; // Stores {x,y} for YELLOW, GREEN, BROWN etc
let keyStates = { 'a': false, 'd': false }; // To track if 'a' or 'd' is held down.

// Game Objects
let cueBall = null;
let redBalls = [];
let colouredBalls = [];
let cue = {}; // Cue object, properties set in cue.js

let currentBallSetupMode = 1; 

let cueBallHolder = { x: 0, y: 0, radius: 0 };
let isDraggingCueBallForPlacement = false;
let currentGameState = GAME_STATE.PLACING_CUE_BALL; // Initial game state
let colouredBallsPottedThisShotCount = 0; // to increment and count how many coloured balls are consecutively potted

//maintaining score count
let playerScore = 0;
let cpuScore = 0;

let currentPlayer = PLAYER_ID.HUMAN; // Start with the human player
let currentTargetBallType; 
let nominatedColourAfterRed = null;
let shotMadeThisTurn = false;

let showHelpPopup = false;
let helpButtonArea = { x: 0, y: 0, size: 0 }; // To store button's clickable area

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    ellipseMode(RADIUS);
    currentGameState = GAME_STATE.PLACING_CUE_BALL;
    currentPlayer = PLAYER_ID.HUMAN; // Ensure human starts

    // 1. Calculate table dimensions and scaling
    // Table length is horizontal, table width is vertical
    let DesiredTableLengthPx = windowWidth * 0.7; // Use 70% of window width for table length
    const minTableLengthPx = RWD_TABLE_LENGTH_INCHES * 2.5; // Min visual scale
    const maxTableLengthPx = RWD_TABLE_LENGTH_INCHES * 8;   // Max visual scale
    tableLayout.lengthPx = constrain(DesiredTableLengthPx, minTableLengthPx, maxTableLengthPx);
    tableLayout.widthPx = tableLayout.lengthPx / 2; // Maintain 2:1 ratio
    pixelScale = tableLayout.widthPx / RWD_TABLE_WIDTH_INCHES;

    // Center table on canvas
    tableLayout.x = (width - tableLayout.lengthPx) / 2;
    tableLayout.y = (height - tableLayout.widthPx) / 2;

    // Calculate railing in pixels
    railingThicknessPx = RWD_RAILING_THICKNESS_INCHES * pixelScale;
    railingCornerRadiusPx = RWD_RAILING_CORNER_RADIUS_INCHES * pixelScale;

    // Calculate ball and pocket dimensions
    ballDim.diameterPx = (RWD_TABLE_WIDTH_INCHES / 36) * pixelScale;
    ballDim.radiusPx = ballDim.diameterPx / 2;
    pocketDim.radiusPx = (ballDim.diameterPx * RWD_POCKET_DIAMETER_BALL_FACTOR) / 2;

    // Calculate Cue Ball Holder position and size
    cueBallHolder.x = width * CUE_BALL_HOLDER_X_OFFSET_FACTOR;
    cueBallHolder.y = height * CUE_BALL_HOLDER_Y_OFFSET_FACTOR;
    cueBallHolder.radius = ballDim.radiusPx * 1.5; // Holder slightly larger than ball

    // Help button position
    helpButtonArea.size = height * HELP_BUTTON_SIZE_FACTOR;
    helpButtonArea.x = width - (width * HELP_BUTTON_MARGIN_FACTOR) - helpButtonArea.size;
    helpButtonArea.y = height - (height * HELP_BUTTON_MARGIN_FACTOR) - helpButtonArea.size;

    // 2. Initialize Matter.js
    engine = Matter.Engine.create();
    world = engine.world;
    engine.gravity.y = 0; // No gravity as the game is on a flat surface

    // SETUP COLLISION EVENT LISTENER
    Matter.Events.on(engine, 'collisionStart', handleCollisionEvents);

    // 3. Create table elements
    createTableCushions();      // From table.js
    definePocketVisualPositions(); // From table.js
    defineBallSpots();           // From ball.js (calculates spot x,y based on tableLayout)

    // 4. Create cue object
    initializeCueObject(); // From cue.js
    cue.visible = false; //cue will initially not be visible until the cue ball is placed

    // 5. Setup balls based on initial mode
    switchBallSetupMode(currentBallSetupMode); // Initial setup
    playerScore = 0; //reset score on every instance of setup
    cpuScore = 0;

    shotMadeThisTurn = { made: false, continuesBreak: false };
}

function draw() {
    background(227, 219, 197);

    drawTableRailings();   // From table.js
    drawRailingDesigns();  // From table.js
    drawTableSurface();    // From table.js
    drawTableMarkings();   // From table.js (includes spots)
    drawPockets();         // From table.js
    drawCueBallHolder();
    drawAllGameBalls();    // From ball.js
    handleContinuousCueRotation();
    drawScores();
    drawTargetBallIndicator();
    drawDebugModeIndicators(); // From debugTool.js
    drawPlayerTurnIndicator();
    
    if (cueBall && cueBall.status === "onTable" && cue.visible && (currentGameState === GAME_STATE.AIMING || currentGameState === GAME_STATE.PLACING_CUE_BALL) ) { // Allow cue visibility/rotation while placing
        drawGameCue();
        drawPowerIndicator();
    }

    drawHelpButton();

    if (showHelpPopup) {
        drawHelpPopupContents();
    }

    Matter.Engine.update(engine); // Updates Matter.js engine
    // After engine update, check for pocketed balls if balls are moving
    if (currentGameState === GAME_STATE.SHOT_TAKEN) {
        checkAllBallsForPocketing();
        checkIfBallsStoppedMoving(); // function to switch state back to AIMING
    }
}

function drawPowerIndicator() {
    if (!cueBall || !cueBall.body || cue.power <= 0) return;

    push();
    noStroke();
    fill(255, 255, 255, 70); 

    let startX = cueBall.body.position.x + cos(cue.angle) * ballDim.radiusPx * POWER_INDICATOR_START_OFFSET;
    let startY = cueBall.body.position.y + sin(cue.angle) * ballDim.radiusPx * POWER_INDICATOR_START_OFFSET;

    let currentX = startX;
    let currentY = startY;

    // Calculate spacing based on power.
    let spacing = POWER_INDICATOR_BASE_SPACING * pixelScale + (cue.power / MAX_CUE_POWER) * POWER_INDICATOR_SPACING_SCALE_FACTOR * pixelScale;

    for (let i = 0; i < POWER_INDICATOR_DOT_COUNT; i++) {
        let dotSize = lerp(POWER_INDICATOR_DOT_SIZE_START, POWER_INDICATOR_DOT_SIZE_END, i / (POWER_INDICATOR_DOT_COUNT -1));
        dotSize *= pixelScale; // Scale with table

        ellipse(currentX, currentY, dotSize / 2, dotSize / 2); 

        // Move to the next dot position
        currentX += cos(cue.angle) * spacing;
        currentY += sin(cue.angle) * spacing;
    }
    pop();
}

function drawScores() {
    push(); // Isolate drawing transformations and styles

    // --- Scoreboard Background ---
    const scoreBgColor = color(255, 165, 0); // Orange
    const padding = 6 * pixelScale;          // Padding around the text within the background
    const cornerRadius = 2 * pixelScale;      // Rounded corners for the background

    // Calculate text properties first to determine background size
    const textSizePx = height * SCORE_TEXT_SIZE_FACTOR;
    textSize(textSizePx);
    
    // Player 1 (Human) Score
    let player1Text = "Player: " + playerScore;
    let player1TextWidth = textWidth(player1Text);
    let player1RectX = width * SCORE_PLAYER1_X_FACTOR - padding;
    let player1RectY = height * SCORE_PLAYER1_Y_FACTOR - padding;
    let player1RectWidth = player1TextWidth + 2 * padding;
    let player1RectHeight = textSizePx + 2 * padding; // Approximate height based on text size

    // Player 2 (CPU) Score
    let player2Text = "CPU: " + cpuScore;
    let player2TextWidth = textWidth(player2Text); 
    let player2RectX = width * (1 - SCORE_PLAYER1_X_FACTOR) - player2TextWidth - padding; 
    let player2RectY = height * SCORE_PLAYER1_Y_FACTOR - padding;
    let player2RectWidth = player2TextWidth + 2 * padding;
    let player2RectHeight = textSizePx + 2 * padding;

    rectMode(CORNER); // Set rectMode for drawing background rectangles

    // --- Draw Player 1 Score Background ---
    fill(scoreBgColor);
    rect(player1RectX, player1RectY, player1RectWidth, player1RectHeight, cornerRadius);

    // --- Draw Player 2 Score Background ---
    fill(scoreBgColor);
    rect(player2RectX, player2RectY, player2RectWidth, player2RectHeight, cornerRadius);

    // --- Draw Score Text ---
    fill(SCORE_TEXT_COLOR); 
    noStroke(); // Ensure no stroke for text 

    // Player 1 Text
    textAlign(LEFT, TOP);
    text(player1Text, width * SCORE_PLAYER1_X_FACTOR, height * SCORE_PLAYER1_Y_FACTOR);

    // Player 2 Text
    textAlign(RIGHT, TOP);
    text(player2Text, width * (1 - SCORE_PLAYER1_X_FACTOR), height * SCORE_PLAYER1_Y_FACTOR);

    pop(); 
}

function drawPlayerTurnIndicator() {
    if (currentGameState === GAME_STATE.GAME_OVER) return;

    push();
    textSize(height * SCORE_TEXT_SIZE_FACTOR * 0.7);
    fill(0);
    textAlign(CENTER, TOP);
    let turnText = "Turn: " + (currentPlayer === PLAYER_ID.HUMAN ? "Player" : "CPU");
    text(turnText, width / 2, height * SCORE_PLAYER1_Y_FACTOR + (height * SCORE_TEXT_SIZE_FACTOR * 1.0) );
    pop();
}

function drawHelpButton() {
    push();
    fill(CLR_HELP_BUTTON_BG);
    noStroke();
    rectMode(CORNER);
    rect(helpButtonArea.x, helpButtonArea.y, helpButtonArea.size, helpButtonArea.size, helpButtonArea.size * 0.2); // Slightly rounded corners

    fill(CLR_HELP_BUTTON_TEXT);
    textAlign(CENTER, CENTER);
    textSize(helpButtonArea.size * 0.7);
    text("?", helpButtonArea.x + helpButtonArea.size / 2, helpButtonArea.y + helpButtonArea.size / 2);
    pop();
}

function drawHelpPopupContents() {
    push();
    rectMode(CORNER);

    // Popup background
    let popupMargin = width * HELP_POPUP_MARGIN_FACTOR;
    let popupX = popupMargin;
    let popupY = popupMargin;
    let popupWidth = width - 2 * popupMargin;
    let popupHeight = height - 1.5 * popupMargin;

    fill(CLR_HELP_POPUP_BG);
    stroke(CLR_LINE_WHITE); 
    strokeWeight(2);
    rect(popupX, popupY, popupWidth, popupHeight, 20); // Rounded corners for the popup

    // Text content
    fill(CLR_HELP_POPUP_TEXT);
    noStroke();
    textSize(height * HELP_POPUP_TEXT_SIZE_FACTOR);
    textAlign(CENTER, TOP);

    let textCenterX = popupX + popupWidth / 2;
    let textX = popupX + 20;
    let textBlockWidth = popupWidth - 40; // Max width for text wrapping
    let textY = popupY + 20;
    let lineSpacing = height * HELP_POPUP_TEXT_SIZE_FACTOR * 1.5;

    text("--- Snooker Guide ---", textCenterX , textY);
    textY += lineSpacing * 1.5;

    text("Objective:", textCenterX, textY);
    textY += lineSpacing;
    text("Pot red balls, then a colour, then reds again. When all reds are gone, pot colours in order: Yellow (2), Green (3), Brown (4), Blue (5), Pink (6), Black (7).", textX, textY, textBlockWidth); // text wrap
    textY += lineSpacing * 3; // Extra space after wrapped text

    text("Controls:", textCenterX, textY);
    textY += lineSpacing;
    text("- Aim: 'A' (left) / 'D' (right) keys", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- Power: Click and Drag mouse away from cue ball.", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- Shoot: Release mouse button.", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- Place Cue Ball: Drag and drop from holder to 'D' zone.", textCenterX + 20, textY);
    textY += lineSpacing * 1.5;

    text("Keystrokes:", textCenterX, textY);
    textY += lineSpacing;
    text("- '1': Standard Ball Setup", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- '2': Random Reds & Random Colours", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- '3': Only randomise reds", textCenterX + 20, textY);
    textY += lineSpacing;
    text("- 'M': Toggle Force Pot Mode", textCenterX + 20, textY); 
    textY += lineSpacing * 3;

    text("To start the game, please drag the cue ball away from its holder to anywhere within the 'D' zone.", textX, textY, textBlockWidth);
    textY += lineSpacing * 3;

    text("Click outside this box or on the 'X' button to close.", textX, textY, textBlockWidth);
    textY += lineSpacing;

    // Dedicated "Close" button within the popup
    let closeButtonSize = 10 * pixelScale;
    let closeButtonX = popupX + popupWidth - closeButtonSize - 10;
    let closeButtonY = popupY + 10;
    fill(200,0,0,150);
    rect(closeButtonX, closeButtonY, closeButtonSize, closeButtonSize, 5);
    fill(255); textSize(closeButtonSize*0.7); textAlign(CENTER,CENTER);
    text("X", closeButtonX + closeButtonSize/2, closeButtonY + closeButtonSize/2);

    pop();
}

function checkAllBallsForPocketing() {
    const ballsToCheck = [];
    if (cueBall && cueBall.body && cueBall.status === "onTable") ballsToCheck.push(cueBall);
    ballsToCheck.push(...redBalls.filter(b => b.body)); // Only check reds with bodies
    ballsToCheck.push(...colouredBalls.filter(b => b.body)); // Only check coloureds with bodies

    for (let i = ballsToCheck.length - 1; i >= 0; i--) { 
        let ball = ballsToCheck[i];
        if (!ball.body) continue; // Should not happen with filter, but it is a good safeguard

        for (let pocket of pocketPositions) {
            const distSq = (ball.body.position.x - pocket.x) ** 2 + (ball.body.position.y - pocket.y) ** 2;
            // Pocketing condition: ball's center is within pocket's radius
            if (distSq < pocketDim.radiusPx ** 2) {
                console.log(ball.name + " pocketed in " + pocket.label);
                handlePocketedBall(ball);
                break; // Ball can only be pocketed in one pocket per check
            }
        }
    }
}

function handlePocketedBall(ball) {
    Matter.World.remove(world, ball.body);
    ball.body = null;
    let previousTarget = currentTargetBallType;
    let actingPlayer = currentPlayer; // Capture who was playing when this pot happened

    let localShotMadeThisTurn = { made: true, continuesBreak: false };

    if (ball.name === "cueBall") {
        console.log("Cue ball pocketed by", actingPlayer, "! FOUL.");
        if (actingPlayer === PLAYER_ID.HUMAN) {
            playerScore = Math.max(0, playerScore - 4);
        } else { // CPU fouled
            cpuScore = Math.max(0, cpuScore - 4); 
            console.log("CPU fouled with cue ball. Human awarded 4 points (example).");
            playerScore += 4; 
        }
        console.log("Scores - Player:", playerScore, "CPU:", cpuScore);
        returnCueBallToHand();
        ball.isSunk = true;
        // Foul: localShotMadeThisTurn.continuesBreak remains false.
    } else if (ball.name.startsWith("redBall")) {
        const index = redBalls.findIndex(rb => rb === ball);
        if (index > -1) {
            ball.isSunk = true; redBalls.splice(index, 1);
            if (previousTarget === TARGET_BALL.RED) {
                console.log(ball.name + " legally potted by", actingPlayer, ". Reds left:", redBalls.length);
                if (actingPlayer === PLAYER_ID.HUMAN) { playerScore += 1; }
                else { cpuScore += 1; }
                currentTargetBallType = TARGET_BALL.ANY_COLOUR_AFTER_RED;
                localShotMadeThisTurn.continuesBreak = true;
            } else { // Foul
                console.log("FOUL by", actingPlayer, ": Potted RED when target was", previousTarget);
                if (actingPlayer === PLAYER_ID.HUMAN) { 
                    playerScore = Math.max(0, playerScore - 4); 
                    cpuScore += 4; // Opponent gets points
                } else { 
                    cpuScore = Math.max(0, cpuScore - 4); 
                    playerScore += 4; // Opponent gets points
                }
                // localShotMadeThisTurn.continuesBreak remains false.
            }
        }
    } else { // Coloured ball
        const ballTargetName = ball.name.toUpperCase().replace("BALL", "");
        const ballValue = ball.value || 0;

        if (previousTarget === TARGET_BALL.ANY_COLOUR_AFTER_RED || previousTarget === ballTargetName) {
            // Potentially legal pot
            console.log(ball.name + " potted by", actingPlayer, "when target was", previousTarget);
            colouredBallsPottedThisShotCount++;
            if (actingPlayer === PLAYER_ID.HUMAN) { playerScore += ballValue; }
            else { cpuScore += ballValue; }

            if (previousTarget === TARGET_BALL.ANY_COLOUR_AFTER_RED) {
                respawnColouredBall(ball); ball.isSunk = false;
                if (redBalls.length > 0) { currentTargetBallType = TARGET_BALL.RED; }
                else { currentTargetBallType = TARGET_BALL.YELLOW; }
                localShotMadeThisTurn.continuesBreak = true;
            } else { // Potting a colour IN SEQUENCE 
                ball.isSunk = true; // Stays sunk
                const colourSequence = [TARGET_BALL.YELLOW, TARGET_BALL.GREEN, TARGET_BALL.BROWN, TARGET_BALL.BLUE, TARGET_BALL.PINK, TARGET_BALL.BLACK];
                let currentIndexInSequence = colourSequence.indexOf(previousTarget);
                if (currentIndexInSequence !== -1 && currentIndexInSequence < colourSequence.length - 1) {
                    currentTargetBallType = colourSequence[currentIndexInSequence + 1];
                    localShotMadeThisTurn.continuesBreak = true;
                } else if (currentIndexInSequence === colourSequence.length - 1) { // Potted final black
                    currentTargetBallType = null; localShotMadeThisTurn.continuesBreak = false;
                } else { 
                    currentTargetBallType = null; localShotMadeThisTurn.continuesBreak = false;
                }
            }
        } else { // Foul: Potted wrong coloured ball
            console.log("FOUL by", actingPlayer, ": Potted " + ball.name + " when target was " + previousTarget);
            const penalty = Math.max(4, ballValue);
            if (actingPlayer === PLAYER_ID.HUMAN) { 
                playerScore = Math.max(0, playerScore - penalty); 
                cpuScore += penalty; // Opponent gets points
            } else { 
                cpuScore = Math.max(0, cpuScore - penalty); 
                playerScore += penalty; // Opponent gets points
            }
            colouredBallsPottedThisShotCount++; respawnColouredBall(ball); ball.isSunk = false;
            localShotMadeThisTurn.continuesBreak = false;
        }
    }
    shotMadeThisTurn = localShotMadeThisTurn;
    console.log("Scores - Player:", playerScore, "CPU:", cpuScore, ". Provisional Target:", currentTargetBallType, ". Break Continues:", shotMadeThisTurn.continuesBreak);
}

function checkIfBallsStoppedMoving() {
    console.log("--- Entering checkIfBallsStoppedMoving. Current Game State BEFORE check:", currentGameState);
    
    if (currentGameState !== GAME_STATE.SHOT_TAKEN) {
        console.log("Exiting checkIfBallsStoppedMoving because currentGameState is not SHOT_TAKEN. State is:", currentGameState);
        return;
    }

    let allStopped = true;
    const speedThreshold = 0.08;
    const angularSpeedThreshold = 0.05;

    const movingBodiesOnTable = [];
    if (cueBall && cueBall.body) movingBodiesOnTable.push(cueBall.body);
    redBalls.forEach(b => { if (b.body) movingBodiesOnTable.push(b.body); });
    colouredBalls.forEach(b => { if (b.body) movingBodiesOnTable.push(b.body); }); // Only check bodies for movement

    if (movingBodiesOnTable.length === 0) {
        console.log("checkIfBallsStoppedMoving: No moving bodies on table (or table empty of dynamic bodies). Assuming stopped.");
        allStopped = true;
    } else {
        for (const body of movingBodiesOnTable) {
            if (Matter.Vector.magnitude(body.velocity) > speedThreshold || Math.abs(body.angularVelocity) > angularSpeedThreshold) {
                allStopped = false;
                break;
            }
        }
    }

    if (allStopped) {
        console.log("checkIfBallsStoppedMoving: All balls confirmed stopped. Player was:", currentPlayer, "Provisional target was:", currentTargetBallType);

        if (colouredBallsPottedThisShotCount >= 2) {
            console.warn("MISTAKE: Two or more coloured balls potted in one shot!");
            if (shotMadeThisTurn) shotMadeThisTurn.continuesBreak = false; 
        }
        colouredBallsPottedThisShotCount = 0;

        let turnActuallyEnded = true; // Assume turn ends unless logic below says otherwise

        if (shotMadeThisTurn && shotMadeThisTurn.made) {
            if (shotMadeThisTurn.continuesBreak) {
                turnActuallyEnded = false; // Pot was legal and break continues for current player
                console.log("Break continues for current player:", currentPlayer);
            } else {
                console.log("Shot made, but break does not continue (e.g. foul, or end of sequence). Turn ends for:", currentPlayer);
            }
        } else { // No ball was processed by handlePocketedBall (e.g., a clean miss by human, or CPU calculation resulted in no pot)
            console.log("Clean miss or no valid pot processed by handlePocketedBall. Turn ends for:", currentPlayer);
        }

        // If cue ball was pocketed (foul), turn ends for the player who made the shot.
        // Check cueBall.status because returnCueBallToHand() sets it.
        if (cueBall && cueBall.status === "inHand") {
            turnActuallyEnded = true;
            console.log("Cue ball in hand (likely a foul by " + currentPlayer + "). Turn ends.");
        }
        
        if (turnActuallyEnded) {
            console.log("Turn has ended for player:", currentPlayer,". Calling resetTargetBallType and switching player.");
            resetTargetBallType(); // Determine target for the START of the NEXT player's turn.
            switchPlayer();        // Switch to the other player.
        } else {
            // Break continues for the current player.
            // currentTargetBallType should have been correctly set by handlePocketedBall for the ongoing break.
            console.log("Break continues for player:", currentPlayer, ". Target is already set to:", currentTargetBallType);
        }

        shotMadeThisTurn = { made: false, continuesBreak: false }; // Reset for the next physical shot

        // Set next game state based on who is now the currentPlayer and game conditions
        if (currentTargetBallType === null) { 
            currentGameState = GAME_STATE.GAME_OVER;
        } else if (currentPlayer === PLAYER_ID.HUMAN) {
            if (cueBall && cueBall.status === "inHand") {
                currentGameState = GAME_STATE.PLACING_CUE_BALL;
            } else { // Cue ball on table, target exists
                currentGameState = GAME_STATE.AIMING;
            }
        } else { 
            currentGameState = GAME_STATE.CPU_TURN;
            // Trigger CPU's turn logic. This should happen only ONCE per CPU turn start.
            // cpuTakeTurn will manage its own timing (e.g. setTimeout) and then set gameState to SHOT_TAKEN.
            cpuTakeTurn(); 
        }
        
        // Update cue visibility based on new state (typically only for human aiming)
        if (cue) { 
            cue.visible = (currentGameState === GAME_STATE.AIMING || 
                           (currentGameState === GAME_STATE.PLACING_CUE_BALL && currentPlayer === PLAYER_ID.HUMAN && !isDraggingCueBallForPlacement) );
        }
        
        console.log("checkIfBallsStoppedMoving: Exiting. New game state:", currentGameState, "Official target:", currentTargetBallType, "Current Player:", currentPlayer);
    } else {
    }
}

function switchPlayer() {
    if (currentPlayer === PLAYER_ID.HUMAN) {
        currentPlayer = PLAYER_ID.CPU;
    } else {
        currentPlayer = PLAYER_ID.HUMAN;
    }
    console.log("--- Player Switched. Current Player is now:", currentPlayer, "---");
    // When player switches, they might need to place cue ball if previous player fouled with it
    // Or, if it's CPU's turn, it will start its logic.
}

function drawCueBallHolder() {
    push();
    fill(CUE_BALL_HOLDER_BG_COLOR);
    stroke(CUE_BALL_HOLDER_STROKE_COLOR);
    strokeWeight(2);
    ellipseMode(RADIUS);
    ellipse(cueBallHolder.x, cueBallHolder.y, cueBallHolder.radius, cueBallHolder.radius);
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(12 * pixelScale);
    pop();
}

// --- Event Handlers & Mode Switching ---
function switchBallSetupMode(mode) {
    console.log("Switching to ball setup mode: " + mode);
    currentBallSetupMode = mode;
    
    // Clear existing balls from physics world and arrays
    clearAllGameBalls(); // From ball.js
    playerScore = 0; // Reset score when changing modes
    cpuScore = 0;

    // Setup new ball configuration
    if (mode === 1) {
        setupStandardBalls(); // From ball.js 
        if (cueBall) returnCueBallToHand(); // Put it in hand for player to place
    } else if (mode === 2) {
        setupRandomRedsAndColours(); // From ball.js
        if (!cueBall) createAndHandCueBall();
    } else if (mode === 3) {
        setupRandomRedsColoursOnSpots(); // From ball.js 
        if (!cueBall) createAndHandCueBall();
    }

    resetTargetBallType(); // Set initial target after balls are placed for the new mode
    currentGameState = GAME_STATE.PLACING_CUE_BALL;
    if (cue) cue.visible = false; // Cue hidden until ball placed
    isDraggingCueBallForPlacement = false; // Reset drag state
    if (cue.isPoweringUp) cue.isPoweringUp = false; // Reset power up state
    if (cue) cue.power = 0;
    shotMadeThisTurn = { made: false, continuesBreak: false };
}

function keyPressed() {
    if (showHelpPopup) {
        if (keyCode === ESCAPE) {
            showHelpPopup = false;
        }
        return; // Prevent game key actions if help is visible
    }

    if (currentPlayer !== PLAYER_ID.HUMAN && !(key.toLowerCase() === 'm' || key === '1' || key === '2' || key === '3')) {
        return;
    }

    if (key.toLowerCase() === 'a') {
        keyStates['a'] = true;
    } else if (key.toLowerCase() === 'd') {
        keyStates['d'] = true;
    } else if (key.toLowerCase() === 'm') { // Key to toggle force pot mode
        toggleForcePotMode(); // Function from debugTools.js
        return; // Consume 'm' key press
    }

    // Mode switching 
    if (key === '1' || key === '2' || key === '3') {
        if (currentGameState !== GAME_STATE.SHOT_TAKEN) {
            switchBallSetupMode(parseInt(key));
            if (typeof debugForcePotModeActive !== 'undefined' && debugForcePotModeActive) { 
                toggleForcePotMode(); // Turn off debug mode if switching game mode
            }
        } else {
            console.log("Cannot change mode while balls are moving.");
        }
        return;
    }
}

function keyReleased() {
    if (key.toLowerCase() === 'a') {
        keyStates['a'] = false;
    } else if (key.toLowerCase() === 'd') {
        keyStates['d'] = false;
    }
}

function handleContinuousCueRotation() {
    // Only allow rotation if aiming and cue ball is on table
    if (cueBall && cueBall.status === "onTable" && 
       (currentGameState === GAME_STATE.AIMING || (currentGameState === GAME_STATE.PLACING_CUE_BALL && isDraggingCueBallForPlacement === false ) ) ) { // Allow aiming even if ball just placed
        if (keyStates['a']) {
            cue.angle -= CUE_ROTATION_SPEED;
        }
        if (keyStates['d']) {
            cue.angle += CUE_ROTATION_SPEED;
        }

        // Keep angle in 0 to TWO_PI range
        if (cue.angle < 0) cue.angle += TWO_PI;
        cue.angle %= TWO_PI;
    }
}

function mousePressed() {
    // Check for help button click FIRST
    if (mouseX > helpButtonArea.x && mouseX < helpButtonArea.x + helpButtonArea.size &&
        mouseY > helpButtonArea.y && mouseY < helpButtonArea.y + helpButtonArea.size) {
        showHelpPopup = !showHelpPopup;
        return; // Consume click
    }

    // Check for click on the "X" close button IF the popup is visible
    if (showHelpPopup) {
        let popupMargin = width * HELP_POPUP_MARGIN_FACTOR;
        let popupX = popupMargin;
        let popupY = popupMargin;
        let popupWidth = width - 2 * popupMargin;
        // Define close button area 
        let closeButtonSize = 10 * pixelScale;
        let closeButtonX = popupX + popupWidth - closeButtonSize - pixelScale;
        let closeButtonY = popupY + pixelScale;

        if (mouseX > closeButtonX && mouseX < closeButtonX + closeButtonSize &&
            mouseY > closeButtonY && mouseY < closeButtonY + closeButtonSize) {
            showHelpPopup = false; // Close popup
            return; // Consume click
        }
    }

    if (showHelpPopup) {
        let popupMargin = width * HELP_POPUP_MARGIN_FACTOR;
        let popupX = popupMargin;
        let popupY = popupMargin;
        let popupWidth = width - 2 * popupMargin;
        let popupHeight = height - 2 * popupMargin;

        if (!(mouseX > popupX && mouseX < popupX + popupWidth &&
              mouseY > popupY && mouseY < popupY + popupHeight)) {
            // Clicked outside the popup content area (and not on help button itself)
            showHelpPopup = false;
        }
        return;
    }

    // If popup is NOT shown, proceed with normal game mouse press logic:
    if (currentPlayer !== PLAYER_ID.HUMAN && !debugForcePotModeActive) {
         return;
    }
        if (currentPlayer !== PLAYER_ID.HUMAN && !debugForcePotModeActive) { // Allow debug force pot anytime
            return; 
        }

        // Give debug click handler priority
        if (typeof handleDebugForcePotClick === 'function' && handleDebugForcePotClick(mouseX, mouseY)) {
            return; // Click was handled by debug mode, so exit
        }

        if (cueBall && cueBall.status === "inHand" && currentGameState === GAME_STATE.PLACING_CUE_BALL) {
            let distToCueBallInHolder = dist(mouseX, mouseY, cueBallHolder.x, cueBallHolder.y);
            if (distToCueBallInHolder < ballDim.radiusPx) { // Clicked on cue ball in holder
                isDraggingCueBallForPlacement = true;
                return; // Consume mouse press
            }
        }

        // Cue Powering Up - only if cue ball on table and aiming
        if (cueBall && cueBall.status === "onTable" && currentGameState === GAME_STATE.AIMING) {
            // Check if click is near cue ball to initiate shot
            cue.isPoweringUp = true;
            cue.powerDragStart = { x: mouseX, y: mouseY };
            cue.power = 0; // Reset power
            colouredBallsPottedThisShotCount = 0;
        }

        // Ensure debug click handler check is still first
        if (typeof handleDebugForcePotClick === 'function' && handleDebugForcePotClick(mouseX, mouseY)) {
            return; 
        }

        // Check for help button click
        if (mouseX > helpButtonArea.x && mouseX < helpButtonArea.x + helpButtonArea.size &&
            mouseY > helpButtonArea.y && mouseY < helpButtonArea.y + helpButtonArea.size) {
            showHelpPopup = !showHelpPopup; // Toggle visibility
            console.log("Help popup toggled:", showHelpPopup);
            return; // Consume the click if it was on the help button
        }

        if (showHelpPopup) {
            // Define popup dimensions 
            let popupMargin = width * HELP_POPUP_MARGIN_FACTOR;
            let popupX = popupMargin;
            let popupY = popupMargin;
            let popupWidth = width - 2 * popupMargin;
            let popupHeight = height - 2 * popupMargin;

            if (!(mouseX > popupX && mouseX < popupX + popupWidth &&
                mouseY > popupY && mouseY < popupY + popupHeight)) {
                // Clicked outside the popup area
                showHelpPopup = false;
                console.log("Help popup closed by clicking outside.");
            }
            return;
        }
}

function mouseDragged() {
    if (showHelpPopup) return; // Prevent dragging for game actions if help is visible

    if (isDraggingCueBallForPlacement) {
        // Visual update handled by drawSingleBall for cueBall when status is "inHand" and dragging
    } else if (cue.isPoweringUp) {
        let dx = mouseX - cue.powerDragStart.x;
        let dy = mouseY - cue.powerDragStart.y;
        
        // Project mouse movement onto the line opposite to cue angle
        let pullBackVector = p5.Vector.fromAngle(cue.angle + PI); // Points away from ball along cue line
        let dragVector = createVector(dx, dy);

        // Dot product gives projection length
        let projectedLength = 0;
        if (dragVector.magSq() > 0) { // Avoid NaN if dragVector is zero
            projectedLength = dragVector.dot(pullBackVector);
        }

        const powerScaleFactor = 0.02;
        cue.power = constrain(projectedLength * powerScaleFactor, 0, MAX_CUE_POWER);
    }
}

function mouseReleased() {
    if (currentPlayer !== PLAYER_ID.HUMAN && !isDraggingCueBallForPlacement) { // Allow finishing drag if somehow started by human
        return;
    }
    if (isDraggingCueBallForPlacement) {
        isDraggingCueBallForPlacement = false;
        if (isPointInDZone(mouseX, mouseY)) {
            placeCueBallOnTable(mouseX, mouseY); // from ball.js
            currentGameState = GAME_STATE.AIMING;
            cue.angle = 0; // Reset cue angle to point right
        } else {
            // Ball remains in hand, drawSingleBall will draw it in holder
            console.log("Cue ball must be placed in the D zone.");
        }
    } else if (cue.isPoweringUp) {
        cue.isPoweringUp = false;
        if (cue.power > 0 && cueBall && cueBall.body) {
            colouredBallsPottedThisShotCount = 0;
            shotMadeThisTurn = { made: true, continuesBreak: false }; // Assume break ends unless pot extends it
            // Apply force
            let forceMagnitude = cue.power * 0.015; // Adjust scalar for realistic force
            // Force to be applied along the cue's angle
            let forceVector = p5.Vector.fromAngle(cue.angle);
            forceVector.mult(forceMagnitude);

            Matter.Body.applyForce(cueBall.body, cueBall.body.position, { x: forceVector.x, y: forceVector.y });
            
            currentGameState = GAME_STATE.SHOT_TAKEN;
            console.log(`Shot taken with power: ${cue.power.toFixed(2)}, force: ${forceMagnitude.toFixed(4)}`);
        }
        cue.power = 0; // Reset power after shot or if shot aborted
    }
}

function handleCollisionEvents(event) {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        let otherBody = null; // The body colliding with the cue ball

        // Check if one of the bodies is the cue ball
        if (cueBall && cueBall.body && bodyA === cueBall.body) {
            otherBody = bodyB;
        } else if (cueBall && cueBall.body && bodyB === cueBall.body) {
            otherBody = bodyA;
        }

        if (otherBody) {
            // there is a collision involving the cue ball
            const otherLabel = otherBody.label;

            if (otherLabel.startsWith("redBall")) {
                console.log("Cue ball collided with a Red Ball.");
            } else if (otherLabel === "yellowBall" || otherLabel === "greenBall" || otherLabel === "brownBall" ||
                       otherLabel === "blueBall"   || otherLabel === "pinkBall"  || otherLabel === "blackBall") {
                console.log("Cue ball collided with a Coloured Ball (" + otherLabel.replace("Ball", "") + ").");
            } else if (otherLabel === "cushion") {
                console.log("Cue ball collided with a Cushion.");
            }
        }
    }
}

function createAndHandCueBall() {
    // Helper to create a cue ball and set its status to inHand
    // Placed visually in holder initially.
    // The body isn't added to the world yet.
    cueBall = {
        color: CLR_BALLS.WHITE,
        name: "cueBall",
        originalPos: { x: cueBallHolder.x, y: cueBallHolder.y }, // Visual start
        status: "inHand", // Critical status
        isSunk: false
    };
    console.log("Cue ball created and in hand.");
}

function distSquared(x1, y1, x2, y2) {
    return (x2 - x1)**2 + (y2 - y1)**2;
}

function drawTargetBallIndicator() {
    if (currentGameState === GAME_STATE.GAME_OVER || !currentTargetBallType) return;

    push();
    textSize(height * SCORE_TEXT_SIZE_FACTOR * 0.8); // Slightly smaller than score
    fill(0); 
    textAlign(CENTER, TOP);
    let targetText = "Target: " + currentTargetBallType;
    if (currentTargetBallType === TARGET_BALL.ANY_COLOUR_AFTER_RED && nominatedColourAfterRed) {
        targetText = "Target: " + nominatedColourAfterRed;
    } else if (currentTargetBallType === TARGET_BALL.ANY_COLOUR_AFTER_RED) {
        targetText = "Target: Any Colour";
    }
    text(targetText, width / 2, height * SCORE_PLAYER1_Y_FACTOR); // Using SCORE_PLAYER1_Y_FACTOR for y-pos
    pop();
}

function resetTargetBallType() {
    console.log("--- Entering resetTargetBallType ---");
    console.log("State before resetTargetBallType: currentTarget:", currentTargetBallType, "Reds:", redBalls.length, "Player:", currentPlayer);
    colouredBalls.forEach(b => console.log("  ", b.name, "isSunk:", b.isSunk));

    let newTarget = null;

    if (redBalls.length > 0) {
        // If reds are on table, the start of any NEW turn is to target a RED.
        newTarget = TARGET_BALL.RED;
        console.log("resetTargetBallType: Reds on table. Setting target to RED.");
    } else {
        console.log("resetTargetBallType: All reds potted. Determining next colour in sequence.");
        const colourSequence = [TARGET_BALL.YELLOW, TARGET_BALL.GREEN, TARGET_BALL.BROWN, TARGET_BALL.BLUE, TARGET_BALL.PINK, TARGET_BALL.BLACK];
        for (const targetNameInSequence of colourSequence) {
            const ballObject = colouredBalls.find(b => b.name.toUpperCase().startsWith(targetNameInSequence) && !b.isSunk);
            if (ballObject) {
                newTarget = targetNameInSequence;
                break;
            }
        }
        if (!newTarget && currentGameState !== GAME_STATE.GAME_OVER) {
            console.log("resetTargetBallType: All colours appear sunk. GAME OVER.");
            currentGameState = GAME_STATE.GAME_OVER;
        }
        console.log("resetTargetBallType: Endgame sequence determined newTarget:", newTarget);
    }

    currentTargetBallType = newTarget;
    nominatedColourAfterRed = null;

    if (currentTargetBallType) {
        console.log("resetTargetBallType: Official target for start of new turn is now " + currentTargetBallType);
    } else if (currentGameState === GAME_STATE.GAME_OVER) {
        console.log("Game is over, no next target (from resetTargetBallType).");
    }
    console.log("--- Exiting resetTargetBallType ---");
}

function windowResized() {
    console.log("Window resized. Re-initializing simulation.");
    // Remove all matter bodies before re-creating to avoid duplicates if setup adds to existing world
    if (world) Matter.World.clear(world, false); // false to keep engine
    if (engine) Matter.Engine.clear(engine); // Clears the engine (removes world too)
    
    // Re-run setup to recalculate everything based on new window size
    setup();
}