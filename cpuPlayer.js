const CPU_SHOT_POWER_MIN = 0.008; // Min force factor for CPU shot
const CPU_SHOT_POWER_MAX = 0.015; // Max force factor for CPU shot
const CPU_PLACEMENT_RETRY_LIMIT = 5; // How many times to try placing cue ball if spot is bad

function cpuTakeTurn() {
    console.log("CPU: My turn! Current target:", currentTargetBallType);
    // Disable human cue visibility while CPU is thinking/acting
    if (cue) cue.visible = false;

    // Step 1: If cue ball is in hand, CPU places it.
    if (cueBall && cueBall.status === "inHand") {
        if (!cpuPlaceCueBallInD()) {
            console.error("CPU: Failed to place cue ball after multiple attempts. Ending turn.");
            // This is a fallback - ideally placement should always succeed.
            // Force end of CPU turn, switch back to human.
            currentGameState = GAME_STATE.AIMING; // Or some error state
            switchPlayer(); // Make it human's turn again
            return;
        }
    }

    // Ensure cue ball is actually on table and has a body before proceeding
    if (!cueBall || !cueBall.body || cueBall.status !== "onTable") {
        console.error("CPU: Cue ball not ready for shot. Ending turn.");
        currentGameState = GAME_STATE.AIMING; // Or appropriate state
        switchPlayer();
        return;
    }

    // Step 2: CPU "thinks" - find a shot
    // Using setTimeout to simulate thinking and to allow canvas to redraw 
    console.log("CPU: Thinking...");
    setTimeout(() => {
        const shotDetails = cpuFindBestShot();

        if (shotDetails) {
            console.log("CPU: Found a shot!", shotDetails);
            cpuExecuteShot(shotDetails);
        } else {
            console.log("CPU: Couldn't find a good pot. Playing a simple hit.");
            cpuPlaySimpleSafetyHit(); // Or a random hit
        }
    }, 2500); // Simulate 2.5 seconds of thinking
}

function cpuPlaceCueBallInD() {
    if (!cueBall || cueBall.status !== "inHand") return true; // Already placed or no cue ball

    console.log("CPU: Placing cue ball in D.");
    let placed = false;
    for (let i = 0; i < CPU_PLACEMENT_RETRY_LIMIT; i++) {
        // Try a few standard D positions.
        let placeX = tableLayout.x + RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale;
        let placeY = tableLayout.y + tableLayout.widthPx / 2; // Center of baulk line

        if (i === 1) placeY += RWD_D_RADIUS_INCHES * pixelScale * 0.3;
        if (i === 2) placeY -= RWD_D_RADIUS_INCHES * pixelScale * 0.3;
        if (i === 3) placeX -= RWD_D_RADIUS_INCHES * pixelScale * 0.2; // Deeper inside D arc
        if (i === 4) placeX -= RWD_D_RADIUS_INCHES * pixelScale * 0.2;


        if (isPointInDZone(placeX, placeY) && isPositionClearForCueBall(placeX, placeY)) {
            placeCueBallOnTable(placeX, placeY); 
            console.log("CPU: Placed cue ball at:", placeX.toFixed(1), placeY.toFixed(1));
            placed = true;
            break;
        }
    }
    if (!placed) { // Fallback to any valid point if preferred spots fail
         for (let attempts = 0; attempts < 20; attempts++) { // Try more random spots in D
            let randX = tableLayout.x + random(ballDim.radiusPx, RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale - ballDim.radiusPx);
            let dArcCenterY = tableLayout.y + tableLayout.widthPx / 2;
            let dRadiusVisualPx = RWD_D_RADIUS_INCHES * pixelScale;
            let randY = random(dArcCenterY - dRadiusVisualPx + ballDim.radiusPx, dArcCenterY + dRadiusVisualPx - ballDim.radiusPx);
            if (isPointInDZone(randX,randY) && isPositionClearForCueBall(randX, randY)) {
                placeCueBallOnTable(randX, randY);
                placed = true;
                break;
            }
        }
    }

    return placed;
}

function isPositionClearForCueBall(x, y) {
    // Check if placing cue ball at x,y would overlap significantly with other balls
    const allOtherBalls = [...redBalls, ...colouredBalls];
    for (const ball of allOtherBalls) {
        if (ball.body) { // Only check against balls physically on table
            const distSq = (x - ball.body.position.x) ** 2 + (y - ball.body.position.y) ** 2;
            if (distSq < (ballDim.diameterPx * 0.95) ** 2) { // 0.95 for slight tolerance
                console.log("CPU Placement: Position", x.toFixed(1), y.toFixed(1), "is too close to", ball.name);
                return false; // Too close to another ball
            }
        }
    }
    return true;
}


function cpuFindBestShot() {
    let legalTargets = [];
    if (currentTargetBallType === TARGET_BALL.RED) {
        legalTargets = redBalls.filter(b => b.body && !b.isSunk);
    } else if (currentTargetBallType === TARGET_BALL.ANY_COLOUR_AFTER_RED) {
        legalTargets = colouredBalls.filter(b => b.body && !b.isSunk);
    } else { // Specific colour target
        const targetBall = colouredBalls.find(b => b.body && !b.isSunk && b.name.toUpperCase().startsWith(currentTargetBallType));
        if (targetBall) legalTargets.push(targetBall);
    }

    if (legalTargets.length === 0) {
        console.log("CPU: No legal targets found for", currentTargetBallType);
        return null;
    }

    console.log("CPU: Evaluating shots for targets:", legalTargets.map(t => t.name));

    let possibleShots = [];

    for (const targetBall of legalTargets) {
        if (!targetBall.body) continue; // Should have a body if in legalTargets

        for (const pocket of pocketPositions) {
            // 1. Calculate Ghost Ball position
            // Vector from targetBall to pocket
            let Vtp = createVector(pocket.x - targetBall.body.position.x, pocket.y - targetBall.body.position.y);
            Vtp.normalize();
            // Ghost ball is behind target ball along this line, by one ball diameter
            let ghostBallPos = {
                x: targetBall.body.position.x - Vtp.x * ballDim.diameterPx,
                y: targetBall.body.position.y - Vtp.y * ballDim.diameterPx
            };

            // 2. Check Line of Sight: Target Ball to Pocket (TtoP)
            if (!isPathClear(targetBall.body.position, pocket, [cueBall, ...allBallsExcept(targetBall)])) {
                continue;
            }

            // 3. Check Line of Sight: Cue Ball to Ghost Ball (CtoG)
            if (!isPathClear(cueBall.body.position, ghostBallPos, allBallsExcept(targetBall))) {
                continue;
            }
            
            // If both paths are clear, it's a possible shot
            let shotAngle = atan2(ghostBallPos.y - cueBall.body.position.y, ghostBallPos.x - cueBall.body.position.x);
            let distanceToTarget = dist(cueBall.body.position.x, cueBall.body.position.y, targetBall.body.position.x, targetBall.body.position.y);
            
            possibleShots.push({
                targetBall: targetBall,
                pocket: pocket,
                ghostBallPos: ghostBallPos,
                angle: shotAngle,
                score: 1 / (1 + distanceToTarget) // Inverse distance, higher is better
            });
        }
    }

    if (possibleShots.length === 0) {
        console.log("CPU: No clear potting shots found.");
        return null;
    }

    // Sort shots by score (highest first)
    possibleShots.sort((a, b) => b.score - a.score);
    console.log("CPU: Found", possibleShots.length, "possible shots. Best one:", possibleShots[0].targetBall.name, "to", possibleShots[0].pocket.label);
    return possibleShots[0]; // Return the "best" shot
}

function isPathClear(startPos, endPos, obstructingBalls) {
    // Check if a line segment from startPos to endPos is obstructed by any ball in obstructingBalls
    const sx = startPos.x;
    const sy = startPos.y;
    const ex = endPos.x;
    const ey = endPos.y;

    for (const ball of obstructingBalls) {
        if (!ball || !ball.body) continue; // Skip if no body (e.g. cueBall during placement)

        // Check if ball center is close to the line segment
        let d = distToSegmentSquared(ball.body.position, startPos, endPos);
        if (d < (ballDim.radiusPx * 0.9)**2) { // If distance to line is less than ball radius
            return false;
        }
    }
    return true;
}

// Helper: squared distance from point p to line segment p1-p2
function distToSegmentSquared(p, p1, p2) {
    let l2 = distSquared(p1.x, p1.y, p2.x, p2.y);
    if (l2 === 0) return distSquared(p.x, p.y, p1.x, p1.y);
    let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return distSquared(p.x, p.y, p1.x + t * (p2.x - p1.x), p1.y + t * (p2.y - p1.y));
}


function allBallsExcept(excludedBall) {
    let list = [];
    if (cueBall && cueBall !== excludedBall && cueBall.body) list.push(cueBall);
    redBalls.forEach(b => { if (b !== excludedBall && b.body) list.push(b); });
    colouredBalls.forEach(b => { if (b !== excludedBall && b.body) list.push(b); });
    return list;
}

function cpuExecuteShot(shotDetails) {
    console.log("CPU: Executing shot at", shotDetails.targetBall.name, "to pocket", shotDetails.pocket.label, "angle", degrees(shotDetails.angle).toFixed(1));

    // Aim cue
    cue.angle = shotDetails.angle;

    // Set power 
    let powerFactor = random(CPU_SHOT_POWER_MIN, CPU_SHOT_POWER_MAX);

    // Apply force
    Matter.Body.applyForce(cueBall.body, cueBall.body.position, {
        x: cos(cue.angle) * powerFactor,
        y: sin(cue.angle) * powerFactor
    });

    currentGameState = GAME_STATE.SHOT_TAKEN; // Balls will now move
    shotMadeThisTurn = { made: true, continuesBreak: false }; // Assume break ends unless pot changes this
    console.log("CPU: Shot taken with force factor", powerFactor.toFixed(4));
}

function cpuPlaySimpleSafetyHit() {
    // Fallback if no good pot found. Hit any legal target gently.
    let legalTargets = [];
    if (currentTargetBallType === TARGET_BALL.RED) {
        legalTargets = redBalls.filter(b => b.body && !b.isSunk);
    } else if (currentTargetBallType === TARGET_BALL.ANY_COLOUR_AFTER_RED) {
        legalTargets = colouredBalls.filter(b => b.body && !b.isSunk);
    } else {
        const targetBall = colouredBalls.find(b => b.body && !b.isSunk && b.name.toUpperCase().startsWith(currentTargetBallType));
        if (targetBall) legalTargets.push(targetBall);
    }

    if (legalTargets.length > 0) {
        const ballToHit = legalTargets[0]; // Just pick the first one
        console.log("CPU: Playing safety, hitting", ballToHit.name);
        let angleToHit = atan2(ballToHit.body.position.y - cueBall.body.position.y, ballToHit.body.position.x - cueBall.body.position.x);
        cue.angle = angleToHit;
        let powerFactor = CPU_SHOT_POWER_MIN * 0.5; // Very gentle hit

        Matter.Body.applyForce(cueBall.body, cueBall.body.position, {
            x: cos(cue.angle) * powerFactor,
            y: sin(cue.angle) * powerFactor
        });
        currentGameState = GAME_STATE.SHOT_TAKEN;
        shotMadeThisTurn = { made: true, continuesBreak: false };
    } else {
        console.error("CPU: No legal targets for safety hit either! This shouldn't happen if game isn't over.");
        currentGameState = GAME_STATE.AIMING; // Switch back to human to resolve
        switchPlayer();
    }
}