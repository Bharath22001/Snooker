// Real-world dimensions (RWD) 
const RWD_TABLE_LENGTH_INCHES = 144; // 12 ft
const RWD_TABLE_WIDTH_INCHES = 72;   // 6 ft
const RWD_BALL_DIAMETER_INCHES = 72 / 36; 
const RWD_POCKET_DIAMETER_BALL_FACTOR = 1.5; // Pocket is 1.5x ball diameter

const RWD_BAULK_LINE_DIST_FROM_CUSHION_INCHES = 29;
const RWD_D_RADIUS_INCHES = 11.5;
const RWD_BLACK_SPOT_DIST_FROM_CUSHION_INCHES = 12.75;

// Spot distances 
const RWD_PINK_SPOT_DIST_FROM_BLUE_CENTER_FACTOR = 0.5; // Pink is halfway between blue and top cushion if black is on top cushion
const RWD_BLUE_SPOT_ON_CENTER = true; // Blue is on table center

// Cue visual properties
const CUE_LENGTH_BALL_RADIUS_FACTOR = 25; // cue length = ballRadiusPx * factor
const CUE_WIDTH_BALL_RADIUS_FACTOR = 0.4;  // cue width = ballRadiusPx * factor
const CUE_TIP_VISUAL_LENGTH_BALL_RADIUS_FACTOR = 1.5; // Visual length of the cue's tip piece

// Cue Power Indicator
const POWER_INDICATOR_DOT_COUNT = 7;
const POWER_INDICATOR_DOT_SIZE_START = 2.5; // pixels
const POWER_INDICATOR_DOT_SIZE_END = 1;   // pixels (for tapering)
const POWER_INDICATOR_BASE_SPACING = 5;   // pixels (minimum spacing at zero power)
const POWER_INDICATOR_SPACING_SCALE_FACTOR = 15; // How much spacing increases with power
const POWER_INDICATOR_START_OFFSET = 4.5; // Multiplier of ballRadiusPx, offset from cue ball center

// Colourrs (CLR)
const CLR_TABLE_GREEN = [0, 80, 0];
const CLR_POCKET_BLACK = [0, 0, 0];
const CLR_LINE_WHITE = [255, 255, 255];
const CLR_RAILING_WOOD = [205, 170, 125]; // A beige-brown wood colorr 
const CLR_RAILING_BROWN_DETAIL = [139, 69, 19]; //  brown colorr
const RWD_RAILING_THICKNESS_INCHES = 2;
const RWD_RAILING_CORNER_RADIUS_INCHES = 1.5; //radius for corners

const CLR_BALLS = {
    RED: [200, 0, 0],
    YELLOW: [255, 223, 0],
    GREEN: [0, 128, 0],
    BROWN: [139, 69, 19],
    BLUE: [0, 0, 200],
    PINK: [255, 105, 180],
    BLACK: [30, 30, 30],
    WHITE: [250, 250, 250]
};
const CLR_CUE_STICK = [139, 69, 19]; // Brown
const CLR_CUE_TIP = [80, 80, 80];    // Darker brown for tip

// Physics properties
const PHYS_BALL_OPTIONS = {
    restitution: 0.75, // Bounciness
    friction: 0.015,   // Rolling friction against table
    frictionAir: 0.008, // Air resistance (helps slow down)
    density: 0.0015    // Affects mass
};
const PHYS_CUSHION_OPTIONS = {
    isStatic: true,
    restitution: 0.8, // How bouncy cushions are
    friction: 0.1,
    label: "cushion" 
};

// Game setup
const NUM_RED_BALLS = 15;

// Cue Ball Holder
const CUE_BALL_HOLDER_X_OFFSET_FACTOR = 0.1; // % of canvas width from left
const CUE_BALL_HOLDER_Y_OFFSET_FACTOR = 0.9; // % of canvas height from top
const CUE_BALL_HOLDER_BG_COLOR = [50, 50, 50, 150]; // Semi-transparent dark grey
const CUE_BALL_HOLDER_STROKE_COLOR = [200, 200, 200, 150];

// Cue Aiming
const CUE_ROTATION_SPEED = 0.05; // Radians per key press

// Cue Power
const MAX_CUE_POWER = 1.5; // Arbitrary max power value for impulse calculation
const CUE_PULLBACK_VISUAL_FACTOR = 30; // How much cue visually pulls back per unit of power

// Game States
const GAME_STATE = {
    PLACING_CUE_BALL: 'PLACING_CUE_BALL', // Human player placing cue ball
    AIMING: 'AIMING',                     // Human player is aiming
    SHOT_TAKEN: 'SHOT_TAKEN',             // Balls are moving (applies to both human and CPU shot)
    CPU_TURN: 'CPU_TURN',                 // CPU is active, deciding/making its shot
    GAME_OVER: 'GAME_OVER'
};

//Scoreboard
const SCORE_TEXT_SIZE_FACTOR = 0.03; // text size based on the % of canvas height
const SCORE_TEXT_COLOR = [255, 255, 255];
const SCORE_PLAYER1_X_FACTOR = 0.1; // % of canvas width from left for player score
const SCORE_PLAYER1_Y_FACTOR = 0.05; // % of canvas height from top

const TARGET_BALL = {
    RED: 'RED',
    YELLOW: 'YELLOW',
    GREEN: 'GREEN',
    BROWN: 'BROWN',
    BLUE: 'BLUE',
    PINK: 'PINK',
    BLACK: 'BLACK',
    ANY_COLOUR_AFTER_RED: 'ANY_COLOUR_AFTER_RED',
};

const PLAYER_ID = {
    HUMAN: 'HUMAN_PLAYER',
    CPU: 'CPU_PLAYER'
};

//Help button to explain game instructions and keystrokes
const HELP_BUTTON_SIZE_FACTOR = 0.05; // e.g., 5% of canvas height for size
const HELP_BUTTON_MARGIN_FACTOR = 0.03; // e.g., 3% of canvas height/width from edge
const CLR_HELP_BUTTON_BG = [255, 51, 0]; // red
const CLR_HELP_BUTTON_TEXT = [255, 255, 255];
const CLR_HELP_POPUP_BG = [50, 50, 50, 230];    // Dark semi-transparent for popup
const CLR_HELP_POPUP_TEXT = [220, 220, 220];
const HELP_POPUP_TEXT_SIZE_FACTOR = 0.025;
const HELP_POPUP_MARGIN_FACTOR = 0.04; // 4% of canvas width/height for popup margins
