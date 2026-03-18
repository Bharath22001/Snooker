let debugForcePotModeActive = false; // Track whether Force Pot Mode is active

// Toggle Force Pot Mode on/off (press 'M' in-game)
function toggleForcePotMode() {
    debugForcePotModeActive = !debugForcePotModeActive; // Flip debug mode state
    console.log("Debug Force Pot Mode: " + (debugForcePotModeActive ? "ON" : "OFF")); // Log current state
}

// Handle mouse click in Force Pot Mode to simulate potting a ball
function handleDebugForcePotClick(mx, my) {
    if (!debugForcePotModeActive) return false; // If not in debug mode, do nothing

    let clickedBall = null; // Store the closest clicked ball
    let minDistSqToClick = Infinity; // Track smallest distance to mouse click

    // Combine all object balls (colored + red) that have active bodies
    const allObjectBalls = [
        ...colouredBalls.filter(b => b.body),
        ...redBalls.filter(b => b.body)
    ];

    // Find the nearest ball to the mouse click within a valid radius
    for (let ball of allObjectBalls) {
        if (ball.body) {
            let dSq = distSquared(mx, my, ball.body.position.x, ball.body.position.y); // Distance to ball center
            if (dSq < (ballDim.radiusPx * 2) ** 2 && dSq < minDistSqToClick) {
                minDistSqToClick = dSq;
                clickedBall = ball; // Store the closest valid ball
            }
        }
    }

    if (clickedBall) {
        console.log("Debug: Force potting " + clickedBall.name); // Log forced potting

        // --- CRITICAL CHANGE FOR DEBUG TOOL ---
        let originalGameState = currentGameState; // Save current game state (in case we want to revert)
        currentGameState = GAME_STATE.SHOT_TAKEN; // Simulate that a shot was taken
        // --- END CRITICAL CHANGE ---

        let nearestPocket = null; // Closest pocket to the ball
        let minDistSqToPocket = Infinity;

        // Find the nearest pocket to pot into
        for (let pocket of pocketPositions) {
            let dSq = distSquared(clickedBall.body.position.x, clickedBall.body.position.y, pocket.x, pocket.y);
            if (dSq < minDistSqToPocket) {
                minDistSqToPocket = dSq;
                nearestPocket = pocket;
            }
        }

        if (nearestPocket) {
            console.log("   (Simulating pot into " + nearestPocket.label + ")"); // Log simulated pocket
        }

        handlePocketedBall(clickedBall); // Force the ball to be pocketed
        checkIfBallsStoppedMoving(); // Let game logic handle the aftermath

        return true;
    }

    return false; // No valid ball was clicked
}

// Draw a visual indicator on screen when Force Pot Mode is active
function drawDebugModeIndicators() {
    if (debugForcePotModeActive) {
        push(); // Save drawing state
        fill(16, 110, 0); // Dark green fill
        textAlign(CENTER, BOTTOM); // Centered at bottom
        textSize(height * 0.03); // Set text size relative to canvas height
        text("FORCE POT MODE ACTIVE (M to toggle, Click ball to pot)", width / 2, height - 20); // Display mode message
        pop(); // Restore drawing state
    }
}