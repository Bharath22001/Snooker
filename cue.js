function initializeCueObject() {
    const cueStickLength = ballDim.radiusPx * CUE_LENGTH_BALL_RADIUS_FACTOR;
    const cueStickWidth = ballDim.radiusPx * CUE_WIDTH_BALL_RADIUS_FACTOR;
    // tipPositionFromBallCenter is how far from ball's center the cue's physical tip is
    const tipPositionFromBallCenter = ballDim.radiusPx;

    cue = {
        angle: 0,
        length: cueStickLength,
        width: cueStickWidth,
        tipAlignmentPoint: tipPositionFromBallCenter,
        tipVisualLength: ballDim.radiusPx * CUE_TIP_VISUAL_LENGTH_BALL_RADIUS_FACTOR,
        visible: false, 
        power: 0,
        isPoweringUp: false, 
        powerDragStart: { x:0, y:0 } // Store start of drag for power
    };
}

function drawGameCue() {
    if (!cueBall || !cueBall.body || !cue.visible || cueBall.status !== "onTable") return;

    const cueBallPos = cueBall.body.position;
    push();
    translate(cueBallPos.x, cueBallPos.y);
    rotate(cue.angle);
    rectMode(CORNER); 
    noStroke();

    // Calculate pullback based on power
    let currentPullBack = 0;
    if (cue.isPoweringUp && cue.power > 0) {
        currentPullBack = cue.power * CUE_PULLBACK_VISUAL_FACTOR * pixelScale;
    }

    // The cue extends BACKWARDS from the tipAlignmentPoint
    // tipAlignmentPoint is, e.g., ballRadiusPx along the cue's angle from ball center.
    // Butt of the cue is at tipAlignmentPoint - cue.length

    const cueButtX = cue.tipAlignmentPoint - cue.length - currentPullBack;
    const cueTipPieceEndX  = cue.tipAlignmentPoint - currentPullBack; // Where the very tip of the cue is
    const cueShaftStartY = -cue.width / 2; // To center it vertically

    // Main shaft (wood part)
    fill(CLR_CUE_STICK);
    // Shaft runs from butt up to where the tip piece begins
    rect(cueButtX, cueShaftStartY, cue.length - cue.tipVisualLength, cue.width);

    // Tip part
    fill(CLR_CUE_TIP);
    // Tip piece starts where main shaft ends, and goes up to cueTipEndX
    rect(cueTipPieceEndX  - cue.tipVisualLength, cueShaftStartY, cue.tipVisualLength, cue.width);

    pop();
    rectMode(CENTER); // Reset rect mode
}