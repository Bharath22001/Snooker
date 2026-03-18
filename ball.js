// Create a single circular physics ball with specified attributes
function _createSingleBallBody(x, y, colorName, label, isStatic = false) {
    let options = { ...PHYS_BALL_OPTIONS, label: label, isStatic: isStatic }; // Apply shared physics options and custom label/static status
    let body = Matter.Bodies.circle(x, y, ballDim.radiusPx, options); // Create a circular physics body using Matter.js
    Matter.World.add(world, body); // Add the ball body to the Matter.js world
    return body; // Return the created body
}

// Create the cue ball and return its object
function createCueBall(x, y, status = "onTable") {
    let body = _createSingleBallBody(x, y, 'WHITE', "cueBall"); // Use helper to create cue ball body
    return { body: body, color: CLR_BALLS.WHITE, name: "cueBall", originalPos: { x, y }, status: status, isSunk: false }; // Package cue ball data
}

// Create a colored ball (not red or cue) with spot and value
function createColouredBall(spotInfo, color, name, value) {
    let body = _createSingleBallBody(spotInfo.x, spotInfo.y, name.toUpperCase().replace("BALL",""), name); // Create physics body for colored ball
    return { body: body, color: color, name: name, spot: spotInfo, originalPos: { x: spotInfo.x, y: spotInfo.y }, value: value, isSunk: false }; // Return ball object
}

// Create a red ball with a unique ID
function createRedBall(x, y, id) {
    let label = "redBall_" + id; // Unique label for each red ball
    let body = _createSingleBallBody(x, y, 'RED', label); // Create red ball body
    return { body: body, color: CLR_BALLS.RED, name: label, originalPos: { x, y }, value: 1, isSunk: false }; // Return red ball data
}

// Define the fixed positions (spots) for colored balls on the table
function defineBallSpots() {
    const baulkLineX = tableLayout.x + RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale; // Horizontal baulk line X
    const dRadiusPx = RWD_D_RADIUS_INCHES * pixelScale; // Radius of D-zone in px
    const tableMidY = tableLayout.y + tableLayout.widthPx / 2; // Vertical center of table
    const tableCentreX = tableLayout.x + tableLayout.lengthPx / 2; // Horizontal center
    const topCushionEdgeX = tableLayout.x + tableLayout.lengthPx; // Far end of table

    ballSpots = {
        YELLOW: { x: baulkLineX, y: tableMidY + dRadiusPx }, // Bottom of D
        GREEN:  { x: baulkLineX, y: tableMidY - dRadiusPx }, // Top of D
        BROWN:  { x: baulkLineX, y: tableMidY },             // Center of D
        BLUE:   { x: tableCentreX, y: tableMidY },           // Table center
        BLACK:  { x: topCushionEdgeX - RWD_BLACK_SPOT_DIST_FROM_CUSHION_INCHES * pixelScale, y: tableMidY }, // Near far cushion
    };
    ballSpots.PINK = { x: (ballSpots.BLUE.x + ballSpots.BLACK.x) / 2, y: tableMidY }; // Halfway between blue and black
}

// Set up standard ball positions for a proper game start
function setupStandardBalls() {
    clearAllGameBalls(); // Remove existing balls
    defineBallSpots(); // Define standard colored ball spots

    // Add colored balls to their spots
    colouredBalls.push(createColouredBall(ballSpots.YELLOW, CLR_BALLS.YELLOW, "yellowBall", 2));
    colouredBalls.push(createColouredBall(ballSpots.GREEN,  CLR_BALLS.GREEN,  "greenBall",  3));
    colouredBalls.push(createColouredBall(ballSpots.BROWN,  CLR_BALLS.BROWN,  "brownBall",  4));
    colouredBalls.push(createColouredBall(ballSpots.BLUE,   CLR_BALLS.BLUE,   "blueBall",   5));
    colouredBalls.push(createColouredBall(ballSpots.PINK,   CLR_BALLS.PINK,   "pinkBall",   6));
    colouredBalls.push(createColouredBall(ballSpots.BLACK,  CLR_BALLS.BLACK,  "blackBall",  7));

    // Arrange red balls in triangular formation
    const pyramidApexX = ballSpots.PINK.x + ballDim.diameterPx * 1.1;
    const pyramidApexY = tableLayout.y + tableLayout.widthPx / 2;
    let redsPlacedCount = 0;
    const rowSpacingX = ballDim.diameterPx * Math.sqrt(3) / 2 * 1.005;
    const colSpacingY = ballDim.diameterPx * 1.005;

    for (let row = 0; row < 5; row++) {
        const ballsInThisRow = row + 1;
        const currentX = pyramidApexX + row * rowSpacingX;
        const startY = pyramidApexY - (ballsInThisRow - 1) * (colSpacingY / 2);
        for (let i = 0; i < ballsInThisRow; i++) {
            if (redsPlacedCount < NUM_RED_BALLS) {
                const y = startY + i * colSpacingY;
                redBalls.push(createRedBall(currentX, y, redsPlacedCount)); // Add red ball to the pyramid
                redsPlacedCount++;
            }
        }
    }

    // Place cue ball in D-zone
    const defaultCueX = tableLayout.x + RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale;
    const defaultCueY = (tableLayout.y + tableLayout.widthPx / 2) + RWD_D_RADIUS_INCHES * pixelScale * 0.5;
    cueBall = createCueBall(defaultCueX, defaultCueY);
}

// Check if a proposed ball position is valid (not overlapping or out of bounds)
function isPositionValid(x, y, existingBalls) {
    const safetyMargin = ballDim.radiusPx * 1.1;
    if (x < tableLayout.x + safetyMargin || x > tableLayout.x + tableLayout.lengthPx - safetyMargin ||
        y < tableLayout.y + safetyMargin || y > tableLayout.y + tableLayout.widthPx - safetyMargin) {
        return false; // Too close to edges
    }
    for (const ball of existingBalls) {
        if (ball && ball.body) {
            const distSq = (x - ball.body.position.x) ** 2 + (y - ball.body.position.y) ** 2;
            if (distSq < (ballDim.diameterPx * 1.05) ** 2) return false; // Overlapping another ball
        }
    }
    for (const pocket of pocketPositions) {
        const distSq = (x - pocket.x) ** 2 + (y - pocket.y) ** 2;
        if (distSq < (pocketDim.radiusPx + ballDim.radiusPx) ** 2) return false; // Too close to pocket
    }
    return true;
}

// Place colored balls on standard spots, red balls randomly (no overlaps)
function setupRandomRedsColoursOnSpots() {
    clearAllGameBalls();
    defineBallSpots();
    let allPlacedBallsForOverlapCheck = [];

    const colors = ["YELLOW", "GREEN", "BROWN", "BLUE", "PINK", "BLACK"];
    const values = [2, 3, 4, 5, 6, 7];
    for (let i = 0; i < colors.length; i++) {
        const ball = createColouredBall(ballSpots[colors[i]], CLR_BALLS[colors[i]], colors[i].toLowerCase() + "Ball", values[i]);
        colouredBalls.push(ball);
        allPlacedBallsForOverlapCheck.push(ball);
    }

    for (let i = 0; i < NUM_RED_BALLS; i++) {
        let x, y, attempts = 0;
        const maxAttempts = 100;
        do {
            x = random(tableLayout.x + ballDim.radiusPx, tableLayout.x + tableLayout.lengthPx - ballDim.radiusPx);
            y = random(tableLayout.y + ballDim.radiusPx, tableLayout.y + tableLayout.widthPx - ballDim.radiusPx);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Max attempts reached for placing red ball " + i);
                break;
            }
        } while (!isPositionValid(x, y, allPlacedBallsForOverlapCheck));
        if (attempts <= maxAttempts) {
            const red = createRedBall(x, y, i);
            redBalls.push(red);
            allPlacedBallsForOverlapCheck.push(red);
        }
    }
}

// Randomize positions of both red and colored balls
function setupRandomRedsAndColours() {
    clearAllGameBalls();
    let allPlacedBallsForOverlapCheck = [];
    const colourData = [
        { color: CLR_BALLS.YELLOW, name: "yellowBall", value: 2 },
        { color: CLR_BALLS.GREEN,  name: "greenBall",  value: 3 },
        { color: CLR_BALLS.BROWN,  name: "brownBall",  value: 4 },
        { color: CLR_BALLS.BLUE,   name: "blueBall",   value: 5 },
        { color: CLR_BALLS.PINK,   name: "pinkBall",   value: 6 },
        { color: CLR_BALLS.BLACK,  name: "blackBall",  value: 7 },
    ];

    for (const data of colourData) {
        let x, y, attempts = 0;
        const maxAttempts = 100;
        do {
            x = random(tableLayout.x + ballDim.radiusPx, tableLayout.x + tableLayout.lengthPx - ballDim.radiusPx);
            y = random(tableLayout.y + ballDim.radiusPx, tableLayout.y + tableLayout.widthPx - ballDim.radiusPx);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Max attempts reached for placing " + data.name);
                break;
            }
        } while (!isPositionValid(x, y, allPlacedBallsForOverlapCheck));
        if (attempts <= maxAttempts) {
            let body = _createSingleBallBody(x, y, data.name.toUpperCase().replace("BALL",""), data.name);
            const coloured = { body: body, color: data.color, name: data.name, originalPos: { x, y }, value: data.value, isSunk: false, spot: null };
            colouredBalls.push(coloured);
            allPlacedBallsForOverlapCheck.push(coloured);
        }
    }

    for (let i = 0; i < NUM_RED_BALLS; i++) {
        let x, y, attempts = 0;
        const maxAttempts = 100;
        do {
            x = random(tableLayout.x + ballDim.radiusPx, tableLayout.x + tableLayout.lengthPx - ballDim.radiusPx);
            y = random(tableLayout.y + ballDim.radiusPx, tableLayout.y + tableLayout.widthPx - ballDim.radiusPx);
            attempts++;
            if (attempts > maxAttempts) {
                console.warn("Max attempts reached for placing red ball " + i);
                break;
            }
        } while (!isPositionValid(x, y, allPlacedBallsForOverlapCheck));
        if (attempts <= maxAttempts) {
            const red = createRedBall(x, y, i);
            redBalls.push(red);
            allPlacedBallsForOverlapCheck.push(red);
        }
    }
}

// Remove all balls from the world and reset arrays
function clearAllGameBalls() {
    if (cueBall && cueBall.body) {
        Matter.World.remove(world, cueBall.body); 
        cueBall.body = null;
    }
    for (let ball of redBalls) {
        if (ball && ball.body) Matter.World.remove(world, ball.body); 
    }
    redBalls = [];
    for (let ball of colouredBalls) {
        if (ball && ball.body) Matter.World.remove(world, ball.body); 
    }
    colouredBalls = [];
}

// Try to respot a colored ball at its original position if unoccupied
function respawnColouredBall(ballObj) {
    if (!ballObj || !ballObj.spot) {
        console.error("Cannot respawn ball: invalid object or no spot defined.", ballObj);
        return;
    }
    if (ballObj.body) {
        Matter.World.remove(world, ballObj.body);
    }

    let spotIsOccupied = false;
    let targetX = ballObj.spot.x;
    let targetY = ballObj.spot.y;
    let allOtherBalls = [...redBalls, ...colouredBalls.filter(b => b !== ballObj)];
    if(cueBall && cueBall.body && cueBall.status === "onTable") allOtherBalls.push(cueBall);

    for(const otherBall of allOtherBalls) {
        if(otherBall.body) {
            const distSq = (targetX - otherBall.body.position.x)**2 + (targetY - otherBall.body.position.y)**2;
            if (distSq < (ballDim.diameterPx * 0.95)**2) {
                spotIsOccupied = true;
                console.log(ballObj.name + "'s spot is occupied by " + (otherBall.name || "a ball"));
                break;
            }
        }
    }

    if (spotIsOccupied) {
        console.warn(`${ballObj.name}'s spot is occupied. Implement proper re-spotting logic.`);
    }

    ballObj.body = _createSingleBallBody(targetX, targetY, ballObj.name.toUpperCase().replace("BALL",""), ballObj.name);
    ballObj.isSunk = false;
    Matter.Body.setVelocity(ballObj.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(ballObj.body, 0);
    console.log(ballObj.name + " respawned at its spot.");
}

// Check if a point is within the D-zone (used for placing cue ball)
function isPointInDZone(px, py) {
    const baulkLineX = tableLayout.x + RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale;
    const dArcCenterX = baulkLineX;
    const dArcCenterY = tableLayout.y + tableLayout.widthPx / 2;
    const dRadiusPx = RWD_D_RADIUS_INCHES * pixelScale;

    const withinHorizontalDLimit = px >= tableLayout.x && px <= dArcCenterX;
    const distToDArcCenterSq = (px - dArcCenterX) ** 2 + (py - dArcCenterY) ** 2;
    const withinDSemicircle = distToDArcCenterSq <= dRadiusPx ** 2;
    const withinVerticalTableLimit = py >= tableLayout.y && py <= tableLayout.y + tableLayout.widthPx;

    return withinHorizontalDLimit && withinDSemicircle && withinVerticalTableLimit;
}

// Place cue ball at specific coordinates on table
function placeCueBallOnTable(x, y) {
    if (!cueBall) { 
        console.error("placeCueBallOnTable called but cueBall is null!");
        createAndHandCueBall(); 
        return;
    }
    if (cueBall.body) Matter.World.remove(world, cueBall.body);
    cueBall.body = _createSingleBallBody(x, y, 'WHITE', "cueBall");
    cueBall.status = "onTable";
    if(cue) cue.visible = true;
    console.log("Cue ball placed on table at:", x.toFixed(1), y.toFixed(1));
}

// Remove cue ball from table and return it to player hand
function returnCueBallToHand() {
    if (!cueBall) {
        console.error("returnCueBallToHand called but cueBall is null!");
        createAndHandCueBall(); 
    }
    if (cueBall.body) {
        Matter.World.remove(world, cueBall.body);
        cueBall.body = null;
    }
    cueBall.status = "inHand";
    if(cue) cue.visible = false;
    console.log("Cue ball returned to hand.");
}

// Draw a single ball on the canvas
function drawSingleBall(ballObj) {
    if (!ballObj) return;

    let drawX, drawY;
    let ballAngle = 0;

    if (ballObj.name === "cueBall" && ballObj.status === "inHand") {
        if (isDraggingCueBallForPlacement) {
            drawX = mouseX;
            drawY = mouseY;
        } else {
            drawX = cueBallHolder.x;
            drawY = cueBallHolder.y;
        }
        if (isDraggingCueBallForPlacement) {
            if (isPointInDZone(mouseX, mouseY)) {
                stroke(0,255,0,150);
                strokeWeight(3 * pixelScale);
            } else {
                stroke(255,0,0,150);
                strokeWeight(3 * pixelScale);
            }
        } else {
            noStroke();
        }
    } else if (ballObj.body) {
        drawX = ballObj.body.position.x;
        drawY = ballObj.body.position.y;
        ballAngle = ballObj.body.angle;
        noStroke();
    } else return;

    fill(ballObj.color);
    if (ballObj.body) {
        stroke(0);
        strokeWeight(max(1, 0.5 * pixelScale));
    }

    push();
    translate(drawX, drawY);
    rotate(ballAngle);
    ellipse(0, 0, ballDim.radiusPx, ballDim.radiusPx);
    pop();
    noStroke();
}

// Draw all game balls on the canvas
function drawAllGameBalls() {
    ellipseMode(RADIUS); // Use radius mode for drawing
    if (cueBall) drawSingleBall(cueBall);
    for (let ball of redBalls) drawSingleBall(ball);
    for (let ball of colouredBalls) drawSingleBall(ball);
}