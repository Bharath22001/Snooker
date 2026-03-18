function createTableCushions() {
    const wallThickness = 40 * pixelScale;

    // Use Matter.World and Matter.Bodies
    Matter.World.add(world, Matter.Bodies.rectangle(tableLayout.x + tableLayout.lengthPx / 2, tableLayout.y - wallThickness / 2, tableLayout.lengthPx + 2 * wallThickness, wallThickness, PHYS_CUSHION_OPTIONS));
    Matter.World.add(world, Matter.Bodies.rectangle(tableLayout.x + tableLayout.lengthPx / 2, tableLayout.y + tableLayout.widthPx + wallThickness / 2, tableLayout.lengthPx + 2 * wallThickness, wallThickness, PHYS_CUSHION_OPTIONS));
    Matter.World.add(world, Matter.Bodies.rectangle(tableLayout.x - wallThickness / 2, tableLayout.y + tableLayout.widthPx / 2, wallThickness, tableLayout.widthPx + 2 * wallThickness, PHYS_CUSHION_OPTIONS));
    Matter.World.add(world, Matter.Bodies.rectangle(tableLayout.x + tableLayout.lengthPx + wallThickness / 2, tableLayout.y + tableLayout.widthPx / 2, wallThickness, tableLayout.widthPx + 2 * wallThickness, PHYS_CUSHION_OPTIONS));
}

function definePocketVisualPositions() {
    pocketPositions = [];
    pocketPositions.push({ x: tableLayout.x, y: tableLayout.y, label: "pocket_TL" });
    pocketPositions.push({ x: tableLayout.x + tableLayout.lengthPx, y: tableLayout.y, label: "pocket_TR" });
    pocketPositions.push({ x: tableLayout.x, y: tableLayout.y + tableLayout.widthPx, label: "pocket_BL" });
    pocketPositions.push({ x: tableLayout.x + tableLayout.lengthPx, y: tableLayout.y + tableLayout.widthPx, label: "pocket_BR" });
    pocketPositions.push({ x: tableLayout.x + tableLayout.lengthPx / 2, y: tableLayout.y, label: "pocket_TM" });
    pocketPositions.push({ x: tableLayout.x + tableLayout.lengthPx / 2, y: tableLayout.y + tableLayout.widthPx, label: "pocket_BM" });
}

function drawTableRailings() {
    push();
    fill(CLR_RAILING_WOOD);
    noStroke();

    const railThickness = railingThicknessPx;
    const r = railingCornerRadiusPx; // shorthand for radius

    // Define the outer boundary of the entire railing frame
    const outerX = tableLayout.x - railThickness;
    const outerY = tableLayout.y - railThickness;
    const outerWidth = tableLayout.lengthPx + (2 * railThickness);
    const outerHeight = tableLayout.widthPx + (2 * railThickness);

    // 1. Draw the main outer frame as one large rounded rectangle which represents the entire wooden boundary
    rectMode(CORNER);
    rect(outerX, outerY, outerWidth, outerHeight, r); // Apply radius 'r' to all 4 outer corners


    // Top Rail (outer corners top-left, top-right rounded; inner corners bottom-left, bottom-right sharp)
    rect(tableLayout.x, tableLayout.y - railThickness, tableLayout.lengthPx, railThickness, r, r, 0, 0);
    // Bottom Rail (outer corners bottom-left, bottom-right rounded; inner corners top-left, top-right sharp)
    rect(tableLayout.x, tableLayout.y + tableLayout.widthPx, tableLayout.lengthPx, railThickness, 0, 0, r, r);
    // Left Rail (outer corners top-left, bottom-left rounded; inner corners top-right, bottom-right sharp)
    rect(tableLayout.x - railThickness, tableLayout.y, railThickness, tableLayout.widthPx, r, 0, 0, r);
    // Right Rail (outer corners top-right, bottom-right rounded; inner corners top-left, bottom-left sharp)
    rect(tableLayout.x + tableLayout.lengthPx, tableLayout.y, railThickness, tableLayout.widthPx, 0, r, r, 0);

    // Corner Squares
    // Top-left corner square:
    rect(tableLayout.x - railThickness, tableLayout.y - railThickness, railThickness, railThickness, r, 0, 0, 0);
    // Top-right corner square:
    rect(tableLayout.x + tableLayout.lengthPx, tableLayout.y - railThickness, railThickness, railThickness, 0, r, 0, 0);
    // Bottom-left corner square:
    rect(tableLayout.x - railThickness, tableLayout.y + tableLayout.widthPx, railThickness, railThickness, 0, 0, 0, r);
    // Bottom-right corner square:
    rect(tableLayout.x + tableLayout.lengthPx, tableLayout.y + tableLayout.widthPx, railThickness, railThickness, 0, 0, r, 0);

    pop();
}

function drawRailingDesigns() {
    push();
    stroke(CLR_RAILING_BROWN_DETAIL); 
    noFill(); 

    // Define the properties for the wave design
    const waveHeight = railingThicknessPx * 0.1; // How "tall" each wave (amplitude)
    const waveLength = railingThicknessPx * 0.9; // How "wide" the wave
    strokeWeight(max(1, pixelScale * 0.5)); // Thickness of the curvy line

    // --- Design on Long Rails (Top and Bottom) ---
    const railCenterYTop = tableLayout.y - railingThicknessPx / 2;
    const railCenterYBottom = tableLayout.y + tableLayout.widthPx + railingThicknessPx / 2;
    const startX = tableLayout.x + pocketDim.radiusPx; // Start after pocket area
    const endX = tableLayout.x + tableLayout.lengthPx - pocketDim.radiusPx; // End before pocket area
    const railDisplayLength = endX - startX;
    const numWavesLong = Math.floor(railDisplayLength / waveLength);

    // Top Rail Design
    for (let i = 0; i < numWavesLong; i++) {
        let currentX = startX + i * waveLength;
        arc(currentX + waveLength / 2, railCenterYTop, waveLength, waveHeight * 2, 0, PI);
    }

    // Bottom Rail Design
    for (let i = 0; i < numWavesLong; i++) {
        let currentX = startX + i * waveLength;
        arc(currentX + waveLength / 2, railCenterYBottom, waveLength, waveHeight * 2, PI, TWO_PI);
    }


    // --- Design on Short Rails (Left and Right) ---
    const railCenterXLeft = tableLayout.x - railingThicknessPx / 2;
    const railCenterXRight = tableLayout.x + tableLayout.lengthPx + railingThicknessPx / 2;
    const startY = tableLayout.y + pocketDim.radiusPx; // Start after pocket
    const endY = tableLayout.y + tableLayout.widthPx - pocketDim.radiusPx; // End before pocket
    const railDisplayWidth = endY - startY;
    const numWavesShort = Math.floor(railDisplayWidth / waveLength); // Use same wavelength

    // Left Rail Design
    for (let i = 0; i < numWavesShort; i++) {
        let currentY = startY + i * waveLength;
        arc(railCenterXLeft, currentY + waveLength / 2, waveHeight * 2, waveLength, -HALF_PI, HALF_PI);
    }

    // Right Rail Design
    for (let i = 0; i < numWavesShort; i++) {
        let currentY = startY + i * waveLength;
        arc(railCenterXRight, currentY + waveLength / 2, waveHeight * 2, waveLength, HALF_PI, PI + HALF_PI);
    }

    pop();
}

function drawTableSurface() {
    fill(CLR_TABLE_GREEN);
    noStroke();
    rectMode(CORNER);
    rect(tableLayout.x, tableLayout.y, tableLayout.lengthPx, tableLayout.widthPx);
}

function drawTableMarkings() {
    stroke(CLR_LINE_WHITE);
    strokeWeight(max(1, 1.5 * pixelScale));

    const baulkLineX = tableLayout.x + RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES * pixelScale;
    line(baulkLineX, tableLayout.y, baulkLineX, tableLayout.y + tableLayout.widthPx);

    const dArcCenterX = baulkLineX;
    const dArcCenterY = tableLayout.y + tableLayout.widthPx / 2;
    const dRadiusVisualPx = RWD_D_RADIUS_INCHES * pixelScale;

    noFill();
    arc(dArcCenterX, dArcCenterY, dRadiusVisualPx * 2, dRadiusVisualPx * 2, HALF_PI, PI + HALF_PI);

    drawColouredBallSpots();
}

function drawColouredBallSpots() {
    if (!ballSpots) return;

    strokeWeight(max(1, 0.5 * pixelScale));
    fill(200, 200, 200, 100);
    ellipseMode(RADIUS);
    const spotRadius = ballDim.radiusPx * 0.2;

    if (ballSpots.YELLOW) ellipse(ballSpots.YELLOW.x, ballSpots.YELLOW.y, spotRadius, spotRadius);
    if (ballSpots.GREEN) ellipse(ballSpots.GREEN.x, ballSpots.GREEN.y, spotRadius, spotRadius);
    if (ballSpots.BROWN) ellipse(ballSpots.BROWN.x, ballSpots.BROWN.y, spotRadius, spotRadius);
    if (ballSpots.BLUE) ellipse(ballSpots.BLUE.x, ballSpots.BLUE.y, spotRadius, spotRadius);
    if (ballSpots.PINK) ellipse(ballSpots.PINK.x, ballSpots.PINK.y, spotRadius, spotRadius);
    if (ballSpots.BLACK) ellipse(ballSpots.BLACK.x, ballSpots.BLACK.y, spotRadius, spotRadius);
}

function drawPockets() {
    fill(CLR_POCKET_BLACK);
    noStroke();
    ellipseMode(RADIUS);
    for (let p of pocketPositions) {
        ellipse(p.x, p.y, pocketDim.radiusPx, pocketDim.radiusPx);
    }
}