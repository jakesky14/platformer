import Phaser from "phaser";

// ── Tuning ────────────────────────────────────────────────────────────────────
const DASH_VEL      = 580;
const DASH_DURATION = 180;
const DASH_COOLDOWN = 900;
const SHELL_SPEED   = 350;

interface CharStats {
  speed: number;
  jumpVel: number;
  jumpHold: number;
  jumpHoldF: number;
  flutter: boolean;
  float: boolean;    // Peach-style slow descent
}

const CHAR_STATS: Record<string, CharStats> = {
  //              speed  jumpVel  hold  holdF  flutter float
  mario:   { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  luigi:   { speed: 240, jumpVel: -490, jumpHold: 110, jumpHoldF: 30, flutter: false, float: false },
  toad:    { speed: 340, jumpVel: -420, jumpHold:  70, jumpHoldF: 20, flutter: false, float: false },
  yoshi:   { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: true,  float: false },
  peach:   { speed: 220, jumpVel: -420, jumpHold: 100, jumpHoldF: 20, flutter: false, float: true  },
  smg4:    { speed: 260, jumpVel: -430, jumpHold:  95, jumpHoldF: 27, flutter: false, float: false },
  smg3:    { speed: 260, jumpVel: -430, jumpHold:  80, jumpHoldF: 20, flutter: false, float: false },
  toadette:  { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  bob:       { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  bowser:    { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  bowserjr:  { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  wario:     { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  waluigi:   { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  meggy:     { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  tari:      { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  saiko:     { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  boopkins:  { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  melony:    { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  mrpuzzles: { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  mrwpnz:    { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
};

const LEVEL_W    = 1920;
const LEVEL_H    = 720;
const GROUND_TOP = LEVEL_H - 40;

// ── World 1 (Mario's Mysteries house) extended layout ─────────────────────────
const W1_TOTAL_W   = 11000;         // physics + camera bound (extended for war zone)
const W1_CEIL      = 100;
const W1_FL        = GROUND_TOP;    // 680
// main floor door x-positions
const W1_BDOOR_X   = 160;           // bathroom door (leftmost in hall)
const W1_KDOOR_X   = 430;           // kitchen door
// const W1_MAIN_DOOR_X = 565;      // archway removed per user request
// kitchen sub-room (x=2100..3100)
const W1_K_LEFT    = 2100;
const W1_K_RIGHT   = 3100;
const W1_KRETURN_X = 2140;          // exit door inside kitchen
const W1_KSPAWN_X  = 2200;          // spawn x when entering kitchen
const W1_KBACK_X   = W1_KDOOR_X + 40;  // main-floor x after leaving kitchen
// bathroom sub-room (x=3500..4500)
const W1_B_LEFT    = 3500;
const W1_B_RIGHT   = 4500;
const W1_BRETURN_X = 3525;          // exit door inside bathroom
const W1_BSPAWN_X  = 3580;          // spawn x when entering bathroom
const W1_BBACK_X   = W1_BDOOR_X + 40;  // main-floor x after leaving bathroom
// bedroom sub-room (x=4600..5600)
const W1_BROOM_LEFT    = 4600;
const W1_BROOM_RIGHT   = 5600;
const W1_BROOM_RETURN_X = 4625;     // exit door inside bedroom
const W1_BROOM_SPAWN_X  = 4700;     // spawn x when entering bedroom
const W1_BROOM_BACK_X   = 1455;     // main-floor x after leaving bedroom (left of door visual)
// house interior rooms
const W1_BEDROOM_X = 1480;          // bedroom door x — past red chair right edge (1409)
// war painting sub-zone (x=6000..11000) — entered via painting in bedroom
const W1_WAR_LEFT    = 6000;
const W1_WAR_RIGHT   = 11000;
const W1_WAR_RETURN_X = 6025;       // exit door inside war zone
const W1_WAR_SPAWN_X  = 6120;       // spawn x when entering war zone
const W1_WAR_BACK_X   = 4720;       // bedroom x to return to (painting center)
const W1_MEGGY_X         = 9200;    // Meggy NPC center x (WLX+3200)
const W1_SHROOMY_TOWER_X = 10700;   // tower left edge x  (WLX+4700)
// painting position in bedroom (lowered for accessibility)
const W1_WP_CX = 4720;             // painting center x
const W1_WP_TY = GROUND_TOP - 210; // painting top y (470)

const GOOMBA_XS: number[] = [];
const KOOPA_XS:  number[] = [];

// ── Movie theater lobby ───────────────────────────────────────────────────────
const TV_W  = 160;   // ground TV outer frame
const TV_H  = 110;
const TV_SW = 136;   // ground TV screen
const TV_SH = 86;
const HANG_TV_W  = 260;  // hanging TV outer frame (larger)
const HANG_TV_H  = 178;
const HANG_TV_SW = 234;  // hanging TV screen
const HANG_TV_SH = 152;
const TV_STATIC_FRAMES = 8;
const TV_GROUND_Y = GROUND_TOP - TV_H / 2;  // 625

// 7 TVs on the floor + 1 large hanging TV above the middle (index 3).
// Index 0 = blank/off.  Indices 1-7 = flickering static.
const TV_POSITIONS: { x: number; y: number }[] = [
  { x: 120,  y: TV_GROUND_Y }, // 0: blank, closest to player
  { x: 360,  y: TV_GROUND_Y }, // 1: static  → World 1
  { x: 600,  y: TV_GROUND_Y }, // 2: static  → World 2
  { x: 840,  y: TV_GROUND_Y }, // 3: static  → World 3 (middle)
  { x: 1080, y: TV_GROUND_Y }, // 4: static  → World 4
  { x: 1320, y: TV_GROUND_Y }, // 5: static  → World 5
  { x: 1560, y: TV_GROUND_Y }, // 6: static  → World 6
  { x: 840,  y: 210         }, // 7: hanging above index 3 → World 7
];


const CHAR_COLORS: Record<string, { cap: number; shirt: number; pants: number; skin: number }> = {
  mario:   { cap: 0xdd2200, shirt: 0xdd2200, pants: 0x1133cc, skin: 0xffcc88 },
  luigi:   { cap: 0x228822, shirt: 0x228822, pants: 0x1133cc, skin: 0xffcc88 },
  toad:    { cap: 0xff4444, shirt: 0xffffff, pants: 0x4444ff, skin: 0xffeecc },
  yoshi:   { cap: 0xff4444, shirt: 0x44cc44, pants: 0x44cc44, skin: 0xffffff },
  peach:   { cap: 0xff88bb, shirt: 0xffddee, pants: 0xff88bb, skin: 0xffcc88 },
  smg4:    { cap: 0x2244cc, shirt: 0x2244cc, pants: 0x112299, skin: 0xffcc88 },
  smg3:    { cap: 0x8822cc, shirt: 0x8822cc, pants: 0x551199, skin: 0xffcc88 },
  toadette:  { cap: 0xff88cc, shirt: 0xffffff, pants: 0xff44aa, skin: 0xffeecc },
  bob:       { cap: 0x222222, shirt: 0x333333, pants: 0x111111, skin: 0x99bb77 },
  bowser:    { cap: 0x2a7a2a, shirt: 0xddaa00, pants: 0xddaa00, skin: 0xccaa44 },
  bowserjr:  { cap: 0x2a7a2a, shirt: 0x2a7a2a, pants: 0xddaa00, skin: 0xddcc44 },
  wario:     { cap: 0xeecc00, shirt: 0xeecc00, pants: 0x882288, skin: 0xffcc88 },
  waluigi:   { cap: 0x772288, shirt: 0x3311aa, pants: 0x222244, skin: 0xffcc88 },
  meggy:     { cap: 0xcc2200, shirt: 0xffffff, pants: 0x333344, skin: 0xffccaa },
  tari:      { cap: 0x4488ff, shirt: 0x4488ff, pants: 0xccbb88, skin: 0xffcc88 },
  saiko:     { cap: 0xff88cc, shirt: 0xcc9966, pants: 0xcc2233, skin: 0xffddaa },
  boopkins:  { cap: 0x3399cc, shirt: 0x55bb55, pants: 0x55bb55, skin: 0x88ee88 },
  melony:    { cap: 0x33bb55, shirt: 0x222222, pants: 0x222222, skin: 0xeeccaa },
  mrpuzzles: { cap: 0x888888, shirt: 0xffffff, pants: 0x111111, skin: 0xbbbbbb },
  mrwpnz:    { cap: 0x1a1a2a, shirt: 0x1a1a2a, pants: 0x222233, skin: 0x334455 },
};

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyShift!: Phaser.Input.Keyboard.Key;

  private goombas!:   Phaser.Physics.Arcade.Group;
  private koopas!:    Phaser.Physics.Arcade.Group;
  private shells!:    Phaser.Physics.Arcade.Group;
  private mushrooms!: Phaser.Physics.Arcade.StaticGroup;

  private jumpHeld     = false;
  private jumpHeldMs   = 0;
  private isDashing    = false;
  private canDash      = true;
  private dashDir      = 1;
  private character    = "mario";
  private stats!: CharStats;
  private flutterUsed  = false;
  private isFluttering = false;
  private floatActive  = false;
  private floatUsed    = false;
  private floatTimer   = 0;
  private dying           = false;
  private kickImmuneUntil = 0;
  private hp              = 3;
  private maxHp           = 3;
  private invincibleUntil = 0;
  private hpDisplay!: Phaser.GameObjects.Graphics;

  private assistModeActive = false;
  private settingsOpen     = false;
  private settingsObjects: Phaser.GameObjects.GameObject[] = [];
  private dashPending      = false;

  // ── World 9 mystery game state ────────────────────────────────────────────
  private hasPhone          = false;
  private holdingMallet     = false;
  private tomatoSmashed     = false;
  private meatballActive    = false;
  private bathroomUnlocked  = false;
  private bedroomUnlocked   = false;
  private luigiGreeted      = false;
  private boopkinsGreeted   = false;
  private phoneLog: string[] = [];
  private phoneIconObj:      Phaser.GameObjects.Text     | null = null;
  private kitchenSmashOverlay: Phaser.GameObjects.Graphics | null = null;
  private dialogueBg:        Phaser.GameObjects.Graphics | null = null;
  private dialogueText:      Phaser.GameObjects.Text     | null = null;
  private dialogueUntil = 0;
  private personTalkingUntil = 0;
  // Interactive world objects
  private deskPhoneGfx:  Phaser.GameObjects.Graphics | null = null;
  private phoneZLabel:   Phaser.GameObjects.Text     | null = null;
  private meatballZLabel: Phaser.GameObjects.Text    | null = null;
  private boopkinsGfx:   Phaser.GameObjects.Graphics | null = null;
  // Cutscene
  private cutsceneActive = false;
  private cutsceneDone   = false;
  private cutsceneStep   = 0;
  private cutsceneObjs:  Phaser.GameObjects.GameObject[] = [];
  // War zone state
  private warEntered        = false;
  private warCutsceneDone   = false;
  private chrisAlive        = true;
  private swagAlive         = true;
  private warSectionDone    = false;
  private holdingGun        = false;
  private chrisGfx:         Phaser.GameObjects.Graphics | null = null;
  private swagGfx:          Phaser.GameObjects.Graphics | null = null;
  private gunPickupGfx:     Phaser.GameObjects.Graphics | null = null;
  private paintingSmokeTweens: Phaser.Tweens.Tween[] = [];
  private warBarrageActive  = false;
  private shroomyMeatballGfx: Phaser.GameObjects.Graphics | null = null;
  private endingTriggered   = false;
  private guessingActive    = false;
  private guessText         = "";
  private guessTextObj:     Phaser.GameObjects.Text | null = null;
  private guessPromptObjs:  Phaser.GameObjects.GameObject[] = [];
  private guessKeyHandler:  ((e: KeyboardEvent) => void) | null = null;
  private playerBullet:     Phaser.Physics.Arcade.Sprite | null = null;
  private warBuildingWalls: Phaser.Physics.Arcade.StaticGroup | null = null;
  private meggyGfx:         Phaser.GameObjects.Graphics | null = null;
  private shroomyAlive     = true;
  private shroomyGfx:       Phaser.GameObjects.Graphics | null = null;
  private shroomyInspected = false;
  private shroomyZLabel:    Phaser.GameObjects.Text     | null = null;
  private boopkinsRespawned = false;
  private boopkinsKeyGiven       = false;
  private leftBathroomAfterBomb  = false;
  private barrageWarningGfx:  Phaser.GameObjects.Graphics | null = null;
  private barrageWarningText: Phaser.GameObjects.Text | null = null;
  private lastBarrageActive:  boolean | null = null;
  private barrageFlashEvent:  Phaser.Time.TimerEvent | null = null;
  private pipeInspected       = false;
  // Mr. Puzzles + inventory + pipe
  private carrotsSmashed    = false;
  private cucumbersSmashed  = false;
  private carrotSmashOverlay:   Phaser.GameObjects.Graphics | null = null;
  private cucumberSmashOverlay: Phaser.GameObjects.Graphics | null = null;
  private hasPipeBomb      = false;
  private mrPuzzlesGreeted = false;
  private pipeBombUsed     = false;
  private inventoryOpen    = false;
  private inventoryObjs:   Phaser.GameObjects.GameObject[] = [];
  private mrPuzzlesGfx:    Phaser.GameObjects.Graphics | null = null;
  private pipeRevealGfx:   Phaser.GameObjects.Graphics | null = null;
  private pipeZLabel:      Phaser.GameObjects.Text     | null = null;
  private keyX!:           Phaser.Input.Keyboard.Key;
  private phoneLogOpen     = false;
  private phoneLogObjs:    Phaser.GameObjects.GameObject[] = [];

  // Yoshi-specific
  private yoshiStomach: "empty" | "goomba" | "koopa" = "empty";
  private yoshiIndicator: Phaser.GameObjects.Text | null = null;
  private tongue: Phaser.GameObjects.Rectangle | null = null;
  private tongueActive = false;
  private keyZ!: Phaser.Input.Keyboard.Key;

  private tvScreenImages: Phaser.GameObjects.Image[] = [];
  private warpGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private worldId = 0;
  private fromWorld = -1;
  private nearWarpId = -1;
  private warpPromptText: Phaser.GameObjects.Text | null = null;
  private returnTVGroup: Phaser.Physics.Arcade.StaticGroup | null = null;

  constructor() { super("GameScene"); }

  preload() {
    this.textures.remove("marios-mysteries");
    this.load.image("marios-mysteries", "/marios-mysteries.jpg");
  }

  init(data: { character?: string; worldId?: number; fromWorld?: number }) {
    this.character = data?.character ?? "mario";
    this.worldId   = data?.worldId   ?? 0;
    this.fromWorld = data?.fromWorld ?? -1;
    this.stats     = CHAR_STATS[this.character] ?? CHAR_STATS.mario;
    this.maxHp           = this.assistModeActive ? 6 : 3;
    this.dying           = false;
    this.kickImmuneUntil = 0;
    this.hp              = this.maxHp;
    this.invincibleUntil = 0;
    this.yoshiStomach    = "empty";
    this.yoshiIndicator  = null;
    this.tongue          = null;
    this.tongueActive    = false;
    this.floatActive     = false;
    this.floatUsed       = false;
    this.floatTimer      = 0;
    this.nearWarpId      = -1;
    this.warpPromptText  = null;
    this.returnTVGroup   = null;
    // World 9 mystery state persists when inside the house (worldId=9) OR when on the
    // house exterior (worldId=8) after having come from the house (fromWorld=9).
    // It resets only when returning to the theater (worldId=0) or entering World 8 fresh.
    const preserveMysteryState = this.worldId === 9 || (this.worldId === 8 && this.fromWorld === 9);
    if (!preserveMysteryState) {
      this.hasPhone          = false;
      this.holdingMallet     = false;
      this.tomatoSmashed     = false;
      this.carrotsSmashed    = false;
      this.cucumbersSmashed  = false;
      this.meatballActive    = false;
      this.bathroomUnlocked  = false;
      this.bedroomUnlocked   = false;
      this.luigiGreeted      = false;
      this.hasPipeBomb       = false;
      this.mrPuzzlesGreeted  = false;
      this.pipeBombUsed      = false;
      this.boopkinsRespawned = false;
      this.boopkinsKeyGiven  = false;
      this.leftBathroomAfterBomb = false;
      this.pipeInspected     = false;
      this.warEntered      = false;
      this.warCutsceneDone = false;
      this.chrisAlive      = true;
      this.swagAlive       = true;
      this.warSectionDone  = false;
      this.shroomyAlive     = true;
      this.shroomyInspected = false;
      this.warBarrageActive = false;
      this.phoneLog        = [];
    }
    // Cutscene only resets when returning to the theater (World 0)
    if (this.worldId === 0) {
      this.cutsceneDone = false;
    }
    this.phoneIconObj        = null;
    this.kitchenSmashOverlay    = null;
    this.carrotSmashOverlay     = null;
    this.cucumberSmashOverlay   = null;
    this.dialogueBg          = null;
    this.dialogueText        = null;
    this.dialogueUntil       = 0;
    this.personTalkingUntil  = 0;
    this.deskPhoneGfx        = null;
    this.phoneZLabel         = null;
    this.meatballZLabel      = null;
    this.boopkinsGfx         = null;
    this.boopkinsGreeted     = false;
    this.cutsceneActive      = false;
    this.cutsceneStep        = 0;
    this.cutsceneObjs        = [];
    this.inventoryOpen       = false;
    this.inventoryObjs       = [];
    this.mrPuzzlesGfx        = null;
    this.pipeRevealGfx       = null;
    this.pipeZLabel          = null;
    this.phoneLogOpen        = false;
    this.phoneLogObjs        = [];
    this.holdingGun    = false;
    this.chrisGfx      = null;
    this.swagGfx       = null;
    this.gunPickupGfx  = null;
    this.paintingSmokeTweens = [];
    this.playerBullet        = null;
    this.warBuildingWalls    = null;
    this.meggyGfx            = null;
    this.shroomyGfx          = null;
    this.shroomyZLabel       = null;
    this.shroomyMeatballGfx  = null;
    this.barrageWarningGfx   = null;
    this.barrageWarningText  = null;
    this.lastBarrageActive   = null;
    this.barrageFlashEvent   = null;
    this.boopkinsKeyGiven    = false;
    this.endingTriggered     = false;
    this.guessingActive      = false;
    this.guessText           = "";
    this.guessTextObj        = null;
    this.guessPromptObjs     = [];
    if (this.guessKeyHandler) {
      window.removeEventListener("keydown", this.guessKeyHandler);
      this.guessKeyHandler = null;
    }
  }

  // ── create ──────────────────────────────────────────────────────────────────

  create() {
    this.generateTextures();
    const physW = this.worldId === 9 ? W1_TOTAL_W : LEVEL_W;
    this.physics.world.setBounds(0, 0, physW, LEVEL_H);

    if (this.worldId === 0) {
      this.buildBackground();
      this.buildLevel();          // lobby: TVs + warp zones, no flag
    } else {
      this.buildWorldBackground();
      this.buildWorldLevel(); // for worldId 8, calls buildReturnTV() internally
      if (this.worldId !== 8 && this.worldId !== 9) this.buildReturnTV();
    }

    this.buildPlayer();
    this.buildEnemies();
    this.setupEnemyCollisions();
    this.setupInput();
    this.setupCamera();
    this.buildHUD();
    if (this.worldId === 9) {
      this.buildHouseCutscene();
      this.startPaintingSmoke();
      this.setupWarZone();
    }
  }

  // ── Canvas-based texture generation (reliable in create()) ──────────────────

  private makeCanvas(w: number, h: number, fn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    fn(canvas.getContext("2d")!);
    return canvas;
  }

  private css(hex: number) {
    return "#" + hex.toString(16).padStart(6, "0");
  }

  private generateTextures() {
    ["player", "ground-tile", "seat-tile", "tv-blank", "flag", "cloud", "goomba", "koopa", "shell",
     "pipe-body", "pipe-cap", "brick-block", "question-block", "mushroom-item", "puzzlevision",
     "marios-mysteries-cropped"].forEach(k => {
      if (this.textures.exists(k)) this.textures.remove(k);
    });
    for (let f = 0; f < TV_STATIC_FRAMES; f++) {
      const k = `tv-static-${f}`;
      if (this.textures.exists(k)) this.textures.remove(k);
    }
    for (let f = 0; f < 4; f++) {
      const k = `tv-movie-${f}`;
      if (this.textures.exists(k)) this.textures.remove(k);
    }

    if (this.character === "toadette") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Pink pigtail pom-poms
        ctx.fillStyle = "#ff88cc";
        ctx.beginPath(); ctx.arc(4, 12, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(32, 12, 5, 0, Math.PI*2); ctx.fill();
        // Large pink mushroom cap
        ctx.fillStyle = "#ff88cc";
        ctx.beginPath(); ctx.ellipse(18, 10, 16, 11, 0, 0, Math.PI*2); ctx.fill();
        // White spots
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(9, 8, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24, 6, 3, 2.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(18, 17, 2.5, 2, 0, 0, Math.PI*2); ctx.fill();
        // Face
        ctx.fillStyle = "#ffeecc"; ctx.fillRect(10, 17, 16, 9);
        // Pink cheeks
        ctx.fillStyle = "#ff99bb";
        ctx.beginPath(); ctx.arc(11, 22, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, 22, 2, 0, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = "#000"; ctx.fillRect(13, 19, 3, 3); ctx.fillRect(20, 19, 3, 3);
        // White body + pink vest
        ctx.fillStyle = "#ffffff"; ctx.fillRect(5, 26, 26, 8);
        ctx.fillStyle = "#ff88cc";
        ctx.fillRect(5, 26, 4, 8); ctx.fillRect(27, 26, 4, 8);
        ctx.fillRect(9, 26, 18, 2);
        // Pink skirt
        ctx.fillStyle = "#ff44aa"; ctx.fillRect(3, 34, 30, 8);
      }));
    } else if (this.character === "bob") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Dark brown hood (large oval)
        ctx.fillStyle = "#1a0e06";
        ctx.beginPath(); ctx.ellipse(18, 10, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
        // Hood peak
        ctx.beginPath(); ctx.moveTo(13,4); ctx.lineTo(18,0); ctx.lineTo(23,4); ctx.closePath(); ctx.fill();

        // Glowing green eyes
        ctx.fillStyle = "#22ee22";
        ctx.fillRect(10, 8, 5, 5); ctx.fillRect(21, 8, 5, 5);
        ctx.fillStyle = "#88ff88";
        ctx.fillRect(11, 9, 2, 2); ctx.fillRect(22, 9, 2, 2);

        // Red/yellow patterned scarf
        ctx.fillStyle = "#cc3311"; ctx.fillRect(7, 21, 22, 5);
        ctx.fillStyle = "#ffaa22";
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(8 + i*5, 22, 3, 2);
          ctx.fillRect(10 + i*5, 24, 3, 2);
        }

        // Brown cloak (trapezoid)
        ctx.fillStyle = "#5c3d1e";
        ctx.beginPath();
        ctx.moveTo(7,23); ctx.lineTo(29,23); ctx.lineTo(33,38); ctx.lineTo(3,38);
        ctx.closePath(); ctx.fill();

        // X stitches
        ctx.strokeStyle = "#8a6040"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(14,27); ctx.lineTo(18,32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18,27); ctx.lineTo(14,32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(19,27); ctx.lineTo(23,32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(23,27); ctx.lineTo(19,32); ctx.stroke();

        // Blade shapes at sides
        ctx.fillStyle = "#aaaaaa";
        ctx.beginPath(); ctx.moveTo(3,25); ctx.lineTo(0,18); ctx.lineTo(6,27); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(33,25); ctx.lineTo(36,18); ctx.lineTo(30,27); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#eeeeee";
        ctx.fillRect(1, 20, 1, 6); ctx.fillRect(34, 20, 1, 6);

        // Grey wrapped legs
        ctx.fillStyle = "#cccccc";
        ctx.fillRect(7, 38, 7, 4); ctx.fillRect(22, 38, 7, 4);
        ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(7,40); ctx.lineTo(14,40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(22,40); ctx.lineTo(29,40); ctx.stroke();
      }));
    } else if (this.character === "mario" || this.character === "luigi") {
      const isLuigi = this.character === "luigi";
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        const capCol = isLuigi ? "#228822" : "#dd2200";
        ctx.fillStyle = capCol;    ctx.fillRect(4, 0, 28, 8);   // crown
        ctx.fillRect(1, 7, 34, 4);                               // brim
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(7, 9, 22, 13);  // face
        ctx.fillStyle = "#000";    ctx.fillRect(10,12, 4, 4); ctx.fillRect(22,12, 4, 4); // eyes
        ctx.fillStyle = "#333";    ctx.fillRect(7,18, 9, 3); ctx.fillRect(20,18, 9, 3);  // mustache
        ctx.fillStyle = capCol;    ctx.fillRect(7,22, 22, 7);   // shirt
        ctx.fillStyle = "#1133cc"; ctx.fillRect(3,22, 6,10); ctx.fillRect(27,22, 6,10);  // straps
        ctx.fillRect(0, 29, 36, 7);                              // pants
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(4,23, 3, 3); ctx.fillRect(28,23, 3, 3);  // buttons
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(1,36,14, 6); ctx.fillRect(21,36,14, 6);  // boots
      }));
    } else if (this.character === "toad") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#ffffff";                                                        // white cap
        ctx.beginPath(); ctx.ellipse(18,12,17,11,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ee2222";                                                        // red spots
        ctx.beginPath(); ctx.ellipse(9, 9, 5, 4,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25, 8, 4,3.5,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(18,18, 3,2.5,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffeecc"; ctx.fillRect(10,18,16, 9);                            // face
        ctx.fillStyle = "#000";    ctx.fillRect(12,20, 3, 3); ctx.fillRect(21,20, 3, 3); // eyes
        ctx.fillStyle = "#eeeeee"; ctx.fillRect(0,27, 7, 9); ctx.fillRect(29,27, 7, 9);  // white body
        ctx.fillStyle = "#4444ff"; ctx.fillRect(7,27,22, 9);                             // blue vest
        ctx.fillStyle = "#ffdd44"; ctx.fillRect(7,27,22, 2);                             // trim
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(4,36,11, 6); ctx.fillRect(21,36,11, 6);  // boots
      }));
    } else if (this.character === "yoshi") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Red saddle drawn FIRST — body paints over it; only lower-left edge protrudes
        // Left side = Yoshi's back when facing right; sprite flip keeps it on back either way
        ctx.fillStyle = "#dd2222";
        ctx.beginPath(); ctx.ellipse(3,28,11,8,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#33bb33";                                                        // green body
        ctx.beginPath(); ctx.ellipse(18,14,14,13,0,0,Math.PI*2); ctx.fill();
        ctx.fillRect(4,20,28,14);
        ctx.beginPath(); ctx.ellipse(28,18,7,5,0,0,Math.PI*2); ctx.fill();               // snout (right = front)
        ctx.fillStyle = "#ffffff";                                                        // white belly
        ctx.beginPath(); ctx.ellipse(18,24, 9, 8,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffffff";                                                        // eye whites
        ctx.beginPath(); ctx.ellipse(11,10, 5, 5,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24,10, 5, 5,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#000";                                                           // pupils
        ctx.beginPath(); ctx.arc(12,10,2.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23,10,2.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#222222";                                                        // nostrils on green snout
        ctx.beginPath(); ctx.arc(29,14,1.2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(33,14,1.2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#dd5511"; ctx.fillRect(2,34,14, 8); ctx.fillRect(20,34,14, 8);  // boots
        ctx.fillStyle = "#ffcc22"; ctx.fillRect(2,39,14, 3); ctx.fillRect(20,39,14, 3);  // soles
      }));
    } else if (this.character === "peach") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#ffcc00";                                                        // crown
        ctx.fillRect(11,0,14, 4); ctx.fillRect(9,2, 3, 5); ctx.fillRect(16,0, 4, 6); ctx.fillRect(24,2, 3, 5);
        ctx.fillStyle = "#4488ff"; ctx.fillRect(17, 1, 3, 3);                            // blue gem
        ctx.fillStyle = "#ffdd55"; ctx.fillRect(6,5,24,8);                               // hair
        ctx.fillRect(4,9, 6, 7); ctx.fillRect(26,9, 6, 7);                               // side curls
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(9,9,18,12);                              // face
        ctx.fillStyle = "#4488ff"; ctx.fillRect(12,12, 3, 3); ctx.fillRect(21,12, 3, 3); // eyes
        ctx.fillStyle = "#dd4466"; ctx.fillRect(14,18, 8, 2);                            // lips
        ctx.fillStyle = "#ff88bb"; ctx.fillRect(5,21,26, 6);                             // bodice
        ctx.fillStyle = "#4488ff"; ctx.fillRect(15,22, 6, 5);                            // brooch
        ctx.fillStyle = "#ffffff"; ctx.fillRect(5,25,26, 2);                             // trim
        ctx.fillStyle = "#ff88bb"; ctx.fillRect(0,27,36,15);                             // skirt
      }));
    } else if (this.character === "smg4") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#2244cc"; ctx.fillRect(4,0,28,8); ctx.fillRect(1,7,34,4);       // blue cap
        ctx.fillStyle = "#ffffff"; ctx.fillRect(14,1,8,6);                               // S badge bg (white)
        ctx.fillStyle = "#4488ee";                                                        // S shape (light blue)
        ctx.fillRect(14,1,8,2); ctx.fillRect(14,4,8,2); ctx.fillRect(14,6,8,2);          // horiz bars
        ctx.fillRect(14,1,2,3); ctx.fillRect(20,4,2,3);                                  // vert fills
        ctx.fillStyle = "#222200"; ctx.fillRect(6,9,24,4);                               // dark hair
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8,10,20,12);                             // face
        ctx.fillStyle = "#000";    ctx.fillRect(11,13,3,3); ctx.fillRect(22,13,3,3);     // eyes
        ctx.fillStyle = "#333";    ctx.fillRect(10,19,6,2); ctx.fillRect(20,19,6,2);     // mustache
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0,22,36,14);                             // white overalls
        ctx.fillStyle = "#2244cc"; ctx.fillRect(10,22,16,6);                             // blue shirt
        ctx.fillStyle = "#dddddd"; ctx.fillRect(4,22,6,8); ctx.fillRect(26,22,6,8);      // straps
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(5,23,3,3); ctx.fillRect(27,23,3,3);      // buttons
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(1,36,14,6); ctx.fillRect(21,36,14,6);    // boots
      }));
    } else if (this.character === "smg3") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#8822cc"; ctx.fillRect(4,0,28,8); ctx.fillRect(1,7,34,4);       // purple cap
        ctx.fillStyle = "#ffffff"; ctx.fillRect(14,1,8,6);                               // skull bg
        ctx.fillStyle = "#8822cc";                                                        // skull eyes+teeth
        ctx.fillRect(15,2,2,2); ctx.fillRect(19,2,2,2); ctx.fillRect(14,5,8,1);
        ctx.fillStyle = "#111100"; ctx.fillRect(6,9,24,4);                               // dark hair
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8,10,20,12);                             // face
        ctx.fillStyle = "#ff2200"; ctx.fillRect(11,13,4,3); ctx.fillRect(21,13,4,3);     // red eyes
        ctx.fillStyle = "#ff8866"; ctx.fillRect(12,13,2,2); ctx.fillRect(22,13,2,2);     // eye shine
        ctx.fillStyle = "#222"; ctx.fillRect(15,19,6,3);                                 // goatee
        ctx.fillStyle = "#8822cc"; ctx.fillRect(4,22,28,14);                             // purple shirt
        ctx.fillStyle = "#551199"; ctx.fillRect(0,26,36,10);                             // purple pants
        ctx.fillStyle = "#ffffff"; ctx.fillRect(14,23,8,6);                              // chest skull bg
        ctx.fillStyle = "#8822cc";
        ctx.fillRect(15,24,2,2); ctx.fillRect(19,24,2,2); ctx.fillRect(14,27,8,1);      // chest skull
        ctx.fillStyle = "#111111"; ctx.fillRect(1,36,14,6); ctx.fillRect(21,36,14,6);    // black boots
      }));
    } else if (this.character === "bowser") {
      this.textures.addCanvas("player", this.makeCanvas(50, 58, ctx => {
        ctx.scale(50/36, 58/42);
        // Red spiky hair (3 triangles)
        ctx.fillStyle = "#cc1100";
        ctx.beginPath(); ctx.moveTo(8,7); ctx.lineTo(11,1); ctx.lineTo(14,7); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14,6); ctx.lineTo(17,0); ctx.lineTo(20,6); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(20,7); ctx.lineTo(23,1); ctx.lineTo(26,7); ctx.closePath(); ctx.fill();
        // Green scaly head
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(5, 4, 26, 12);
        // Scale dots
        ctx.fillStyle = "#1a5a1a";
        ctx.fillRect(7,5,3,3); ctx.fillRect(15,5,3,3); ctx.fillRect(23,5,3,3);
        ctx.fillRect(11,9,3,2); ctx.fillRect(19,9,3,2);
        // Eyes: white bg, red iris, black pupil
        ctx.fillStyle = "#fff"; ctx.fillRect(9,5,5,5); ctx.fillRect(22,5,5,5);
        ctx.fillStyle = "#ff2200"; ctx.fillRect(10,6,4,4); ctx.fillRect(23,6,4,4);
        ctx.fillStyle = "#000"; ctx.fillRect(11,7,2,2); ctx.fillRect(24,7,2,2);
        // Cream jaw
        ctx.fillStyle = "#ccaa44"; ctx.fillRect(7,12,22,4);
        // Upper fangs
        ctx.fillStyle = "#fff";
        ctx.fillRect(9,10,3,4); ctx.fillRect(14,10,3,4); ctx.fillRect(19,10,3,4); ctx.fillRect(24,10,3,4);
        // Black spiked collar
        ctx.fillStyle = "#222"; ctx.fillRect(2,15,32,5);
        ctx.fillStyle = "#999"; // studs
        ctx.fillRect(4,16,3,3); ctx.fillRect(10,16,3,3); ctx.fillRect(16,16,3,3); ctx.fillRect(22,16,3,3); ctx.fillRect(28,16,3,3);
        // Yellow body
        ctx.fillStyle = "#ddaa00"; ctx.fillRect(0,20,36,14);
        // Cream belly stripes
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8,21,20,3); ctx.fillRect(8,25,20,3);
        // Green shell peek (left side — back when facing right)
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(0,20,9,12);
        ctx.fillStyle = "#ffeeaa"; // shell spines
        ctx.fillRect(1,20,3,4); ctx.fillRect(1,25,3,4); ctx.fillRect(1,30,3,4);
        // Yellow legs
        ctx.fillStyle = "#ddaa00"; ctx.fillRect(2,34,13,8); ctx.fillRect(21,34,13,8);
        // White claws (3 per foot)
        ctx.fillStyle = "#fff";
        ctx.fillRect(3,39,3,3); ctx.fillRect(7,39,3,3); ctx.fillRect(11,39,3,3);
        ctx.fillRect(22,39,3,3); ctx.fillRect(26,39,3,3); ctx.fillRect(30,39,3,3);
      }));
    } else if (this.character === "bowserjr") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // 3 red hair spikes (above head which starts at y=12)
        ctx.fillStyle = "#cc1100";
        ctx.beginPath(); ctx.moveTo(9,12); ctx.lineTo(12,5); ctx.lineTo(15,12); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14,11); ctx.lineTo(18,4); ctx.lineTo(22,11); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(21,12); ctx.lineTo(24,5); ctx.lineTo(27,12); ctx.closePath(); ctx.fill();
        // Green scaly head (y=10 to y=27, connected to body)
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(7,10,22,17);
        ctx.fillStyle = "#1a5a1a";
        ctx.fillRect(9,12,2,2); ctx.fillRect(15,12,2,2); ctx.fillRect(21,12,2,2);
        // Eyes (angry yellow)
        ctx.fillStyle = "#fff"; ctx.fillRect(8,10,4,4); ctx.fillRect(24,10,4,4);
        ctx.fillStyle = "#ddcc00"; ctx.fillRect(9,11,3,3); ctx.fillRect(25,11,3,3);
        ctx.fillStyle = "#000"; ctx.fillRect(10,12,2,2); ctx.fillRect(26,12,2,2);
        ctx.fillRect(8,10,4,1); ctx.fillRect(24,10,4,1); // angry brows
        // Cream jaw + fangs
        ctx.fillStyle = "#ccaa44"; ctx.fillRect(8,21,20,5);
        ctx.fillStyle = "#fff";
        ctx.fillRect(10,19,2,3); ctx.fillRect(14,19,2,3); ctx.fillRect(20,19,2,3); ctx.fillRect(24,19,2,3);
        // Green body (connected to head)
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(9,27,18,12);
        // White bib on body
        ctx.fillStyle = "#ffffff"; ctx.fillRect(10,27,16,11);
        // Bib mouth (big, no eyes)
        ctx.fillStyle = "#cc1100"; ctx.fillRect(10,31,16,6);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(11,31,3,3); ctx.fillRect(15,31,3,3); ctx.fillRect(19,31,3,3); // teeth
        // Yellow shell (left/back)
        ctx.fillStyle = "#ddaa00"; ctx.fillRect(1,26,9,13);
        ctx.fillStyle = "#ffeeaa"; ctx.fillRect(2,26,3,3); ctx.fillRect(2,30,3,3); ctx.fillRect(2,34,3,3);
        // Short legs
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(9,38,8,4); ctx.fillRect(19,38,8,4);
        // Claws
        ctx.fillStyle = "#fff";
        ctx.fillRect(9,40,2,2); ctx.fillRect(13,40,2,2); ctx.fillRect(19,40,2,2); ctx.fillRect(23,40,2,2);
      }));
    } else if (this.character === "wario") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Yellow W-cap
        ctx.fillStyle = "#eecc00"; ctx.fillRect(4,0,28,8); ctx.fillRect(1,7,34,4);
        // Purple W badge
        ctx.fillStyle = "#772288"; ctx.fillRect(13,1,10,6);
        ctx.fillStyle = "#eecc00";
        ctx.fillRect(14,2,2,3); ctx.fillRect(20,2,2,3); ctx.fillRect(16,4,4,2);
        // Wide fat face
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(4,9,28,13);
        // Big orange nose
        ctx.fillStyle = "#ff8844";
        ctx.beginPath(); ctx.arc(18,17,5,0,Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = "#000"; ctx.fillRect(8,12,4,4); ctx.fillRect(24,12,4,4);
        // Thick mustache
        ctx.fillStyle = "#222"; ctx.fillRect(7,20,9,4); ctx.fillRect(20,20,9,4);
        ctx.fillRect(7,12,6,3); ctx.fillRect(23,12,6,3); // angry brows
        // Yellow shirt
        ctx.fillStyle = "#eecc00"; ctx.fillRect(3,22,30,8);
        // Purple overalls
        ctx.fillStyle = "#882288"; ctx.fillRect(0,27,36,11);
        ctx.fillRect(3,22,6,8); ctx.fillRect(27,22,6,8); // straps
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(4,23,3,3); ctx.fillRect(28,23,3,3); // buttons
        // White gloves
        ctx.fillStyle = "#eee";
        ctx.beginPath(); ctx.arc(0,27,5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(36,27,5,0,Math.PI*2); ctx.fill();
        // Dark green boots
        ctx.fillStyle = "#224422"; ctx.fillRect(2,38,13,4); ctx.fillRect(21,38,13,4);
      }));
    } else if (this.character === "waluigi") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Purple cap
        ctx.fillStyle = "#772288"; ctx.fillRect(4,0,28,8); ctx.fillRect(1,7,34,4);
        // Γ badge
        ctx.fillStyle = "#ffffff"; ctx.fillRect(13,1,10,6);
        ctx.fillStyle = "#772288"; ctx.fillRect(14,2,8,2); ctx.fillRect(14,4,4,4);
        // Tall thin face
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8,9,20,15);
        // Pointy nose
        ctx.fillStyle = "#ffaa66";
        ctx.beginPath(); ctx.moveTo(14,16); ctx.lineTo(22,16); ctx.lineTo(18,22); ctx.closePath(); ctx.fill();
        // Eyes
        ctx.fillStyle = "#000"; ctx.fillRect(10,12,3,3); ctx.fillRect(23,12,3,3);
        // Thin mustache (angled up at sides)
        ctx.fillStyle = "#222";
        ctx.fillRect(8,21,7,2); ctx.fillRect(21,21,7,2);
        ctx.fillRect(7,19,3,3); ctx.fillRect(26,19,3,3);
        // Blue shirt
        ctx.fillStyle = "#3311aa"; ctx.fillRect(7,24,22,7);
        // Dark purple overalls
        ctx.fillStyle = "#442266"; ctx.fillRect(1,28,34,10);
        ctx.fillRect(5,24,6,7); ctx.fillRect(25,24,6,7); // straps
        ctx.fillStyle = "#9944cc"; ctx.fillRect(6,25,3,3); ctx.fillRect(26,25,3,3); // buttons
        // White gloves
        ctx.fillStyle = "#eee";
        ctx.beginPath(); ctx.arc(2,28,4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(34,28,4,0,Math.PI*2); ctx.fill();
        // Long orange shoes
        ctx.fillStyle = "#dd6600"; ctx.fillRect(0,38,16,4); ctx.fillRect(20,38,16,4);
      }));
    } else if (this.character === "meggy") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Orange tentacle hair
        ctx.fillStyle = "#ff8800";
        ctx.fillRect(6,2,24,7); ctx.fillRect(4,6,6,8); ctx.fillRect(26,6,6,8);
        // Red cap
        ctx.fillStyle = "#cc2200"; ctx.fillRect(9,0,18,5);
        // Black headphone band + ear cups
        ctx.fillStyle = "#111";
        ctx.fillRect(4,2,28,3); ctx.fillRect(4,1,4,7); ctx.fillRect(28,1,4,7);
        // Skin face
        ctx.fillStyle = "#ffccaa"; ctx.fillRect(10,8,16,10);
        // Eyes: white + orange iris + black pupil
        ctx.fillStyle = "#fff"; ctx.fillRect(12,10,4,4); ctx.fillRect(20,10,4,4);
        ctx.fillStyle = "#ff6600"; ctx.fillRect(13,11,3,3); ctx.fillRect(21,11,3,3);
        ctx.fillStyle = "#000"; ctx.fillRect(13,12,2,2); ctx.fillRect(21,12,2,2);
        // Smile
        ctx.fillStyle = "#cc7766"; ctx.fillRect(16,16,4,1);
        // White t-shirt
        ctx.fillStyle = "#fff"; ctx.fillRect(7,18,22,10);
        // Shirt logo
        ctx.fillStyle = "#222"; ctx.fillRect(13,20,10,6);
        ctx.fillStyle = "#cc2200"; ctx.fillRect(14,21,8,3);
        // Dark grey shorts
        ctx.fillStyle = "#333344"; ctx.fillRect(7,28,22,8);
        // Brown boots
        ctx.fillStyle = "#7b4a2e"; ctx.fillRect(7,36,9,6); ctx.fillRect(20,36,9,6);
        ctx.fillStyle = "#5a3520"; ctx.fillRect(7,36,9,2); ctx.fillRect(20,36,9,2); // boot top
        ctx.fillStyle = "#ffeecc"; // lace dots
        ctx.fillRect(9,38,2,2); ctx.fillRect(13,38,2,2); ctx.fillRect(22,38,2,2); ctx.fillRect(26,38,2,2);
      }));
    } else if (this.character === "tari") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Ahoge drawn first — hair covers base so only curl tip protrudes
        ctx.fillStyle = "#4488ff";
        ctx.fillRect(15, 0, 3, 7);
        ctx.beginPath(); ctx.arc(15, 1, 3, 0, Math.PI * 2); ctx.fill();
        // Blue layered hair
        ctx.fillStyle = "#3366dd";
        ctx.fillRect(6, 5, 24, 6); ctx.fillRect(3, 9, 6, 10); ctx.fillRect(27, 9, 6, 10);
        // Face
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(10, 9, 16, 12);
        // Purple eyes
        ctx.fillStyle = "#7744bb"; ctx.fillRect(12, 12, 4, 4); ctx.fillRect(20, 12, 4, 4);
        ctx.fillStyle = "#000"; ctx.fillRect(12, 12, 2, 2); ctx.fillRect(20, 12, 2, 2);
        // Rosy cheeks
        ctx.fillStyle = "#ffaaaa"; ctx.fillRect(10, 17, 3, 2); ctx.fillRect(23, 17, 3, 2);
        // Blue hoodie
        ctx.fillStyle = "#4488ff"; ctx.fillRect(6, 21, 24, 11);
        // White collar
        ctx.fillStyle = "#ffffff"; ctx.fillRect(14, 21, 8, 4);
        // Dark cuff trim
        ctx.fillStyle = "#2255aa"; ctx.fillRect(6, 29, 4, 3); ctx.fillRect(26, 29, 4, 3);
        // Khaki pants + cargo pockets
        ctx.fillStyle = "#ccbb88"; ctx.fillRect(8, 32, 20, 7);
        ctx.fillStyle = "#bbaa77"; ctx.fillRect(9, 34, 5, 4); ctx.fillRect(22, 34, 5, 4);
        // Teal sandals + straps
        ctx.fillStyle = "#44aacc"; ctx.fillRect(8, 38, 8, 4); ctx.fillRect(20, 38, 8, 4);
        ctx.fillStyle = "#2288aa"; ctx.fillRect(9, 36, 5, 3); ctx.fillRect(22, 36, 5, 3);
      }));
    } else if (this.character === "saiko") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Pink twintail hair
        ctx.fillStyle = "#ff88cc";
        ctx.fillRect(8, 0, 20, 5); ctx.fillRect(3, 3, 5, 18); ctx.fillRect(28, 3, 5, 18);
        // Blonde tips
        ctx.fillStyle = "#ffdd55"; ctx.fillRect(3, 17, 5, 4); ctx.fillRect(28, 17, 5, 4);
        // Red bows
        ctx.fillStyle = "#cc2233";
        ctx.fillRect(3, 2, 4, 3); ctx.fillRect(4, 1, 2, 5);
        ctx.fillRect(29, 2, 4, 3); ctx.fillRect(30, 1, 2, 5);
        // Face
        ctx.fillStyle = "#ffddaa"; ctx.fillRect(10, 4, 16, 12);
        // Purple eyes
        ctx.fillStyle = "#7744bb"; ctx.fillRect(12, 8, 4, 4); ctx.fillRect(20, 8, 4, 4);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(12, 8, 2, 2); ctx.fillRect(20, 8, 2, 2);
        // Smile
        ctx.fillStyle = "#cc8866"; ctx.fillRect(15, 14, 6, 2);
        // Tan bomber jacket
        ctx.fillStyle = "#cc9966"; ctx.fillRect(6, 16, 24, 10);
        ctx.fillStyle = "#ffddaa"; ctx.fillRect(15, 16, 6, 5); // V-collar skin
        ctx.fillStyle = "#aaaaaa"; ctx.fillRect(17, 16, 2, 10); // zipper
        // Red mini skirt
        ctx.fillStyle = "#cc2233"; ctx.fillRect(7, 26, 22, 7);
        // Black socks + white cuff
        ctx.fillStyle = "#111111"; ctx.fillRect(7, 33, 9, 8); ctx.fillRect(20, 33, 9, 8);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(7, 33, 9, 2); ctx.fillRect(20, 33, 9, 2);
        // Grey shoes
        ctx.fillStyle = "#888899"; ctx.fillRect(6, 39, 10, 3); ctx.fillRect(20, 39, 10, 3);
      }));
    } else if (this.character === "boopkins") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Blue mohawk
        ctx.fillStyle = "#3399cc";
        ctx.beginPath(); ctx.moveTo(15, 5); ctx.lineTo(18, 0); ctx.lineTo(21, 5); ctx.closePath(); ctx.fill();
        // Round green body
        ctx.fillStyle = "#55bb55";
        ctx.beginPath(); ctx.ellipse(18, 22, 15, 17, 0, 0, Math.PI * 2); ctx.fill();
        // Light belly
        ctx.fillStyle = "#88ee88";
        ctx.beginPath(); ctx.ellipse(18, 26, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
        // Big white eyes
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(11, 14, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25, 14, 7, 7, 0, 0, Math.PI * 2); ctx.fill();
        // Black pupils
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(11, 14, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, 14, 4, 0, Math.PI * 2); ctx.fill();
        // Eye shine
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(9, 12, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, 12, 1.5, 0, Math.PI * 2); ctx.fill();
        // Wide red mouth
        ctx.fillStyle = "#cc1111";
        ctx.beginPath(); ctx.ellipse(18, 28, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Teeth
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(12, 24, 3, 3); ctx.fillRect(17, 24, 3, 3); ctx.fillRect(22, 24, 3, 3);
        // Stubby fin arms
        ctx.fillStyle = "#44aa44";
        ctx.beginPath(); ctx.moveTo(3,19); ctx.lineTo(0,12); ctx.lineTo(6,21); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(33,19); ctx.lineTo(36,12); ctx.lineTo(30,21); ctx.closePath(); ctx.fill();
        // Small dark shoes
        ctx.fillStyle = "#333333"; ctx.fillRect(8, 37, 8, 5); ctx.fillRect(20, 37, 8, 5);
      }));
    } else if (this.character === "melony") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Long green hair — drawn first so body covers center, sides flow down
        ctx.fillStyle = "#33bb55";
        ctx.fillRect(7, 0, 22, 5);
        ctx.fillRect(3, 3, 6, 30); ctx.fillRect(27, 3, 6, 30);
        // Face
        ctx.fillStyle = "#eeccaa"; ctx.fillRect(10, 3, 16, 13);
        // Red eyes
        ctx.fillStyle = "#cc2222"; ctx.fillRect(12, 7, 4, 3); ctx.fillRect(20, 7, 4, 3);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(12, 7, 2, 1); ctx.fillRect(20, 7, 2, 1);
        // Whisker markings
        ctx.fillStyle = "#442222";
        ctx.fillRect(10, 12, 3, 1); ctx.fillRect(10, 14, 3, 1);
        ctx.fillRect(23, 12, 3, 1); ctx.fillRect(23, 14, 3, 1);
        // Black hoodie dress
        ctx.fillStyle = "#222222"; ctx.fillRect(7, 16, 22, 20);
        // White collar
        ctx.fillStyle = "#ffffff"; ctx.fillRect(15, 16, 6, 3);
        // Watermelon: green rind stripe, red flesh, black seeds
        ctx.fillStyle = "#44dd44"; ctx.fillRect(9, 21, 18, 2);
        ctx.fillStyle = "#dd2233"; ctx.fillRect(9, 23, 18, 8);
        ctx.fillStyle = "#000000";
        ctx.fillRect(13, 25, 2, 2); ctx.fillRect(17, 25, 2, 2); ctx.fillRect(21, 25, 2, 2);
        ctx.fillRect(15, 29, 2, 2); ctx.fillRect(19, 29, 2, 2);
        // Green hem trim
        ctx.fillStyle = "#44bb44"; ctx.fillRect(7, 36, 22, 3);
        // Dark boots
        ctx.fillStyle = "#333333"; ctx.fillRect(7, 35, 9, 7); ctx.fillRect(20, 35, 9, 7);
        ctx.fillStyle = "#555555"; ctx.fillRect(8, 36, 4, 3); ctx.fillRect(21, 36, 4, 3);
      }));
    } else if (this.character === "mrpuzzles") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Antenna rod + ball
        ctx.fillStyle = "#666666"; ctx.fillRect(17, 0, 2, 6);
        ctx.fillStyle = "#ffdd00";
        ctx.beginPath(); ctx.arc(18, 0, 2, 0, Math.PI*2); ctx.fill();
        // TV box head
        ctx.fillStyle = "#888888"; ctx.fillRect(5, 4, 26, 16);
        // Screen
        ctx.fillStyle = "#222222"; ctx.fillRect(7, 6, 22, 12);
        // Eyes on upper screen
        ctx.fillStyle = "#aabbcc";
        ctx.beginPath(); ctx.arc(13, 9, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, 9, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#000"; ctx.fillRect(12, 9, 2, 2); ctx.fillRect(22, 9, 2, 2);
        // Color block mouth at bottom of screen (no second mouth bar)
        ctx.fillStyle = "#ff4444"; ctx.fillRect(7,  13, 6, 5);
        ctx.fillStyle = "#44dd44"; ctx.fillRect(13, 13, 5, 5);
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(18, 13, 5, 5);
        ctx.fillStyle = "#4488ff"; ctx.fillRect(23, 13, 6, 5);
        // Black suit
        ctx.fillStyle = "#111111"; ctx.fillRect(5, 20, 26, 16);
        // White shirt + bow tie
        ctx.fillStyle = "#ffffff"; ctx.fillRect(13, 20, 10, 8);
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.moveTo(14,20); ctx.lineTo(18,23); ctx.lineTo(14,26); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(22,20); ctx.lineTo(18,23); ctx.lineTo(22,26); ctx.closePath(); ctx.fill();
        // Long thin arms
        ctx.fillStyle = "#111"; ctx.fillRect(0, 21, 6, 3); ctx.fillRect(30, 21, 6, 3);
        // Large hands
        ctx.fillStyle = "#333"; ctx.fillRect(0, 18, 5, 8); ctx.fillRect(31, 18, 5, 8);
        // Pants + shoes
        ctx.fillStyle = "#111111"; ctx.fillRect(9, 36, 18, 6);
        ctx.fillStyle = "#000"; ctx.fillRect(8, 39, 9, 3); ctx.fillRect(19, 39, 9, 3);
      }));
    } else if (this.character === "mrwpnz") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Dark helmet body (lower portion)
        ctx.fillStyle = "#1a1a2a"; ctx.fillRect(6, 8, 24, 13);
        ctx.fillStyle = "#111122"; ctx.fillRect(6, 8, 24, 4);
        // Binocular goggles sticking up above helmet
        ctx.fillStyle = "#334455"; ctx.fillRect(8, 0, 6, 10); ctx.fillRect(22, 0, 6, 10);
        ctx.fillStyle = "#223344";
        ctx.beginPath(); ctx.arc(11, 4, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, 4, 4, 0, Math.PI*2); ctx.fill();
        // Goggle lens shine
        ctx.fillStyle = "#4488cc";
        ctx.beginPath(); ctx.arc(10, 2, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(24, 2, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#88bbee";
        ctx.beginPath(); ctx.arc(9, 1, 0.8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, 1, 0.8, 0, Math.PI*2); ctx.fill();
        // Bridge between goggles
        ctx.fillStyle = "#333344"; ctx.fillRect(15, 3, 6, 2);
        // Yellow glowing eyes on face (below goggles)
        ctx.fillStyle = "#ffdd00";
        ctx.beginPath(); ctx.arc(12, 16, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(24, 16, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffff88";
        ctx.beginPath(); ctx.arc(11, 15, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, 15, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath(); ctx.arc(12, 16, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(24, 16, 1.2, 0, Math.PI*2); ctx.fill();
        // Dark jacket + lapels
        ctx.fillStyle = "#1a1a2a"; ctx.fillRect(5, 19, 26, 17);
        ctx.fillStyle = "#333344";
        ctx.beginPath(); ctx.moveTo(5,19); ctx.lineTo(13,19); ctx.lineTo(10,28); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(31,19); ctx.lineTo(23,19); ctx.lineTo(26,28); ctx.closePath(); ctx.fill();
        // Mechanical weapon arm (left)
        ctx.fillStyle = "#334455"; ctx.fillRect(0, 20, 6, 7);
        ctx.fillRect(0, 15, 5, 12);
        ctx.fillStyle = "#556677"; ctx.fillRect(0, 17, 2, 2); ctx.fillRect(0, 22, 2, 2);
        // Weapon arm (right)
        ctx.fillStyle = "#334455"; ctx.fillRect(30, 20, 6, 7);
        ctx.fillRect(31, 15, 5, 12);
        ctx.fillStyle = "#556677"; ctx.fillRect(34, 17, 2, 2); ctx.fillRect(34, 22, 2, 2);
        // Pants + boots
        ctx.fillStyle = "#222233"; ctx.fillRect(9, 36, 18, 6);
        ctx.fillStyle = "#111122"; ctx.fillRect(8, 39, 9, 3); ctx.fillRect(19, 39, 9, 3);
      }));
    } else {
      const c = CHAR_COLORS[this.character] ?? CHAR_COLORS.mario;
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = this.css(c.shirt); ctx.fillRect(4, 0,  28, 22);
        ctx.fillStyle = this.css(c.pants); ctx.fillRect(0, 22, 36, 20);
        ctx.fillStyle = this.css(c.skin);  ctx.fillRect(8, 6,  20, 14);
        ctx.fillStyle = this.css(c.cap);   ctx.fillRect(4, 0,  28,  8);
        ctx.fillStyle = "#000";            ctx.fillRect(12, 9,  4,  4);
                                           ctx.fillRect(20, 9,  4,  4);
      }));
    }

    // Dark carpet floor tile
    this.textures.addCanvas("ground-tile", this.makeCanvas(64, 40, ctx => {
      ctx.fillStyle = "#1e0606"; ctx.fillRect(0, 0, 64, 40);
      ctx.fillStyle = "#2d0a0a"; ctx.fillRect(0, 0, 64, 5);
      ctx.fillStyle = "#160404";
      for (let x = 0; x < 64; x += 8) ctx.fillRect(x, 5, 4, 35);
    }));

    // Cinema seat platform tile (64×16)
    this.textures.addCanvas("seat-tile", this.makeCanvas(64, 16, ctx => {
      ctx.fillStyle = "#162040"; ctx.fillRect(0, 0, 64, 16);
      ctx.fillStyle = "#1e2e58"; ctx.fillRect(0, 0, 64, 5);
      ctx.fillStyle = "#0e1428"; ctx.fillRect(0, 13, 64, 3);
      // Seat outlines
      ctx.fillStyle = "#0a0e1e";
      for (let x = 0; x < 64; x += 22) ctx.fillRect(x, 0, 1, 16);
    }));

    this.textures.addCanvas("flag", this.makeCanvas(50, 120, ctx => {
      ctx.fillStyle = "#888"; ctx.fillRect(6, 0, 6, 120);
      ctx.fillStyle = "#22cc22";
      ctx.beginPath(); ctx.moveTo(12, 10); ctx.lineTo(12, 50); ctx.lineTo(48, 30); ctx.fill();
    }));

    // Blank TV screen (off / standby)
    this.textures.addCanvas("tv-blank", this.makeCanvas(TV_SW, TV_SH, ctx => {
      ctx.fillStyle = "#090909"; ctx.fillRect(0, 0, TV_SW, TV_SH);
    }));

    // TV static noise frames (8 variations of grey/white scanlines)
    for (let f = 0; f < TV_STATIC_FRAMES; f++) {
      this.textures.addCanvas(`tv-static-${f}`, this.makeCanvas(TV_SW, TV_SH, ctx => {
        ctx.fillStyle = "#080808";
        ctx.fillRect(0, 0, TV_SW, TV_SH);
        for (let y = 0; y < TV_SH; y++) {
          const r = Math.random();
          if (r < 0.38) continue;
          const v = Math.floor(r * 210 + 30);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          // Occasionally wider/brighter bar
          const h = Math.random() < 0.15 ? 2 : 1;
          ctx.fillRect(0, y, TV_SW, h);
        }
        // Sparse white sparkles
        ctx.fillStyle = "#ffffff";
        const dots = Math.floor(Math.random() * 18 + 8);
        for (let i = 0; i < dots; i++) {
          ctx.fillRect(
            Math.floor(Math.random() * TV_SW),
            Math.floor(Math.random() * TV_SH),
            Math.random() < 0.4 ? 2 : 1, 1
          );
        }
        // Rolling dark band (varies by frame)
        const bandY = (f / TV_STATIC_FRAMES) * TV_SH;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, bandY, TV_SW, 6);
      }));
    }

    // "Movie" TV frames — 4 simple animated film scenes
    const movieScenes: ((ctx: CanvasRenderingContext2D) => void)[] = [
      ctx => { // blue sky with white cloud
        ctx.fillStyle = "#2255aa"; ctx.fillRect(0, 0, TV_SW, TV_SH);
        ctx.fillStyle = "#4477cc"; ctx.fillRect(0, TV_SH * 0.6 | 0, TV_SW, TV_SH);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.ellipse(60, 24, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(44, 30, 16, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#447733"; ctx.fillRect(0, TV_SH - 24, TV_SW, 24);
      },
      ctx => { // warm sunset
        ctx.fillStyle = "#dd5500"; ctx.fillRect(0, 0, TV_SW, TV_SH * 0.5 | 0);
        ctx.fillStyle = "#aa2200"; ctx.fillRect(0, TV_SH * 0.5 | 0, TV_SW, TV_SH);
        ctx.fillStyle = "#ffdd00";
        ctx.beginPath(); ctx.arc(TV_SW / 2, TV_SH * 0.55 | 0, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, TV_SH - 18, TV_SW, 18);
      },
      ctx => { // dark action flash
        ctx.fillStyle = "#110011"; ctx.fillRect(0, 0, TV_SW, TV_SH);
        ctx.fillStyle = "#cc3300";
        ctx.fillRect(0, TV_SH * 0.3 | 0, TV_SW, 3);
        ctx.fillRect(0, TV_SH * 0.6 | 0, TV_SW, 2);
        ctx.fillStyle = "rgba(255,100,0,0.18)"; ctx.fillRect(30, 10, 76, TV_SH - 20);
        ctx.fillStyle = "#ffaa00"; ctx.fillRect(TV_SW / 2 - 2, 0, 4, TV_SH);
      },
      ctx => { // close-up face (simple shapes)
        ctx.fillStyle = "#221100"; ctx.fillRect(0, 0, TV_SW, TV_SH);
        ctx.fillStyle = "#cc9966";
        ctx.beginPath(); ctx.ellipse(TV_SW / 2, TV_SH * 0.45 | 0, 36, 40, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000";
        ctx.fillRect(TV_SW / 2 - 20, TV_SH * 0.35 | 0, 8, 6);
        ctx.fillRect(TV_SW / 2 + 12, TV_SH * 0.35 | 0, 8, 6);
        ctx.fillStyle = "#cc4422";
        ctx.fillRect(TV_SW / 2 - 12, TV_SH * 0.55 | 0, 24, 4);
      },
    ];
    for (let f = 0; f < 4; f++) {
      this.textures.addCanvas(`tv-movie-${f}`, this.makeCanvas(TV_SW, TV_SH, movieScenes[f]));
    }

    // Puzzlevision logo for hanging TV (HANG_TV_SW × HANG_TV_SH)
    this.textures.addCanvas("puzzlevision", this.makeCanvas(HANG_TV_SW, HANG_TV_SH, ctx => {
      const cx = HANG_TV_SW / 2;
      // Dark background
      ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, HANG_TV_SW, HANG_TV_SH);
      // Subtle radial glow
      const grd = ctx.createRadialGradient(cx, 60, 5, cx, 60, 90);
      grd.addColorStop(0, "rgba(200,200,220,0.12)");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, HANG_TV_SW, HANG_TV_SH);

      // ── Retro TV body ──────────────────────────────────────────────────────
      const tvX = cx - 28, tvY = 6, tvW = 56, tvH = 40;
      // Silver body
      const bodyGrd = ctx.createLinearGradient(tvX, tvY, tvX, tvY + tvH);
      bodyGrd.addColorStop(0, "#c8c8cc"); bodyGrd.addColorStop(1, "#888890");
      ctx.fillStyle = bodyGrd;
      ctx.beginPath(); (ctx as CanvasRenderingContext2D & { roundRect: (x:number,y:number,w:number,h:number,r:number)=>void }).roundRect(tvX, tvY, tvW, tvH, 5); ctx.fill();
      // Screen area
      ctx.fillStyle = "#1a1a2a"; ctx.fillRect(tvX + 5, tvY + 4, tvW - 10, tvH - 14);
      // Screen glow — tiny scanlines
      for (let sy = tvY + 5; sy < tvY + tvH - 10; sy += 3) {
        ctx.fillStyle = `rgba(80,80,120,${sy % 6 === 0 ? 0.18 : 0.06})`;
        ctx.fillRect(tvX + 5, sy, tvW - 10, 1);
      }
      // Channel knobs (right side)
      ctx.fillStyle = "#777788";
      ctx.beginPath(); ctx.arc(tvX + tvW - 5, tvY + 14, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(tvX + tvW - 5, tvY + 26, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#999"; ctx.beginPath(); ctx.arc(tvX + tvW - 5, tvY + 14, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#999"; ctx.beginPath(); ctx.arc(tvX + tvW - 5, tvY + 26, 2, 0, Math.PI * 2); ctx.fill();
      // Antennas
      ctx.strokeStyle = "#aaaaaa"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 8, tvY); ctx.lineTo(cx - 22, tvY - 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 8, tvY); ctx.lineTo(cx + 22, tvY - 16); ctx.stroke();
      ctx.fillStyle = "#bbbbbb";
      ctx.beginPath(); ctx.arc(cx - 22, tvY - 16, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 22, tvY - 16, 3.5, 0, Math.PI * 2); ctx.fill();
      // Neck & base
      ctx.fillStyle = "#888890";
      ctx.fillRect(cx - 5, tvY + tvH, 10, 5);
      ctx.fillRect(cx - 14, tvY + tvH + 5, 28, 4);

      // ── Bow tie ────────────────────────────────────────────────────────────
      const bty = tvY + tvH + 16;
      const bowGrd = ctx.createLinearGradient(cx - 20, bty, cx + 20, bty);
      bowGrd.addColorStop(0, "#a8a8b0"); bowGrd.addColorStop(0.5, "#d0d0d8"); bowGrd.addColorStop(1, "#a8a8b0");
      ctx.fillStyle = bowGrd;
      ctx.beginPath(); ctx.moveTo(cx - 20, bty - 8); ctx.lineTo(cx - 2, bty); ctx.lineTo(cx - 20, bty + 8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 20, bty - 8); ctx.lineTo(cx + 2, bty); ctx.lineTo(cx + 20, bty + 8); ctx.closePath(); ctx.fill();
      // Knot
      ctx.fillStyle = "#c0c0c8";
      ctx.beginPath(); ctx.ellipse(cx, bty, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d8d8e0";
      ctx.beginPath(); ctx.ellipse(cx - 1, bty - 1, 2.5, 3, 0, 0, Math.PI * 2); ctx.fill();

      // ── Text ───────────────────────────────────────────────────────────────
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      // "A"
      ctx.fillStyle = "#aaaaaa"; ctx.font = "italic bold 9px serif";
      ctx.fillText("A", cx, bty + 13);
      // "PUZZLEVISION"
      ctx.font = "bold 20px sans-serif";
      const textGrd = ctx.createLinearGradient(cx - 70, 0, cx + 70, 0);
      textGrd.addColorStop(0, "#c0c0c8"); textGrd.addColorStop(0.5, "#e8e8f0"); textGrd.addColorStop(1, "#c0c0c8");
      ctx.fillStyle = textGrd;
      ctx.fillText("PUZZLEVISION", cx, bty + 24);
      // "ORIGINAL"
      ctx.font = "9px sans-serif"; ctx.fillStyle = "#888890";
      ctx.fillText("ORIGINAL", cx, bty + 46);
    }));

    // Goomba 32×28
    this.textures.addCanvas("goomba", this.makeCanvas(32, 28, ctx => {
      ctx.fillStyle = "#8B4513"; ctx.fillRect(2, 10, 28, 18);
      ctx.fillStyle = "#6B2F0F"; ctx.fillRect(4, 0, 24, 14);
      ctx.fillStyle = "#fff"; ctx.fillRect(6, 3, 6, 6); ctx.fillRect(20, 3, 6, 6);
      ctx.fillStyle = "#000"; ctx.fillRect(8, 5, 4, 4); ctx.fillRect(22, 5, 4, 4);
      ctx.fillStyle = "#000"; ctx.fillRect(5, 2, 9, 2); ctx.fillRect(18, 2, 9, 2);
      ctx.fillStyle = "#4a2000"; ctx.fillRect(2, 22, 10, 6); ctx.fillRect(20, 22, 10, 6);
    }));

    // Koopa troopa 28×36
    this.textures.addCanvas("koopa", this.makeCanvas(28, 36, ctx => {
      ctx.fillStyle = "#3aaa3a";
      ctx.beginPath(); ctx.ellipse(14, 23, 11, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#5ad45a";
      ctx.beginPath(); ctx.ellipse(10, 18, 5, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#d4a840"; ctx.fillRect(8, 0, 12, 12);
      ctx.fillStyle = "#fff"; ctx.fillRect(9, 2, 4, 5); ctx.fillRect(15, 2, 4, 5);
      ctx.fillStyle = "#000"; ctx.fillRect(10, 4, 2, 3); ctx.fillRect(16, 4, 2, 3);
      ctx.fillStyle = "#d4a840"; ctx.fillRect(3, 28, 8, 8); ctx.fillRect(17, 28, 8, 8);
    }));

    // Shell 28×20
    this.textures.addCanvas("shell", this.makeCanvas(28, 20, ctx => {
      ctx.fillStyle = "#3aaa3a";
      ctx.beginPath(); ctx.ellipse(14, 10, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#2a8a2a";
      ctx.beginPath(); ctx.ellipse(14, 10, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4acc4a"; ctx.fillRect(2, 8, 24, 3); ctx.fillRect(12, 2, 4, 16);
    }));


    // Mario's Mysteries — center-crop to fit TV screen (object-fit: cover)
    if (this.textures.exists("marios-mysteries")) {
      const srcImg = this.textures.get("marios-mysteries").source[0].image as HTMLImageElement;
      this.textures.addCanvas("marios-mysteries-cropped", this.makeCanvas(TV_SW, TV_SH, ctx => {
        const srcW = srcImg.naturalWidth;
        const srcH = srcImg.naturalHeight;
        // Scale so the image fills the TV in both dimensions (cover)
        const scale = Math.max(TV_SW / srcW, TV_SH / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        // Center the scaled image and clip to TV bounds
        ctx.drawImage(srcImg, (TV_SW - drawW) / 2, (TV_SH - drawH) / 2, drawW, drawH);
      }));
    }
  }

  // ── update ──────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.player.active) return;
    if (this.settingsOpen) return;

    // ── Cutscene lock ─────────────────────────────────────────────────────────
    if (this.cutsceneActive) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      if (this.cutsceneStep < 5 &&
          (Phaser.Input.Keyboard.JustDown(this.keyZ) ||
           Phaser.Input.Keyboard.JustDown(this.cursors.space))) {
        this.advanceCutscene();
      }
      return;
    }

    // ── Enemy AI ────────────────────────────────────────────────────────────
    for (const g of this.goombas.getChildren()) {
      const sp = g as Phaser.Physics.Arcade.Sprite;
      const b  = sp.body as Phaser.Physics.Arcade.Body;
      if (b.blocked.left)  { sp.setVelocityX(60);  sp.setFlipX(true); }
      if (b.blocked.right) { sp.setVelocityX(-60); sp.setFlipX(false); }
    }
    for (const k of this.koopas.getChildren()) {
      const sp = k as Phaser.Physics.Arcade.Sprite;
      const b  = sp.body as Phaser.Physics.Arcade.Body;
      if (b.blocked.left)  { sp.setVelocityX(50);  sp.setFlipX(true); }
      if (b.blocked.right) { sp.setVelocityX(-50); sp.setFlipX(false); }
    }
    for (const s of this.shells.getChildren()) {
      const sp = s as Phaser.Physics.Arcade.Sprite;
      const b  = sp.body as Phaser.Physics.Arcade.Body;
      if (sp.getData("sliding") && (b.blocked.left || b.blocked.right)) {
        b.setVelocityX(b.blocked.left ? SHELL_SPEED : -SHELL_SPEED);
      }
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    const goLeft  = this.cursors.left.isDown  || this.keyA.isDown;
    const goRight = this.cursors.right.isDown || this.keyD.isDown;
    const jumpDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                     Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
                     Phaser.Input.Keyboard.JustDown(this.keyW);
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown || this.keyW.isDown;
    const dashDown = this.dashPending;
    this.dashPending = false;

    // ── Horizontal movement ──────────────────────────────────────────────────
    const dialogueActive  = this.time.now < this.dialogueUntil;
    const personTalking   = this.time.now < this.personTalkingUntil;
    if (!this.isDashing) {
      if (!personTalking && goLeft) {
        this.player.setVelocityX(-this.stats.speed);
        this.player.setFlipX(true);
        this.dashDir = -1;
      } else if (!personTalking && goRight) {
        this.player.setVelocityX(this.stats.speed);
        this.player.setFlipX(false);
        this.dashDir = 1;
      } else {
        this.player.setVelocityX(personTalking ? 0 : body.velocity.x * 0.7);
      }
    }

    // ── Jump ────────────────────────────────────────────────────────────────
    if (jumpDown && onGround) {
      this.player.setVelocityY(this.stats.jumpVel);
      this.jumpHeld      = true;
      this.jumpHeldMs    = 0;
      this.flutterUsed   = false;
    }

    if (this.jumpHeld) {
      if (jumpHeld && this.jumpHeldMs < this.stats.jumpHold && body.velocity.y < 0) {
        body.setVelocityY(body.velocity.y - this.stats.jumpHoldF * (delta / 16));
        this.jumpHeldMs += delta;
      } else {
        this.jumpHeld = false;
      }
    }

    // Reset airborne abilities on landing
    if (onGround) {
      this.flutterUsed  = false;
      this.isFluttering = false;
      this.floatUsed    = false;
      if (this.floatActive) {
        this.floatActive = false;
        body.setGravityY(0);
        this.player.clearTint();
      }
    }

    // ── Yoshi flutter jump ────────────────────────────────────────────────────
    if (this.stats.flutter && jumpDown && !onGround && !this.flutterUsed && !this.isFluttering) {
      this.triggerFlutter(body);
    }

    // ── Peach float (slow descent while holding jump) ─────────────────────────
    if (this.stats.float) {
      if (!onGround && jumpHeld && body.velocity.y > 10 && !this.floatUsed && !this.floatActive) {
        this.floatActive = true;
        this.floatUsed   = true;
        this.floatTimer  = 0;
      }
      if (this.floatActive) {
        if (jumpHeld && this.floatTimer < 1800) {
          this.floatTimer += delta;
          body.setGravityY(-840); // near-cancels world gravity → slow fall
          this.player.setTint(0xffddee);
        } else {
          this.floatActive = false;
          body.setGravityY(0);
          this.player.clearTint();
        }
        if (!jumpHeld) {
          this.floatActive = false;
          body.setGravityY(0);
          this.player.clearTint();
        }
      }
    }

    // ── Yoshi tongue / spit ──────────────────────────────────────────────────
    // zConsumed prevents Z from triggering both Yoshi actions AND World 9 interactions
    let zConsumed = false;
    if (this.character === "yoshi") {
      if (this.worldId !== 9 && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
        zConsumed = true;
        if (this.yoshiStomach !== "empty") {
          this.yoshiSpit();
        } else if (!this.tongueActive) {
          this.activateTongue();
        }
      }
      if (this.tongue && this.tongueActive) {
        const dir = this.player.flipX ? -1 : 1;
        this.tongue.setPosition(this.player.x + dir * 36, this.player.y - 2);
        this.checkTongueEat();
      }
    }

    // ── World 9 Z interactions ────────────────────────────────────────────────
    if (this.worldId === 9 && !zConsumed && Phaser.Input.Keyboard.JustDown(this.keyZ)) {
      const px = this.player.x, py = this.player.y;
      const onMainFloor = px < 1920;
      const inKitchen   = px >= W1_K_LEFT && px < W1_K_RIGHT;
      const inBathroom  = px >= W1_B_LEFT && px < W1_B_RIGHT;

      // Phone pickup — on desk (DX=620)
      if (!this.hasPhone && onMainFloor && Math.abs(px - 668) < 60 && py > W1_FL - 220) {
        this.hasPhone = true;
        this.deskPhoneGfx?.setVisible(false);
        this.phoneZLabel?.setVisible(false);
        if (this.phoneIconObj) {
          this.phoneIconObj.setVisible(true);
          (this.phoneIconObj.getData("gfx") as Phaser.GameObjects.Graphics)?.setVisible(true);
        }
        this.showDialogue("You picked up the phone!\nClues will be logged here automatically.", "#88ccff", 3500);
      }

      // Grab Luigi Meat Mallet
      else if (inKitchen && this.luigiGreeted && !this.holdingMallet && !this.tomatoSmashed) {
        const LX = W1_K_LEFT + 650;
        if (Math.abs(px - LX) < 55) {
          this.holdingMallet = true;
          this.showDialogue("You grabbed Luigi! Walk to the tomatoes\nand press SHIFT to smash!", "#ffff44", 4000);
        }
      }

      // Inspect meatball
      else if (inKitchen && this.meatballActive) {
        const CTX = W1_K_LEFT + 460;
        if (Math.abs(px - (CTX + 35)) < 70) {
          this.meatballActive = false;
          this.addClue("The color RED — from Luigi's tomato sauce.");
          this.showDialogue("Clue logged to phone:\n\"The color RED\"", "#ff6644", 4000);
          this.bathroomUnlocked = true;
          this.mrPuzzlesGfx?.setVisible(true);
          this.time.delayedCall(1500, () => {
            this.showPersonDialogue("Luigi: Great work! Here's the bathroom key!", "#44ff44", 3500);
            this.time.delayedCall(4000, () => {
              this.showPersonDialogue("Luigi: Oh, it's TV TIME!", "#44ff44", 3000);
            });
          });
        }
      }

      // Inspect pipe meatball (second clue) — pipe stays visible after inspection
      else if (inBathroom && this.pipeRevealGfx?.visible && !this.pipeInspected) {
        const pipeX = W1_BRETURN_X + 66;
        if (Math.abs(px - pipeX) < 65) {
          this.pipeZLabel?.setVisible(false);
          this.addClue("A pipe — the spaghetti was hidden inside!");
          this.showDialogue("Clue logged to phone:\n\"A pipe\"", "#88ff88", 4000);
          this.pipeInspected = true;
          this.mrPuzzlesGfx?.setVisible(false);
          this.time.delayedCall(800, () => this.showSmg4CluePopup("Another clue!"));
        }
      }

      // Grab gun in war zone
      else if (this.warEntered && !this.holdingGun && !this.warSectionDone) {
        const GX = W1_WAR_LEFT + 2200;
        if (this.gunPickupGfx?.visible && Math.abs(px - GX) < 50) {
          this.holdingGun = true;
          this.gunPickupGfx.setVisible(false);
          const gunLabel = this.children.getByName("gun-label") as Phaser.GameObjects.Text | null;
          gunLabel?.setVisible(false);
          this.showDialogue("You grabbed a gun!\nPress SHIFT to shoot.", "#ffcc44", 3000);
        }
      }

      // Inspect defeated Shroomy on tower top → mushroom clue
      else if (this.warEntered && !this.shroomyAlive && !this.shroomyInspected) {
        const TX = W1_SHROOMY_TOWER_X + 40;
        if (Math.abs(px - TX) < 70 && py < W1_FL - 280) {
          this.shroomyInspected = true;
          this.warSectionDone = true;
          this.shroomyZLabel?.setVisible(false);
          this.addClue("Mushroom — a meatball was hidden on Shroomy's head!");
          this.showDialogue("Found a meatball on Shroomy's head!\nFinal clue: MUSHROOM", "#ffcc44", 4500);
          this.time.delayedCall(800, () => this.showSmg4CluePopup("THE FINAL CLUE!"));
        }
      }
    }

    // ── World 9 SHIFT+mallet smash ────────────────────────────────────────────
    if (this.worldId === 9 && this.holdingMallet) {
      const px = this.player.x;
      const CTX = W1_K_LEFT + 460;
      if (Phaser.Input.Keyboard.JustDown(this.keyShift)) {
        // Carrots → orange sauce (mallet stays)
        if (!this.carrotsSmashed && Math.abs(px - (CTX + 79)) < 80) {
          this.carrotsSmashed = true;
          this.carrotSmashOverlay?.setVisible(true);
          this.showDialogue("SMASH! Carrots crushed into orange sauce!", "#ff8811", 3000);
        }
        // Cucumbers → green sauce (mallet stays)
        else if (!this.cucumbersSmashed && Math.abs(px - (CTX + 119)) < 80) {
          this.cucumbersSmashed = true;
          this.cucumberSmashOverlay?.setVisible(true);
          this.showDialogue("SMASH! Cucumbers crushed into green sauce!", "#228822", 3000);
        }
        // Tomatoes → meatball, mallet disappears
        else if (!this.tomatoSmashed && Math.abs(px - (CTX + 35)) < 80) {
          this.tomatoSmashed = true;
          this.holdingMallet = false;
          this.meatballActive = true;
          this.kitchenSmashOverlay?.setVisible(true);
          this.showDialogue("SMASH! Tomatoes crushed into sauce!\nInspect the meatball with Z.", "#ff4400", 3500);
          this.time.delayedCall(800, () => this.showSmg4CluePopup());
        }
      }
    }

    // ── World 9 war zone: SHIFT to shoot ──────────────────────────────────────
    if (this.worldId === 9 && this.holdingGun && this.warEntered &&
        Phaser.Input.Keyboard.JustDown(this.keyShift)) {
      this.firePlayerBullet();
    }

    // ── World 9 war zone: player bullet hits Chris/Swag/Shroomy ──────────────
    if (this.worldId === 9 && this.warEntered && this.playerBullet?.active) {
      const pb = this.playerBullet;
      if (this.chrisAlive && Math.abs(pb.x - (W1_WAR_LEFT + 2400)) < 35 &&
          Math.abs(pb.y - (W1_FL - 42)) < 42) {
        this.chrisAlive = false;
        pb.destroy();
        this.playerBullet = null;
        this.chrisGfx?.setVisible(false);
        this.showDialogue("Chris is down!", "#ffcc44", 2000);
      } else if (this.swagAlive && Math.abs(pb.x - (W1_WAR_LEFT + 2600)) < 35 &&
          Math.abs(pb.y - (W1_FL - 42)) < 42) {
        this.swagAlive = false;
        pb.destroy();
        this.playerBullet = null;
        this.swagGfx?.setVisible(false);
        this.showDialogue("Swagmaster is down!", "#ffcc44", 2000);
      } else if (this.shroomyAlive &&
          Math.abs(pb.x - (W1_SHROOMY_TOWER_X + 40)) < 60 &&
          pb.y < W1_FL - 280) {
        this.shroomyAlive = false;
        pb.destroy();
        this.playerBullet = null;
        this.shroomyGfx?.setAlpha(0.35);
        this.showShroomyMeatball();
        this.shroomyZLabel?.setVisible(true);
        this.showDialogue("Shroomy is down!\nClimb up and inspect him (Z).", "#88ff88", 3000);
      }
      if (!this.chrisAlive && !this.swagAlive) {
        this.showDialogue("Both enemies defeated!\nAdvance deeper into the war zone.", "#88ff88", 2500);
      }
    }

    // ── Barrage height-damage check + warning overlay (red=danger, yellow=safe) ─
    {
      const inWarZone = this.worldId === 9 && this.warEntered && !this.warSectionDone;
      if (inWarZone) {
        const active = this.warBarrageActive;
        if (active !== this.lastBarrageActive) {
          this.lastBarrageActive = active;
          const wg = this.barrageWarningGfx;
          if (wg) {
            wg.clear();
            if (active) {
              wg.fillStyle(0xff1100, 0.28).fillRect(0, 0, 1280, 220);
              wg.lineStyle(4, 0xff3300, 0.85).strokeRect(0, 0, 1280, 220);
              wg.lineStyle(2, 0xff6600, 0.5).strokeRect(4, 4, 1272, 212);
            } else {
              wg.fillStyle(0xffcc00, 0.18).fillRect(0, 0, 1280, 220);
              wg.lineStyle(4, 0xffdd00, 0.75).strokeRect(0, 0, 1280, 220);
              wg.lineStyle(2, 0xffee88, 0.4).strokeRect(4, 4, 1272, 212);
            }
            wg.setVisible(true);
          }
          this.barrageWarningText
            ?.setColor(active ? "#ff4400" : "#ffdd00")
            .setText(active ? "⚠  DANGER — STAY LOW!  ⚠" : "✓  SAFE — MOVE NOW!  ✓")
            .setVisible(true);
        }
        const onTower = this.player.x >= W1_SHROOMY_TOWER_X - 50 && this.player.x <= W1_SHROOMY_TOWER_X + 130;
        if (active && this.player.y < W1_FL - 72 && !onTower) {
          this.takeDamage();
        }
      } else if (this.lastBarrageActive !== null) {
        this.lastBarrageActive = null;
        this.barrageWarningGfx?.setVisible(false);
        this.barrageWarningText?.setVisible(false);
      }
    }

    // ── Ending trigger behind Shroomy's tower ─────────────────────────────────
    if (this.worldId === 9 && this.warEntered && this.shroomyInspected &&
        !this.endingTriggered && this.player.x > W1_SHROOMY_TOWER_X + 88) {
      this.endingTriggered = true;
      this.warEntered      = false;
      this.holdingGun      = false;
      this.warBarrageActive = false;
      this.player.setPosition(W1_WAR_BACK_X, W1_FL - 50);
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.cameras.main.setBounds(W1_BROOM_LEFT, 0, W1_BROOM_RIGHT - W1_BROOM_LEFT, LEVEL_H);
      this.cameras.main.centerOn(W1_WAR_BACK_X, W1_FL);
      this.time.delayedCall(600, () => this.startGuessSequence());
    }

    // ── DOWN key: dismiss active dialogue (consume before any NPC interaction) ──
    const downJust = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    let downConsumed = false;
    if (dialogueActive && downJust) {
      this.dialogueUntil      = 0;
      this.personTalkingUntil = 0;
      this.dialogueBg?.setVisible(false);
      this.dialogueText?.setVisible(false);
      downConsumed = true;
    }

    // ── World 9 war zone: talk to Meggy (down arrow) ──────────────────────────
    if (this.worldId === 9 && this.warEntered && !downConsumed && downJust) {
      const px2 = this.player.x;
      if (Math.abs(px2 - W1_MEGGY_X) < 90) {
          this.showPersonDialogue(
          "Meggy: \"There is a meatball on a tower farther down\"",
          "#ff9933", 4500
        );
      }
    }

    // ── Boopkins: track when player exits bathroom after bomb ──────────────────
    if (this.worldId === 9 && this.pipeBombUsed && !this.leftBathroomAfterBomb) {
      const px = this.player.x;
      if (px < W1_B_LEFT || px >= W1_B_RIGHT) {
        this.leftBathroomAfterBomb = true;
      }
    }
    // ── Boopkins respawn when player RE-ENTERS bathroom after having left ──────
    if (this.worldId === 9 && this.pipeBombUsed && this.leftBathroomAfterBomb && !this.boopkinsRespawned) {
      const px = this.player.x;
      if (px >= W1_B_LEFT && px < W1_B_RIGHT) {
        this.boopkinsRespawned = true;
        if (this.boopkinsGfx) this.tweens.killTweensOf(this.boopkinsGfx);
        this.boopkinsGfx?.destroy();
        const respawnX = W1_B_LEFT + 310;
        this.boopkinsGfx = this.add.graphics().setDepth(2);
        this.drawBoopkins(this.boopkinsGfx, respawnX, W1_FL);
      }
    }

    // ── Dash ─────────────────────────────────────────────────────────────────
    if (dashDown && this.canDash && !this.isDashing) {
      this.triggerDash(body);
    }

    // ── Warp prompt & triggers ────────────────────────────────────────────────
    if (!this.dying) {
      let promptVisible = false;
      let promptX = 0, promptY = 0;

      if (this.worldId === 0 && this.warpGroup) {
        // Lobby → scan TV zones
        this.nearWarpId = -1;
        for (const z of this.warpGroup.getChildren()) {
          const zone = z as Phaser.Physics.Arcade.Sprite;
          const hw = zone.getData("hw") as number;
          const hh = zone.getData("hh") as number;
          if (Math.abs(this.player.x - zone.x) < hw + 14 &&
              Math.abs(this.player.y - zone.y) < hh + 14) {
            this.nearWarpId = zone.getData("worldId") as number;
            promptX = zone.x; promptY = zone.y - hh - 8;
            promptVisible = true;
            break;
          }
        }
        if (this.nearWarpId >= 0 && downJust && !downConsumed) {
          this.enterWorld(this.nearWarpId);
        }
      } else if (this.worldId !== 0 && this.returnTVGroup) {
        // World → return TV
        for (const z of this.returnTVGroup.getChildren()) {
          const zone = z as Phaser.Physics.Arcade.Sprite;
          const hw = (zone.getData("hw") as number) ?? TV_W / 2;
          const hh = (zone.getData("hh") as number) ?? TV_H / 2;
          if (Math.abs(this.player.x - zone.x) < hw + 14 &&
              Math.abs(this.player.y - zone.y) < hh + 14) {
            promptX = zone.x; promptY = zone.y - hh - 8;
            promptVisible = true;
            if (downJust && !downConsumed)
              this.enterWorld(this.worldId === 9 ? 8 : 0);
            break;
          }
        }
        // World 8 house door
        if (this.worldId === 8 && !promptVisible) {
          const nearDoor = Math.abs(this.player.x - 940) < 38 &&
                           this.player.y > 330 && this.player.y < 430;
          if (nearDoor) {
            promptX = 940; promptY = 325;
            promptVisible = true;
            if (downJust && !downConsumed) this.enterWorld(9);
          }
        }
        // World 9 — Luigi NPC dialogue (↓ near mallet in kitchen, no enter prompt)
        if (this.worldId === 9 && !promptVisible) {
          const px = this.player.x, py = this.player.y;
          const inKitchen = px >= W1_K_LEFT && px < W1_K_RIGHT;
          if (inKitchen) {
            const LX = W1_K_LEFT + 650;
            if (Math.abs(px - LX) < 55 && py > W1_FL - 180) {
              if (downJust && !downConsumed && !this.luigiGreeted) {
                this.luigiGreeted = true;
                this.showPersonDialogue("Luigi: I need your help! I'm making red pasta\nsauce! Can you make some for me?", "#44ff44", 5000);
                this.time.delayedCall(10000, () => {
                  if (!this.holdingMallet && !this.tomatoSmashed) {
                    this.showPersonDialogue("SMG4: There's got to be something we can smash with, right?", "#4488ff", 4000);
                  }
                });
              }
            }
          }
        }
        // World 9 — Boopkins NPC dialogue (↓ near Boopkins in bathroom, no enter prompt)
        if (this.worldId === 9 && !promptVisible) {
          const px = this.player.x, py = this.player.y;
          const inBathroom = px >= W1_B_LEFT && px < W1_B_RIGHT;
          if (inBathroom) {
            const BKX = W1_BRETURN_X + 500;
            if (Math.abs(px - BKX) < 55 && py > W1_FL - 150 && !this.pipeBombUsed) {
              if (downJust && !downConsumed && !this.boopkinsGreeted) {
                this.boopkinsGreeted = true;
                this.showPersonDialogue("Boopkins: I'm about to sing my faaaavorite song!\nDo you want to sing with me Mario!", "#00cccc", 5000);
                this.startBoopkinsSinging();
              }
            }
            // After pipe bomb: re-spawned Boopkins gives the bedroom key
            if (this.pipeBombUsed && this.boopkinsRespawned && !this.boopkinsKeyGiven) {
              const RBX = W1_B_LEFT + 310;
              if (Math.abs(px - RBX) < 70 && py > W1_FL - 150) {
                if (downJust && !downConsumed) {
                  this.boopkinsKeyGiven = true;
                  this.bedroomUnlocked  = true;
                  this.showPersonDialogue("Boopkins: S-Sorry about that! Here, take this key\nas an apology!", "#00cccc", 4500);
                  this.time.delayedCall(4800, () => {
                    this.showDialogue("Bedroom unlocked! Check the painting upstairs.", "#88ff88", 3000);
                  });
                }
              }
            }
          }
        }
        // World 9 — Mr. Puzzles NPC (main floor near red chair, after bathroom key)
        if (this.worldId === 9 && !promptVisible) {
          const px = this.player.x, py = this.player.y;
          const onMainFloor = px < 1920;
          if (onMainFloor && this.bathroomUnlocked && !this.mrPuzzlesGreeted) {
            const MPX = 1370;
            if (Math.abs(px - MPX) < 60 && py > W1_FL - 150) {
              if (downJust && !downConsumed) {
                this.mrPuzzlesGreeted = true;
                this.showPersonDialogue("Mr. Puzzles: TV time!\nWatch the Mario Movie with bonus features!", "#ffff44", 4000);
                this.time.delayedCall(4500, () => this.showMovieCutscene());
              }
            }
          }
        }
        // World 1 room doors
        if (this.worldId === 9 && !promptVisible) {
          const px = this.player.x, py = this.player.y;
          const nearFloor = py > W1_FL - 110;
          type DoorWarp = { dx: number; destX: number; destY: number; locked?: boolean; lockMsg?: string };
          const doors: DoorWarp[] = [
            { dx: W1_KDOOR_X,        destX: W1_KSPAWN_X,      destY: W1_FL - 50 },
            { dx: W1_BDOOR_X,        destX: W1_BSPAWN_X,      destY: W1_FL - 50, locked: !this.bathroomUnlocked, lockMsg: "The bathroom is locked.\nFind the key first!" },
            { dx: W1_BEDROOM_X,      destX: W1_BROOM_SPAWN_X, destY: W1_FL - 50, locked: !this.bedroomUnlocked,  lockMsg: "The bedroom is locked." },
            { dx: W1_KRETURN_X,      destX: W1_KBACK_X,       destY: W1_FL - 50 },
            { dx: W1_BRETURN_X,      destX: W1_BBACK_X,       destY: W1_FL - 50 },
            { dx: W1_BROOM_RETURN_X, destX: W1_BROOM_BACK_X,  destY: W1_FL - 50 },
            { dx: W1_WAR_RETURN_X,   destX: W1_WAR_BACK_X,    destY: W1_FL - 50 },
          ];
          for (const door of doors) {
            if (nearFloor && Math.abs(px - door.dx) < 36) {
              promptX = door.dx; promptY = W1_FL - 112;
              promptVisible = true;
              if (downJust && !downConsumed) {
                if (door.locked) {
                  this.showDialogue(door.lockMsg ?? "Locked!", "#ff8844", 2500);
                } else {
                  this.player.setPosition(door.destX, door.destY);
                  (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
                  if (door.dx === W1_WAR_RETURN_X) {
                    this.warEntered  = false;
                    this.holdingGun  = false;
                    this.warBarrageActive = false;
                    if (this.shroomyInspected && !this.endingTriggered) {
                      this.endingTriggered = true;
                      this.time.delayedCall(800, () => this.startGuessSequence());
                    }
                  }
                  const dx = door.destX;
                  let bL = 0, bW = 1920;
                  if (dx >= W1_K_LEFT && dx < W1_K_RIGHT)              { bL = W1_K_LEFT;     bW = W1_K_RIGHT - W1_K_LEFT; }
                  else if (dx >= W1_B_LEFT && dx < W1_B_RIGHT)         { bL = W1_B_LEFT;     bW = W1_B_RIGHT - W1_B_LEFT; }
                  else if (dx >= W1_BROOM_LEFT && dx < W1_BROOM_RIGHT) { bL = W1_BROOM_LEFT; bW = W1_BROOM_RIGHT - W1_BROOM_LEFT; }
                  else if (dx >= W1_WAR_LEFT && dx < W1_WAR_RIGHT)     { bL = W1_WAR_LEFT;   bW = W1_WAR_RIGHT - W1_WAR_LEFT; }
                  this.cameras.main.setBounds(bL, 0, bW, LEVEL_H);
                  this.cameras.main.centerOn(door.destX, door.destY);
                }
              }
              break;
            }
          }
        }
        // World 9 — war painting warp (↓ near painting → enter war zone)
        if (this.worldId === 9 && !promptVisible) {
          const px = this.player.x, py = this.player.y;
          const inBedroom = px >= W1_BROOM_LEFT && px < W1_BROOM_RIGHT;
          if (inBedroom && Math.abs(px - W1_WP_CX) < 70 && py > W1_WP_TY - 50) {
            promptX = W1_WP_CX; promptY = W1_WP_TY - 22;
            promptVisible = true;
            if (downJust && !downConsumed) {
              this.warEntered = true;
              this.player.setPosition(W1_WAR_SPAWN_X, W1_FL - 50);
              (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
              this.cameras.main.setBounds(W1_WAR_LEFT, 0, W1_WAR_RIGHT - W1_WAR_LEFT, LEVEL_H);
              this.cameras.main.centerOn(W1_WAR_SPAWN_X, W1_FL);
              if (!this.warCutsceneDone) {
                this.warCutsceneDone = true;
                this.showPersonDialogue("SMG4: Mario, look we are in the middle of a war!", "#4488ff", 4500);
              }
            }
          }
        }
      }

      if (this.warpPromptText) {
        if (promptVisible) this.warpPromptText.setPosition(promptX, promptY).setVisible(true);
        else               this.warpPromptText.setVisible(false);
      }
    }

    // ── World 9 X key → inventory ─────────────────────────────────────────────
    if (this.worldId === 9 && Phaser.Input.Keyboard.JustDown(this.keyX)) {
      if (this.inventoryOpen) this.closeInventory();
      else if (this.hasPipeBomb) this.openInventory();
      else if (this.phoneLogOpen) this.closePhoneLog();
    }

    // ── World 9 dynamic Z labels ──────────────────────────────────────────────
    if (this.worldId === 9) {
      const px = this.player.x, py = this.player.y;
      if (this.phoneZLabel) {
        this.phoneZLabel.setVisible(
          !this.hasPhone && px < 1920 && Math.abs(px - 668) < 60 && py > W1_FL - 220
        );
      }
      if (this.meatballZLabel) {
        const CTX = W1_K_LEFT + 460;
        this.meatballZLabel.setVisible(
          this.meatballActive && Math.abs(px - (CTX + 35)) < 70
        );
      }
      if (this.pipeZLabel && this.pipeRevealGfx?.visible) {
        const pipeX = W1_BRETURN_X + 66;
        this.pipeZLabel.setVisible(Math.abs(px - pipeX) < 65);
      }
      if (this.shroomyZLabel && !this.shroomyAlive && !this.shroomyInspected) {
        const TX = W1_SHROOMY_TOWER_X + 40;
        this.shroomyZLabel.setVisible(this.warEntered && Math.abs(px - TX) < 80 && py < W1_FL - 280);
      }
    }

    // ── Auto-hide dialogue box ────────────────────────────────────────────────
    if (this.dialogueBg && this.dialogueText) {
      const expired = this.time.now > this.dialogueUntil;
      this.dialogueBg.setVisible(!expired);
      this.dialogueText.setVisible(!expired);
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private triggerFlutter(body: Phaser.Physics.Arcade.Body) {
    this.flutterUsed  = true;
    this.isFluttering = true;
    this.jumpHeld     = false;

    // Phase 1: brief downward arc (~0.15 s)
    body.setVelocityY(160);
    this.player.setTint(0x88ff88);

    // Phase 2: launch back up — 17.5% higher than base jump
    this.time.delayedCall(150, () => {
      if (!this.player.active || !this.isFluttering) return;
      body.setVelocityY(this.stats.jumpVel * 1.175);
      this.jumpHeld   = true;
      this.jumpHeldMs = 0;
    });

    this.time.delayedCall(280, () => {
      if (!this.player.active) return;
      this.isFluttering = false;
      this.player.clearTint();
    });
  }

  private triggerDash(body: Phaser.Physics.Arcade.Body) {
    this.isDashing = true;
    this.canDash   = false;
    body.setGravityY(-900);           // cancel gravity
    this.player.setVelocityX(this.dashDir * DASH_VEL);
    this.player.setVelocityY(0);
    this.player.setTint(0x88ccff);

    this.time.delayedCall(DASH_DURATION, () => {
      if (!this.player.active) return;
      this.isDashing = false;
      body.setGravityY(0);
      this.player.clearTint();

      this.time.delayedCall(DASH_COOLDOWN - DASH_DURATION, () => {
        if (!this.player.active) return;
        this.canDash = true;
        this.tweens.add({
          targets: this.player,
          alpha: { from: 0.4, to: 1 },
          duration: 250,
          ease: "Linear",
        });
      });
    });
  }

  private buildEnemies() {
    this.goombas = this.physics.add.group();
    this.koopas  = this.physics.add.group();
    this.shells  = this.physics.add.group();

    for (const x of GOOMBA_XS) {
      const g = this.goombas.create(x, GROUND_TOP - 14, "goomba") as Phaser.Physics.Arcade.Sprite;
      g.setCollideWorldBounds(true);
      g.setVelocityX(-60);
    }
    for (const x of KOOPA_XS) {
      const k = this.koopas.create(x, GROUND_TOP - 18, "koopa") as Phaser.Physics.Arcade.Sprite;
      k.setCollideWorldBounds(true);
      k.setVelocityX(-50);
    }

  }

  private setupEnemyCollisions() {
    this.physics.add.collider(this.goombas, this.platforms);
    this.physics.add.collider(this.koopas,  this.platforms);
    this.physics.add.collider(this.shells,  this.platforms);

    // Enemy-enemy bouncing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enemyBounce = (a: any, b: any) => {
      const sa = a as Phaser.Physics.Arcade.Sprite;
      const sb = b as Phaser.Physics.Arcade.Sprite;
      const spdA = Math.abs((sa.body as Phaser.Physics.Arcade.Body).velocity.x) || 60;
      const spdB = Math.abs((sb.body as Phaser.Physics.Arcade.Body).velocity.x) || 60;
      const dirA = sa.x <= sb.x ? -1 : 1;
      sa.setVelocityX(dirA * spdA);
      sb.setVelocityX(-dirA * spdB);
      sa.setFlipX(dirA > 0);
      sb.setFlipX(dirA < 0);
    };
    this.physics.add.collider(this.goombas, this.goombas, enemyBounce);
    this.physics.add.collider(this.koopas,  this.koopas,  enemyBounce);
    this.physics.add.collider(this.goombas, this.koopas,  enemyBounce);

    // Player vs Goomba
    this.physics.add.overlap(this.player, this.goombas, (_p, g) => {
      const goomba = g as Phaser.Physics.Arcade.Sprite;
      if (!this.player.active || !goomba.active) return;
      if (this.isStomping(goomba)) {
        goomba.destroy();
        this.stompBounce();
      } else {
        this.takeDamage();
      }
    });

    // Player vs Koopa
    this.physics.add.overlap(this.player, this.koopas, (_p, k) => {
      const koopa = k as Phaser.Physics.Arcade.Sprite;
      if (!this.player.active || !koopa.active) return;
      if (this.isStomping(koopa)) {
        this.koopaBecomeShell(koopa);
        this.stompBounce();
      } else {
        this.takeDamage();
      }
    });

    // Player vs Shell
    this.physics.add.overlap(this.player, this.shells, (_p, s) => {
      const shell = s as Phaser.Physics.Arcade.Sprite;
      if (!this.player.active || !shell.active) return;
      if (shell.getData("sliding")) {
        if (this.time.now < this.kickImmuneUntil) return;
        if (this.isStomping(shell)) {
          (shell.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
          shell.setData("sliding", false);
          (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(-200);
        } else {
          this.takeDamage();
        }
      } else {
        // Stationary shell: kick it
        const dir = this.player.x < shell.x ? 1 : -1;
        shell.setData("sliding", true);
        (shell.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * SHELL_SPEED);
        this.kickImmuneUntil = this.time.now + 300;
      }
    });

    // Mushroom pickup — restore 1 HP
    this.physics.add.overlap(this.player, this.mushrooms, (_p, m) => {
      const mush = m as Phaser.Physics.Arcade.Sprite;
      if (!mush.active) return;
      mush.destroy();
      if (this.hp < this.maxHp) {
        this.hp++;
        this.redrawHp();
      }
    });

    // Sliding shell kills goombas and koopas
    this.physics.add.overlap(this.shells, this.goombas, (s, g) => {
      if ((s as Phaser.Physics.Arcade.Sprite).getData("sliding"))
        (g as Phaser.Physics.Arcade.Sprite).destroy();
    });
    this.physics.add.overlap(this.shells, this.koopas, (s, k) => {
      if ((s as Phaser.Physics.Arcade.Sprite).getData("sliding"))
        (k as Phaser.Physics.Arcade.Sprite).destroy();
    });
  }

  private stompBounce() {
    const jumpHeld = this.cursors.up.isDown || this.cursors.space.isDown || this.keyW.isDown;
    const vel = jumpHeld ? -520 : -300;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocityY(vel);
  }

  private isStomping(enemy: Phaser.Physics.Arcade.Sprite): boolean {
    const pb = this.player.body as Phaser.Physics.Arcade.Body;
    const eb = enemy.body as Phaser.Physics.Arcade.Body;
    return pb.velocity.y > 0 && pb.bottom < eb.bottom;
  }

  private koopaBecomeShell(koopa: Phaser.Physics.Arcade.Sprite) {
    const { x, y } = koopa;
    koopa.destroy();
    const shell = this.shells.create(x, y + 8, "shell") as Phaser.Physics.Arcade.Sprite;
    shell.setData("sliding", false);
    (shell.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
  }

  private playerDie() {
    if (!this.player.active || this.dying) return;
    this.dying = true;
    this.player.setActive(false).setVisible(false);
    (this.player.body as Phaser.Physics.Arcade.Body).enable = false;
    this.cameras.main.flash(300, 255, 60, 60);
    this.cameras.main.shake(250, 0.012);
    this.time.delayedCall(900, () => this.scene.start("CharacterSelectScene"));
  }

  private buildBackground() {
    const bg = this.add.graphics();

    // ── Room fill ──────────────────────────────────────────────────────────────
    bg.fillStyle(0x06040e); bg.fillRect(0, 0, LEVEL_W, LEVEL_H);

    // Ceiling strip
    bg.fillStyle(0x040309); bg.fillRect(0, 0, LEVEL_W, 52);
    bg.fillStyle(0x0e0b18); bg.fillRect(0, 50, LEVEL_W, 3); // trim

    // ── Theater seat rows (10 rows, top = back / darkest, bottom = front) ──────
    const SBACK_H = 32, SBASE_H = 10, ROW_GAP = 7, SEAT_W = 40, NUM_ROWS = 10;
    for (let row = 0; row < NUM_ROWS; row++) {
      const ry = 54 + row * (SBACK_H + SBASE_H + ROW_GAP);
      const t  = row / (NUM_ROWS - 1); // 0 = back row (top), 1 = front row (bottom)
      // Dark navy → slightly less dark navy as you move toward the screen
      const rv = Math.floor(0x08 + t * 0x08);
      const gv = Math.floor(0x0c + t * 0x0e);
      const bv = Math.floor(0x1c + t * 0x18);
      const backCol = (rv << 16) | (gv << 8) | bv;
      const hiCol   = ((rv + 0x08) << 16) | ((gv + 0x0c) << 8) | (bv + 0x18);
      const baseCol = Math.max(0, backCol - 0x020408);
      // Seat back
      bg.fillStyle(backCol); bg.fillRect(0, ry, LEVEL_W, SBACK_H);
      // Top highlight
      bg.fillStyle(hiCol);   bg.fillRect(0, ry, LEVEL_W, 3);
      // Armrest dividers every SEAT_W pixels
      bg.fillStyle(0x050710);
      for (let x = 0; x <= LEVEL_W; x += SEAT_W) bg.fillRect(x, ry, 1, SBACK_H);
      // Seat cushion
      bg.fillStyle(baseCol); bg.fillRect(0, ry + SBACK_H, LEVEL_W, SBASE_H);
    }

    // ── Left entrance curtain ──────────────────────────────────────────────────
    bg.fillStyle(0x560808); bg.fillRect(0, 50, 54, GROUND_TOP - 50);
    bg.fillStyle(0x3e0505); bg.fillRect(0, 50, 22, GROUND_TOP - 50);
    // Curtain fold highlights
    bg.fillStyle(0x6e1111);
    for (let y = 55; y < GROUND_TOP; y += 48) bg.fillRect(22, y, 20, 26);
    // Gold rod
    bg.fillStyle(0xaa8820); bg.fillRect(0, 48, 60, 5);

    // ── Overhead light cones ───────────────────────────────────────────────────
    const lightG = this.add.graphics();
    const lightXs = [180, 430, 680, 930, 1220, 1500, 1780];
    for (const lx of lightXs) {
      // Subtle warm cone downward
      lightG.fillStyle(0xffdd88, 0.032);
      lightG.fillTriangle(lx, 52, lx - 75, 340, lx + 75, 340);
      // Bulb dot
      lightG.fillStyle(0xffeeaa, 0.75); lightG.fillCircle(lx, 53, 4);
      lightG.fillStyle(0xffffff, 0.5);  lightG.fillCircle(lx - 1, 52, 1.5);
    }

    // ── EXIT sign (green, left wall) ─────────────────────────────────────────
    const exitG = this.add.graphics();
    exitG.fillStyle(0x003300); exitG.fillRect(4, 180, 42, 18);
    exitG.fillStyle(0x00dd00); exitG.fillRect(5, 181, 40, 16);
    this.add.text(7, 182, "EXIT", { fontSize: "10px", color: "#003300" });

    // ── Carpet aisle lines ────────────────────────────────────────────────────
    bg.fillStyle(0x3a0808); bg.fillRect(54, GROUND_TOP - 4, LEVEL_W - 54, 4);
  }

  private buildLevel() {
    this.platforms = this.physics.add.staticGroup();
    this.mushrooms = this.physics.add.staticGroup();

    // ── Carpet floor ──────────────────────────────────────────────────────────
    const tileCount = Math.ceil(LEVEL_W / 64);
    for (let i = 0; i < tileCount; i++) {
      this.platforms.create(i * 64 + 32, LEVEL_H - 20, "ground-tile");
    }

    // ── TV frames (depth 1, above background; player will be depth 3) ─────────
    const tvG = this.add.graphics().setDepth(1);
    TV_POSITIONS.forEach((pos, i) => {
      const isHanging = i === 7;
      const fw  = isHanging ? HANG_TV_W  : TV_W;
      const fh  = isHanging ? HANG_TV_H  : TV_H;
      const fsw = isHanging ? HANG_TV_SW : TV_SW;
      const fsh = isHanging ? HANG_TV_SH : TV_SH;

      if (isHanging) {
        tvG.fillStyle(0x333333); tvG.fillRect(pos.x - 7, 0, 14, 10); // ceiling mount
        tvG.fillStyle(0x555555);
        for (let wy = 10; wy < pos.y - fh / 2; wy += 11) {
          tvG.fillRect(pos.x - 4, wy, 8, 7);
        }
      }

      // Frame
      tvG.fillStyle(0x262626);
      tvG.fillRoundedRect(pos.x - fw / 2, pos.y - fh / 2, fw, fh, 5);
      // Bezel
      tvG.fillStyle(0x0e0e0e);
      tvG.fillRect(pos.x - fsw / 2 - 3, pos.y - fsh / 2 - 3, fsw + 6, fsh + 6);

      if (!isHanging) {
        // Legs + foot
        tvG.fillStyle(0x1a1a1a);
        tvG.fillRect(pos.x - 20, pos.y + fh / 2,      8, 14);
        tvG.fillRect(pos.x + 12, pos.y + fh / 2,      8, 14);
        tvG.fillRect(pos.x - 26, pos.y + fh / 2 + 11, 52, 4);
      }

      // LED — red (on) for all TVs
      tvG.fillStyle(0xcc1100);
      tvG.fillCircle(pos.x + fw / 2 - 10, pos.y + fh / 2 - 10, 3);
    });

    // ── TV screens (depth 2) ─────────────────────────────────────────────────
    this.tvScreenImages = [];
    for (let i = 0; i < TV_POSITIONS.length; i++) {
      const pos = TV_POSITIONS[i];
      const isHanging = i === 7;
      const sw  = isHanging ? HANG_TV_SW : TV_SW;
      const sh  = isHanging ? HANG_TV_SH : TV_SH;
      const key = i === 0 ? "marios-mysteries-cropped"
                : i === 7 ? "puzzlevision"
                : "tv-static-0";
      const img = this.add.image(pos.x, pos.y, key).setDisplaySize(sw, sh).setDepth(2);
      this.tvScreenImages.push(img);
    }

    // ── Animate static TVs (indices 1–6; 0 = Mario's Mysteries, 7 = Puzzlevision) ─
    this.time.addEvent({
      delay: 80, loop: true,
      callback: () => {
        for (let i = 1; i <= 6; i++) {
          this.tvScreenImages[i].setTexture(`tv-static-${Math.floor(Math.random() * TV_STATIC_FRAMES)}`);
        }
      },
    });

    // ── Occasional static burst on the hanging Puzzlevision TV every 5–8 s ──
    const scheduleHangingStatic = () => {
      this.time.delayedCall(Phaser.Math.Between(5000, 8000), () => {
        // Flicker static for ~500 ms
        this.time.addEvent({
          delay: 80, repeat: 5,
          callback: () => {
            this.tvScreenImages[7].setTexture(`tv-static-${Math.floor(Math.random() * TV_STATIC_FRAMES)}`);
          },
        });
        // Restore logo then schedule next burst
        this.time.delayedCall(560, () => {
          this.tvScreenImages[7].setTexture("puzzlevision");
          scheduleHangingStatic();
        });
      });
    };
    scheduleHangingStatic();

    // ── Warp zones (proximity-checked in update via nearWarpId) ─────────────
    this.warpGroup = this.physics.add.staticGroup();
    // TV 0 — Mario's Mysteries (worldId 8)
    {
      const pos = TV_POSITIONS[0];
      const z0 = this.warpGroup.create(pos.x, pos.y, "tv-blank") as Phaser.Physics.Arcade.Sprite;
      z0.setAlpha(0).setDisplaySize(TV_W, TV_H).refreshBody();
      z0.setData("worldId", 8);
      z0.setData("hw", TV_W / 2);
      z0.setData("hh", TV_H / 2);
    }
    for (let i = 1; i <= 6; i++) {
      const pos = TV_POSITIONS[i];
      const z = this.warpGroup.create(pos.x, pos.y, "tv-blank") as Phaser.Physics.Arcade.Sprite;
      z.setAlpha(0).setDisplaySize(TV_W, TV_H).refreshBody();
      z.setData("worldId", i);
      z.setData("hw", TV_W / 2);
      z.setData("hh", TV_H / 2);
    }
    // Hanging TV warp (worldId 7)
    const hangPos = TV_POSITIONS[7];
    const hz = this.warpGroup.create(hangPos.x, hangPos.y, "tv-blank") as Phaser.Physics.Arcade.Sprite;
    hz.setAlpha(0).setDisplaySize(HANG_TV_W, HANG_TV_H).refreshBody();
    hz.setData("worldId", 7);
    hz.setData("hw", HANG_TV_W / 2);
    hz.setData("hh", HANG_TV_H / 2);

  }

  private buildPlayer() {
    // When returning from a world, spawn near the TV the player came from
    let spawnX = 100;
    let spawnY = 600;
    if (this.worldId === 9) spawnX = 960;              // house interior: spawn at purple door
    else if (this.worldId === 8 && this.fromWorld === 9) {
      spawnX = 940; spawnY = 320;  // top of hill, in front of house door
    }
    else if (this.fromWorld > 0) {
      const tvIdx = this.fromWorld === 8 ? 0 : this.fromWorld;
      if (tvIdx < TV_POSITIONS.length) spawnX = TV_POSITIONS[tvIdx].x;
    }
    this.player = this.physics.add.sprite(spawnX, spawnY, "player");
    this.player.setDepth(3);
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocityX(700);
    this.physics.add.collider(this.player, this.platforms);

    if (this.character === "yoshi") {
      this.tongue = this.add.rectangle(0, 0, 36, 8, 0xff2222)
        .setDepth(5).setVisible(false);
    }
  }

  private buildReturnTV() {
    // World 8: left base of hill; all others: near player spawn
    const TX  = this.worldId === 8 ? 290 : this.worldId === 9 ? 960 : 300;
    // World 8 grass surface is 18px above GROUND_TOP — align TV bottom to that surface
    const TBY = this.worldId === 8 ? GROUND_TOP - 18 : GROUND_TOP;
    const TY  = TBY - TV_H / 2;

    const tvG = this.add.graphics().setDepth(1);
    tvG.fillStyle(0x262626);
    tvG.fillRoundedRect(TX - TV_W/2, TY - TV_H/2, TV_W, TV_H, 5);
    tvG.fillStyle(0x0e0e0e);
    tvG.fillRect(TX - TV_SW/2 - 3, TY - TV_SH/2 - 3, TV_SW + 6, TV_SH + 6);
    tvG.fillStyle(0x1a1a1a);
    tvG.fillRect(TX - 20, TY + TV_H/2,      8, 14);
    tvG.fillRect(TX + 12, TY + TV_H/2,      8, 14);
    tvG.fillRect(TX - 26, TY + TV_H/2 + 11, 52, 4);
    tvG.fillStyle(0xcc1100);
    tvG.fillCircle(TX + TV_W/2 - 10, TY + TV_H/2 - 10, 3);

    this.add.image(TX, TY, "puzzlevision").setDisplaySize(TV_SW, TV_SH).setDepth(2);

    this.returnTVGroup = this.physics.add.staticGroup();
    const z = this.returnTVGroup.create(TX, TY, "tv-blank") as Phaser.Physics.Arcade.Sprite;
    z.setAlpha(0).setDisplaySize(TV_W, TV_H).refreshBody();
    z.setData("hw", TV_W / 2);
    z.setData("hh", TV_H / 2);
  }


  private buildWorldBackground() {
    if (this.worldId === 8) {
      const g = this.add.graphics();

      // ── Sky ──────────────────────────────────────────────────────────────
      g.fillStyle(0x48c0f4); g.fillRect(0, 0, LEVEL_W, LEVEL_H);

      // ── Sun (top-right, 12 spike rays + face) ─────────────────────────
      const SX = 1700, SY = 95, SR = 52;
      g.fillStyle(0xffee22);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.fillTriangle(
          SX + Math.cos(a - 0.14) * (SR + 6), SY + Math.sin(a - 0.14) * (SR + 6),
          SX + Math.cos(a + 0.14) * (SR + 6), SY + Math.sin(a + 0.14) * (SR + 6),
          SX + Math.cos(a)         * (SR + 40), SY + Math.sin(a)         * (SR + 40),
        );
      }
      g.fillStyle(0xffee22); g.fillCircle(SX, SY, SR);
      g.fillStyle(0xffff88); g.fillCircle(SX - 10, SY - 10, SR * 0.5); // shine
      // Eyes
      g.fillStyle(0xcc9900);
      g.fillCircle(SX - 16, SY - 8, 6); g.fillCircle(SX + 16, SY - 8, 6);
      g.fillStyle(0xffee22); g.fillCircle(SX - 18, SY - 11, 3); g.fillCircle(SX + 14, SY - 11, 3);
      // Smile (ellipse with top cut)
      g.fillStyle(0xcc9900); g.fillEllipse(SX, SY + 20, 34, 16);
      g.fillStyle(0xffee22); g.fillRect(SX - 17, SY + 12, 34, 10);

      // ── Clouds ───────────────────────────────────────────────────────────
      g.fillStyle(0xffffff);
      [[180, 85, 64, 27], [500, 68, 78, 30], [840, 55, 52, 21], [1150, 78, 68, 25], [1450, 62, 58, 23]]
        .forEach(([cx, cy, rx, ry]) => {
          g.fillEllipse(cx, cy, rx * 2, ry * 2);
          g.fillEllipse(cx - rx * 0.42, cy + 10, rx * 1.4, ry * 1.6);
          g.fillEllipse(cx + rx * 0.42, cy + 10, rx * 1.4, ry * 1.5);
        });

      // ── Giant green hill ─────────────────────────────────────────────────
      g.fillStyle(0x44aa2a); g.fillEllipse(940, 800, 1280, 860);  // main mound
      g.fillStyle(0x55cc33); g.fillEllipse(900, 730, 700, 220);   // bright top highlight
      g.fillStyle(0x338822); g.fillEllipse(940, 870, 1280, 280);  // dark base edge

      // ── Ground base (covers hill bottom) ─────────────────────────────────
      g.fillStyle(0x4aaa44); g.fillRect(0, GROUND_TOP - 18, LEVEL_W, LEVEL_H);
      g.fillStyle(0x3a8833); g.fillRect(0, GROUND_TOP - 5,  LEVEL_W, 7);

      // ── Trees (draw before house so house is in front) ────────────────────
      const tree = (tx: number, baseY: number, s: number) => {
        g.fillStyle(0x6b3a1e); g.fillRect(tx - 9*s, baseY - 54*s, 18*s, 54*s);
        g.fillStyle(0x228822); g.fillCircle(tx,      baseY - 68*s, 42*s);
        g.fillStyle(0x339933); g.fillCircle(tx - 14*s, baseY - 80*s, 28*s);
        g.fillStyle(0x44bb44); g.fillCircle(tx + 12*s, baseY - 77*s, 26*s);
        g.fillStyle(0x66dd55); g.fillCircle(tx,      baseY - 94*s, 22*s);
      };
      // hillY(x) = 800 - 430 * sqrt(1 - ((x-940)/640)²)
      tree(450,  523, 0.82);   // hillY(450) ≈ 523
      tree(1380, 488, 0.90);   // hillY(1380) ≈ 488
      tree(1480, 569, 0.78);   // hillY(1480) ≈ 569

      // ── House ─────────────────────────────────────────────────────────────
      const HCX = 940, HBY = 388, HW = 216, HH = 152;
      // Walls — yellow-tan
      g.fillStyle(0xd6b668); g.fillRect(HCX - HW/2, HBY - HH, HW, HH);
      g.fillStyle(0xe2c878); g.fillRect(HCX - HW/2, HBY - HH, HW, 18); // lighter top band

      // Chimney (draw before roof so roof overlaps it slightly)
      g.fillStyle(0xaa5533); g.fillRect(HCX + 52, HBY - HH - 72, 24, 48);
      g.fillStyle(0x884422); g.fillRect(HCX + 49, HBY - HH - 76, 30, 7);

      // Roof — red triangle
      g.fillStyle(0xcc2222);
      g.fillTriangle(HCX - HW/2 - 20, HBY - HH,  HCX + HW/2 + 20, HBY - HH,  HCX, HBY - HH - 92);
      // Shaded left slope
      g.fillStyle(0xaa1515);
      g.fillTriangle(HCX - HW/2 - 20, HBY - HH,  HCX, HBY - HH,  HCX, HBY - HH - 92);
      // Eave strip
      g.fillStyle(0xbb1818); g.fillRect(HCX - HW/2 - 22, HBY - HH - 5, HW + 44, 8);

      // Window (left of center) — glass → curtains → frame (order matters)
      const WX = HCX - HW/2 + 20, WY = HBY - HH + 26, WW = 60, WH = 54;
      g.fillStyle(0xbbddff); g.fillRect(WX, WY, WW, WH);          // glass
      g.fillStyle(0xdd4411); g.fillRect(WX, WY, 17, WH);          // left curtain
      g.fillStyle(0xdd4411); g.fillRect(WX + WW - 17, WY, 17, WH); // right curtain
      g.fillStyle(0xee6633); g.fillRect(WX + 2, WY, 6, WH);       // curtain highlight L
      g.fillStyle(0xee6633); g.fillRect(WX + WW - 9, WY, 6, WH);  // curtain highlight R
      g.fillStyle(0xffaa44); g.fillCircle(WX + 17, WY + WH * 0.65|0, 5); // tie-back L
      g.fillStyle(0xffaa44); g.fillCircle(WX + WW - 17, WY + WH * 0.65|0, 5); // tie-back R
      // Window frame (on top of curtains)
      g.fillStyle(0xffffff);
      g.fillRect(WX - 4, WY - 4, WW + 8, 5);       // top bar
      g.fillRect(WX - 4, WY + WH,  WW + 8, 5);     // bottom bar
      g.fillRect(WX - 4, WY - 4, 5, WH + 8);       // left bar
      g.fillRect(WX + WW - 1, WY - 4, 5, WH + 8);  // right bar
      g.fillRect(WX + WW/2 - 2, WY, 4, WH);        // centre divider
      // Sill
      g.fillStyle(0xeeeeee); g.fillRect(WX - 6, WY + WH + 4, WW + 12, 7);

      // Door — purple with rounded arch top
      const DW = 48, DH = 78, DX = HCX - DW/2, DY = HBY - DH;
      g.fillStyle(0x7722bb);
      g.fillRect(DX, DY + DW/2, DW, DH - DW/2);         // body
      g.fillEllipse(DX + DW/2, DY + DW/2, DW, DW);      // arched top
      g.fillStyle(0x5511aa);                              // left shadow
      g.fillRect(DX, DY + DW/2, 7, DH - DW/2);
      g.fillStyle(0xddaa22); g.fillCircle(DX + DW - 10, DY + DH * 0.58|0, 5); // knob
      // Step
      g.fillStyle(0xccbbaa); g.fillRect(DX - 9, HBY - 5, DW + 18, 7);

      // ── Sunflowers ────────────────────────────────────────────────────────
      const sunflower = (fx: number, fy: number, stemH: number) => {
        g.fillStyle(0x449922); g.fillRect(fx - 3, fy - stemH, 6, stemH);
        g.fillStyle(0x55aa33);
        g.fillEllipse(fx - 20, fy - stemH * 0.55, 28, 12);
        g.fillEllipse(fx + 20, fy - stemH * 0.68, 28, 12);
        g.fillStyle(0xffdd00);
        for (let p = 0; p < 8; p++) {
          const a = (p / 8) * Math.PI * 2;
          g.fillEllipse(fx + Math.cos(a) * 14, fy - stemH + Math.sin(a) * 14, 12, 22);
        }
        g.fillStyle(0x553311); g.fillCircle(fx, fy - stemH, 11);
        g.fillStyle(0x774422); g.fillCircle(fx - 2, fy - stemH - 3, 5);
      };
      sunflower(HCX - HW/2 - 30, HBY, 82);
      sunflower(HCX - HW/2 - 62, HBY, 90);
      sunflower(HCX + HW/2 + 24, HBY, 76);

      // ── Mailbox ───────────────────────────────────────────────────────────
      const MX = HCX - HW/2 - 118, MY = HBY + 6;
      g.fillStyle(0x999999); g.fillRect(MX - 4, MY - 70, 8, 72);       // post
      g.fillStyle(0xaaaaaa); g.fillRect(MX - 23, MY - 66, 46, 30);     // box body
      g.fillStyle(0xbcbcbc); g.fillEllipse(MX, MY - 51, 46, 30);       // rounded lid
      g.fillStyle(0xdddddd); g.fillRect(MX - 18, MY - 64, 22, 6);      // lid highlight
      g.fillStyle(0x777777); g.fillRect(MX - 19, MY - 47, 38, 3);      // mail slot
      g.fillStyle(0xdd2222); g.fillRect(MX + 23, MY - 68, 5, 24);      // flag pole
      g.fillStyle(0xdd2222); g.fillRect(MX + 26, MY - 68, 13, 11);     // flag panel
      g.fillStyle(0x888888); g.fillRect(MX - 9, MY - 2, 18, 6);        // post base

      return;
    }
    if (this.worldId === 9) {
      const g = this.add.graphics();
      const CEIL = W1_CEIL;  // 100
      const FL   = W1_FL;    // 680

      // ── Ceiling across all rooms ─────────────────────────────────────────────
      g.fillStyle(0xeebb55); g.fillRect(0, 0, W1_TOTAL_W, CEIL);
      g.fillStyle(0xd9a840); g.fillRect(0, CEIL - 7, W1_TOTAL_W, 7);

      // Dark fill for void gaps between sub-rooms (camera never sees these normally)
      g.fillStyle(0x111111);
      g.fillRect(1920, 0, W1_K_LEFT - 1920, LEVEL_H);
      g.fillRect(W1_K_RIGHT, 0, W1_B_LEFT - W1_K_RIGHT, LEVEL_H);
      g.fillRect(W1_B_RIGHT, 0, W1_BROOM_LEFT - W1_B_RIGHT, LEVEL_H);
      g.fillRect(W1_BROOM_RIGHT, 0, W1_TOTAL_W - W1_BROOM_RIGHT, LEVEL_H);

      // ═══ MAIN FLOOR (x=0..1920) ══════════════════════════════════════════════

      // Left boundary wall
      g.fillStyle(0xd9a840); g.fillRect(0, CEIL, 40, FL - CEIL);
      // Hall wall (x=40..565) + main room (x=565..1920), same colour
      g.fillStyle(0xf5c96a); g.fillRect(40, CEIL, 1880, FL - CEIL);

      // Baseboard + red plank floor
      g.fillStyle(0xe0b050); g.fillRect(0, FL - 16, 1920, 16);
      for (let fx = 0; fx < 1920; fx += 48) {
        g.fillStyle(fx % 96 === 0 ? 0xcc1100 : 0xb50e00);
        g.fillRect(fx, FL, 46, LEVEL_H - FL);
      }
      g.fillStyle(0xdd1800); g.fillRect(0, FL, 1920, 5);

      // ── BATHROOM DOOR (x=W1_BDOOR_X=160) ─────────────────────────────────────
      {
        const BDX = W1_BDOOR_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(BDX - 30, FL - 98, 8, 98); g.fillRect(BDX + 22, FL - 98, 8, 98);
        g.fillRect(BDX - 30, FL - 98, 60, 10);
        g.fillStyle(0xc8803a); g.fillRect(BDX - 22, FL - 88, 44, 88);
        g.fillStyle(0x9b6a2e);
        g.fillRect(BDX - 18, FL - 84, 36, 38); g.fillRect(BDX - 18, FL - 42, 36, 34);
        g.fillStyle(0xddaa66); g.fillCircle(BDX + 12, FL - 44, 4);
        g.fillStyle(0x334477); g.fillRoundedRect(BDX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xaaccff); g.fillRect(BDX - 26, FL - 116, 52, 12);
        this.add.text(BDX, FL - 113, "BATH", { fontSize: "9px", color: "#334477", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);
      }

      // ── HALL WARDROBE (wooden cabinet, x≈270) ────────────────────────────────
      {
        const HCBx = 257, HCBy = FL;
        g.fillStyle(0x7a5014); g.fillRect(HCBx - 2, HCBy - 230, 74,  8);
        g.fillStyle(0x8b5e1a); g.fillRect(HCBx,     HCBy - 222, 70, 222);
        g.fillStyle(0x9b6a1e); g.fillRect(HCBx + 4, HCBy - 218, 62, 104);
        g.fillStyle(0x9b6a1e); g.fillRect(HCBx + 4, HCBy - 110, 62, 106);
        g.fillStyle(0xddaa66); g.fillRect(HCBx + 24, HCBy - 170, 16, 5);
        g.fillStyle(0xddaa66); g.fillRect(HCBx + 24, HCBy -  62, 16, 5);
        g.fillStyle(0x7a5014, 0.5);
        g.fillRect(HCBx + 2,  HCBy - 222, 2, 222);
        g.fillRect(HCBx + 68, HCBy - 222, 2, 222);
      }

      // ── KITCHEN DOOR (x=W1_KDOOR_X=430) ──────────────────────────────────────
      {
        const KDX = W1_KDOOR_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(KDX - 30, FL - 98, 8, 98); g.fillRect(KDX + 22, FL - 98, 8, 98);
        g.fillRect(KDX - 30, FL - 98, 60, 10);
        g.fillStyle(0xc8803a); g.fillRect(KDX - 22, FL - 88, 44, 88);
        g.fillStyle(0x9b6a2e);
        g.fillRect(KDX - 18, FL - 84, 36, 38); g.fillRect(KDX - 18, FL - 42, 36, 34);
        g.fillStyle(0xddaa66); g.fillCircle(KDX + 12, FL - 44, 4);
        g.fillStyle(0x336644); g.fillRoundedRect(KDX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xaaddcc); g.fillRect(KDX - 26, FL - 116, 52, 12);
        this.add.text(KDX, FL - 113, "KITCHEN", { fontSize: "9px", color: "#336644", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);
      }

      // ── WOODEN DESK (DX=620) ─────────────────────────────────────────────────
      {
        const DX = 620;
        g.fillStyle(0x8b5e1a); g.fillRect(DX, FL - 182, 100, 10);
        g.fillStyle(0xa06820); g.fillRect(DX, FL - 174, 100,  8);
        g.fillStyle(0x7a5014);
        g.fillRect(DX,      FL - 174, 8, 142);
        g.fillRect(DX + 92, FL - 174, 8, 142);
        g.fillRect(DX,      FL -  90, 100, 8);
        g.fillStyle(0xcc9944); g.fillRect(DX + 36, FL - 88, 22, 5);
        g.fillStyle(0xcc3311); g.fillRect(DX +  8, FL - 194, 12, 12);
        g.fillStyle(0x1133aa); g.fillRect(DX + 22, FL - 198, 10, 16);
        g.fillStyle(0x228833); g.fillRect(DX + 34, FL - 196, 11, 14);
        g.fillStyle(0xbbaa33); g.fillRect(DX + 76, FL - 200,  5, 18);
        g.fillStyle(0xffee55); g.fillEllipse(DX + 79, FL - 200, 22, 14);
        g.fillStyle(0xffff88, 0.35); g.fillCircle(DX + 79, FL - 186, 16);
        // Phone on desk — separate object so it can be hidden when picked up
        const PX = DX + 58, PY = FL - 192;
        this.deskPhoneGfx = this.add.graphics().setDepth(2);
        this.deskPhoneGfx.fillStyle(0x1a1a1a); this.deskPhoneGfx.fillRoundedRect(PX, PY, 18, 28, 3);
        this.deskPhoneGfx.fillStyle(0x3388ff); this.deskPhoneGfx.fillRoundedRect(PX + 2, PY + 3, 14, 18, 2);
        this.deskPhoneGfx.fillStyle(0x222222); this.deskPhoneGfx.fillCircle(PX + 9, PY + 24, 2);
        // Z label — shown dynamically when player is near
        this.phoneZLabel = this.add.text(DX + 67, FL - 215, "Z", { fontSize: "9px", color: "#ffffff", stroke: "#000", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(3).setVisible(false);
      }

      // ── WOODEN STOOL (STX=810) ───────────────────────────────────────────────
      {
        const STX = 810;
        g.fillStyle(0xa07030); g.fillEllipse(STX, FL - 74, 60, 14);
        g.fillStyle(0xb07c35); g.fillEllipse(STX, FL - 76, 54, 10);
        g.fillStyle(0x8b5e1a);
        g.fillRect(STX - 24, FL - 72,  8, 60);
        g.fillRect(STX + 16, FL - 72,  8, 60);
        g.fillRect(STX - 20, FL - 42, 40,  5);
      }

      // ── PURPLE EXIT DOOR (x=960, warps to exterior) ──────────────────────────
      {
        const PDX = 960;
        g.fillStyle(0x8b5e1a);
        g.fillRect(PDX - 30, FL - 96, 8, 96); g.fillRect(PDX + 22, FL - 96, 8, 96);
        g.fillRect(PDX - 30, FL - 96, 60, 10);
        g.fillStyle(0x8811cc); g.fillRect(PDX - 22, FL - 86, 44, 86);
        g.fillStyle(0x6600aa); g.fillRect(PDX - 22, FL - 86, 6, 86);
        g.fillStyle(0xaa44ee);
        g.fillRect(PDX - 14, FL - 80, 28, 32); g.fillRect(PDX - 14, FL - 44, 28, 26);
        g.fillStyle(0xddaa22); g.fillCircle(PDX + 10, FL - 46, 4);
        g.fillStyle(0x7722bb); g.fillRoundedRect(PDX - 28, FL - 116, 56, 16, 4);
        g.fillStyle(0xddaaff); g.fillRect(PDX - 26, FL - 114, 52, 12);
        this.add.text(PDX, FL - 111, "EXIT ↑", { fontSize: "9px", color: "#7722bb", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);
      }

      // ── ROUND TABLE + TELEPHONE (RTX=1140) ───────────────────────────────────
      {
        const RTX = 1140;
        g.fillStyle(0x7a5014);
        g.fillRect(RTX - 7, FL - 102, 14, 70);
        g.fillRect(RTX - 32, FL - 34, 64, 10);
        g.fillRect(RTX - 26, FL - 26, 52,  8);
        g.fillStyle(0x8b5e1a); g.fillEllipse(RTX, FL - 102, 90, 18);
        g.fillStyle(0xa0722a); g.fillEllipse(RTX, FL - 104, 84, 14);
        const PHX = RTX - 8, PHY = FL - 126;
        g.fillStyle(0x1a1a1a); g.fillRoundedRect(PHX - 21, PHY - 28, 42, 22, 4);
        g.fillStyle(0x2a2a2a);
        g.fillRect(PHX - 23, PHY - 35, 10, 12); g.fillRect(PHX + 13, PHY - 35, 10, 12);
        g.fillStyle(0x444444); g.fillRect(PHX - 9, PHY - 39, 18, 7);
        g.fillStyle(0x333333); g.fillCircle(PHX, PHY - 16, 10);
        g.fillStyle(0x555555); g.fillCircle(PHX, PHY - 16, 7);
        g.fillStyle(0x111111);
        for (let d = 0; d < 9; d++) {
          const da = (d / 9) * Math.PI * 2 - Math.PI / 2;
          g.fillCircle(PHX + Math.cos(da) * 5, PHY - 16 + Math.sin(da) * 5, 1.5);
        }
      }

      // ── RED CHAIR (CHX=1290) ─────────────────────────────────────────────────
      {
        const CHX = 1290;
        g.fillStyle(0x6b3a1e);
        g.fillRect(CHX + 6, FL - 54, 10, 54); g.fillRect(CHX + 88, FL - 54, 10, 54);
        g.fillStyle(0xcc1111); g.fillRect(CHX, FL - 72, 104, 20);
        g.fillStyle(0x991111);
        g.fillRect(CHX - 7,  FL - 178, 14, 108); g.fillRect(CHX + 97, FL - 178, 14, 108);
        g.fillStyle(0xaa0f0f);
        g.fillRect(CHX - 9,  FL - 182, 22, 10); g.fillRect(CHX + 95, FL - 182, 22, 10);
        g.fillStyle(0xcc1111); g.fillRect(CHX + 4, FL - 268, 96, 198);
        g.fillStyle(0xee2222); g.fillRect(CHX + 8, FL - 264, 88, 190);
        g.fillStyle(0xaa0f0f);
        for (let bxi = 0; bxi < 3; bxi++) for (let byi = 0; byi < 4; byi++)
          g.fillCircle(CHX + 26 + bxi * 28, FL - 256 + byi * 52, 3);
      }

      // ── MR. PUZZLES NPC (seated in red chair, visible after bathroom key) ───────
      {
        const MPX = 1370, MPY = FL;
        this.mrPuzzlesGfx = this.add.graphics().setDepth(3).setVisible(this.bathroomUnlocked);
        const mg = this.mrPuzzlesGfx;
        const s = 2.0;   // scale factor (playable sprite is 36x42)
        const ox = MPX - 18 * s, oy = MPY - 42 * s;
        const r = (x: number, y: number, w: number, h: number, col: number) => {
          mg.fillStyle(col); mg.fillRect(ox + x * s, oy + y * s, w * s, h * s);
        };
        const ci = (x: number, y: number, rad: number, col: number) => {
          mg.fillStyle(col); mg.fillCircle(ox + x * s, oy + y * s, rad * s);
        };
        // Antenna
        r(17, 0, 2, 6, 0x666666);
        ci(18, 0, 2, 0xffdd00);
        // TV head (gray)
        r(5, 4, 26, 16, 0x888888);
        // Screen
        r(7, 6, 22, 12, 0x222222);
        // Color-bar mouth
        r(7, 13, 6, 5, 0xff4444);  r(13, 13, 5, 5, 0x44dd44);
        r(18, 13, 5, 5, 0xffdd00); r(23, 13, 6, 5, 0x4488ff);
        // Eyes
        ci(13, 9, 2, 0xaabbcc); ci(23, 9, 2, 0xaabbcc);
        mg.fillStyle(0x000000); mg.fillRect(ox + 12 * s, oy + 9 * s, 2 * s, 2 * s);
        mg.fillStyle(0x000000); mg.fillRect(ox + 22 * s, oy + 9 * s, 2 * s, 2 * s);
        // Black suit
        r(5, 20, 26, 16, 0x111111);
        // White shirt + bow tie
        r(13, 20, 10, 8, 0xffffff);
        mg.fillStyle(0x111111);
        mg.fillTriangle(ox+14*s, oy+20*s, ox+18*s, oy+23*s, ox+14*s, oy+26*s);
        mg.fillTriangle(ox+22*s, oy+20*s, ox+18*s, oy+23*s, ox+22*s, oy+26*s);
        // Arms
        r(0, 21, 6, 3, 0x111111); r(30, 21, 6, 3, 0x111111);
        r(0, 18, 5, 8, 0x333333); r(31, 18, 5, 8, 0x333333);
        // Pants + shoes
        r(9, 36, 18, 6, 0x111111);
        r(8, 39, 9, 3, 0x000000); r(19, 39, 9, 3, 0x000000);
      }

      // ── BEDROOM DOOR (x=W1_BEDROOM_X=1410, warp door to bedroom sub-room) ──────
      {
        const CDX = W1_BEDROOM_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(CDX - 30, FL - 98, 8, 98); g.fillRect(CDX + 22, FL - 98, 8, 98);
        g.fillRect(CDX - 30, FL - 98, 60, 10);
        g.fillStyle(0x8833bb); g.fillRect(CDX - 22, FL - 88, 44, 88);
        g.fillStyle(0x6611aa); g.fillRect(CDX - 22, FL - 88, 6, 88);
        g.fillStyle(0xaa55dd);
        g.fillRect(CDX - 14, FL - 82, 28, 32); g.fillRect(CDX - 14, FL - 46, 28, 28);
        g.fillStyle(0xddaa22); g.fillCircle(CDX + 12, FL - 48, 4);
        g.fillStyle(0x551188); g.fillRoundedRect(CDX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xddaaff); g.fillRect(CDX - 26, FL - 116, 52, 12);
        this.add.text(CDX, FL - 113, "BEDROOM", { fontSize: "8px", color: "#551188", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);
      }
      // Small purple strip immediately right of the door frame (visual cue only)
      g.fillStyle(0x6633cc); g.fillRect(W1_BEDROOM_X + 30, CEIL, 50, FL - CEIL);
      g.fillStyle(0x5522aa); g.fillRect(W1_BEDROOM_X + 30, FL - 16, 50, 16);

      // ═══ KITCHEN SUB-ROOM (x=W1_K_LEFT..W1_K_RIGHT) ════════════════════════
      {
        const KLX = W1_K_LEFT, KRX = W1_K_RIGHT;
        g.fillStyle(0xffee00); g.fillRect(KLX, CEIL, KRX - KLX, FL - CEIL);  // bright yellow walls
        g.fillStyle(0xe0c800); g.fillRect(KLX, FL - 16, KRX - KLX, 16);
        g.fillStyle(0xccaa00);
        g.fillRect(KLX,      CEIL, 40, FL - CEIL);
        g.fillRect(KRX - 40, CEIL, 40, FL - CEIL);
        for (let fx = KLX; fx < KRX; fx += 48) {
          g.fillStyle(fx % 96 === 0 ? 0xcc1100 : 0xb50e00);
          g.fillRect(fx, FL, 46, LEVEL_H - FL);
        }
        g.fillStyle(0xdd1800); g.fillRect(KLX, FL, KRX - KLX, 5);

        // Kitchen exit door
        const KREX = W1_KRETURN_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(KREX - 30, FL - 98, 8, 98); g.fillRect(KREX + 22, FL - 98, 8, 98);
        g.fillRect(KREX - 30, FL - 98, 60, 10);
        g.fillStyle(0xc8803a); g.fillRect(KREX - 22, FL - 88, 44, 88);
        g.fillStyle(0x9b6a2e);
        g.fillRect(KREX - 18, FL - 84, 36, 38); g.fillRect(KREX - 18, FL - 42, 36, 34);
        g.fillStyle(0xddaa66); g.fillCircle(KREX + 12, FL - 44, 4);
        g.fillStyle(0x443322); g.fillRoundedRect(KREX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xddccaa); g.fillRect(KREX - 26, FL - 116, 52, 12);
        this.add.text(KREX, FL - 113, "EXIT", { fontSize: "9px", color: "#443322", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);

        // Upper cabinet
        const CBX = KLX + 55, CBY = CEIL + 28;
        g.fillStyle(0xc8803a); g.fillRect(CBX, CBY, 165, 134);
        g.fillStyle(0xa86220); g.fillRect(CBX - 2, CBY + 134, 169, 7);
        g.fillStyle(0xb87230); g.fillRect(CBX + 4, CBY + 4, 157, 60);
        g.fillStyle(0xb87230); g.fillRect(CBX + 4, CBY + 68, 157, 62);
        g.fillStyle(0xddaa66); g.fillRect(CBX + 66, CBY + 28, 22, 5);
        g.fillStyle(0xddaa66); g.fillRect(CBX + 66, CBY + 92, 22, 5);

        // Yellow-curtain window
        const KWX = KLX + 260, KWY = 138, KWW = 88, KWH = 230;
        g.fillStyle(0xbbddff); g.fillRect(KWX, KWY, KWW, KWH);
        g.fillStyle(0x88ccff); g.fillRect(KWX + 2, KWY + 2, KWW - 4, KWH / 2 | 0);
        g.fillStyle(0x44aa22); g.fillRect(KWX + 2, KWY + KWH / 2, KWW - 4, KWH / 2 - 2);
        g.fillStyle(0xeecc00); g.fillRect(KWX, KWY, 20, KWH);
        g.fillStyle(0xeecc00); g.fillRect(KWX + KWW - 20, KWY, 20, KWH);
        g.fillStyle(0xffdd22); g.fillRect(KWX + 2, KWY, 6, KWH);
        g.fillStyle(0xffdd22); g.fillRect(KWX + KWW - 9, KWY, 6, KWH);
        g.fillStyle(0xaa8800); g.fillCircle(KWX + 20, KWY + (KWH * 0.6) | 0, 7);
        g.fillStyle(0xaa8800); g.fillCircle(KWX + KWW - 20, KWY + (KWH * 0.6) | 0, 7);
        g.fillStyle(0xffffff);
        g.fillRect(KWX - 5, KWY - 5, KWW + 10, 6);
        g.fillRect(KWX - 5, KWY + KWH, KWW + 10, 6);
        g.fillRect(KWX - 5, KWY - 5, 6, KWH + 10);
        g.fillRect(KWX + KWW - 1, KWY - 5, 6, KWH + 10);
        g.fillRect(KWX + (KWW / 2 | 0) - 2, KWY, 4, KWH);
        g.fillStyle(0xeeeeee); g.fillRect(KWX - 8, KWY + KWH + 4, KWW + 16, 8);

        // Counter — lowered to 120px so any character can reach it
        const CTX = KLX + 460, CTY = FL;
        g.fillStyle(0xc8803a); g.fillRect(CTX, CTY - 120, 154, 120);
        g.fillStyle(0xe8e4d8); g.fillRect(CTX - 4, CTY - 126, 162, 14);    // countertop
        g.fillStyle(0xb87230); g.fillRect(CTX +  4, CTY - 112, 68, 112);
        g.fillStyle(0xb87230); g.fillRect(CTX + 78, CTY - 112, 68, 112);
        g.fillStyle(0xddaa66); g.fillRect(CTX + 26, CTY - 66, 14, 4);
        g.fillStyle(0xddaa66); g.fillRect(CTX + 98, CTY - 66, 14, 4);
        g.fillStyle(0xd0ccc0); g.fillRect(CTX + 10, CTY - 122, 64, 8);     // sink
        g.fillStyle(0x888888); g.fillCircle(CTX + 40, CTY - 116, 4);
        // Tomatoes (sitting on countertop at CTY-126)
        g.fillStyle(0xdd2211); g.fillCircle(CTX + 18, CTY - 136, 10);
        g.fillStyle(0xee3322); g.fillCircle(CTX + 16, CTY - 137, 6);
        g.fillStyle(0x44aa22); g.fillRect(CTX + 16, CTY - 148, 4, 9);
        g.fillStyle(0xdd2211); g.fillCircle(CTX + 42, CTY - 135, 9);
        g.fillStyle(0x44aa22); g.fillRect(CTX + 40, CTY - 146, 4, 8);
        // Carrots
        g.fillStyle(0xff8811);
        g.fillTriangle(CTX + 70, CTY - 126, CTX + 76, CTY - 126, CTX + 73, CTY - 152);
        g.fillStyle(0x44aa22); g.fillRect(CTX + 71, CTY - 156, 3, 8);
        g.fillStyle(0xff8811);
        g.fillTriangle(CTX + 82, CTY - 126, CTX + 88, CTY - 126, CTX + 85, CTY - 148);
        g.fillStyle(0x44aa22); g.fillRect(CTX + 83, CTY - 152, 3, 7);
        // Cucumber
        g.fillStyle(0x228822); g.fillRect(CTX + 104, CTY - 148, 30, 14);
        g.fillStyle(0x33aa33); g.fillRect(CTX + 106, CTY - 146, 24, 8);
        g.fillStyle(0x55cc44); g.fillRect(CTX + 108, CTY - 142, 10, 3);
        g.fillStyle(0x44aa22);
        g.fillCircle(CTX + 116, CTY - 150, 5); g.fillCircle(CTX + 126, CTY - 150, 4);

        // Fridge
        const FX = KLX + 870, FY = FL;
        g.fillStyle(0xdde0ee); g.fillRect(FX, FY - 280, 76, 280);
        g.fillStyle(0xcccfdd); g.fillRect(FX + 2, FY - 278, 72, 106);
        g.fillStyle(0xd5d8eb); g.fillRect(FX + 2, FY - 170, 72, 168);
        g.fillStyle(0x888899); g.fillRect(FX + 62, FY - 246, 8, 36);
        g.fillStyle(0x888899); g.fillRect(FX + 62, FY - 150, 8, 36);
        g.fillStyle(0x9999aa); g.fillRect(FX, FY - 172, 76, 3);
        g.fillStyle(0x44ff44); g.fillCircle(FX + 10, FY - 262, 3);
        g.fillStyle(0xccccdd); g.fillRect(FX, FY - 280, 76, 6);

        // Luigi The Meat Mallet (x = KLX+650)
        {
          const LX = KLX + 650, LY = FL;
          g.fillStyle(0x8b5e1a); g.fillRect(LX - 3, LY - 105, 6, 100);
          g.fillStyle(0xa06820); g.fillRect(LX - 1, LY - 105, 2, 100);
          g.fillStyle(0x888888); g.fillRect(LX - 16, LY - 133, 32, 28);
          g.fillStyle(0x666666);
          for (let sx = 0; sx < 5; sx++) for (let sy = 0; sy < 4; sy++)
            g.fillRect(LX - 14 + sx * 6, LY - 131 + sy * 6, 4, 4);
          g.fillStyle(0xaaaaaa); g.fillRect(LX - 16, LY - 133, 32, 3);
          g.fillStyle(0x777777); g.fillRect(LX - 16, LY - 107, 32, 3);
          g.fillStyle(0xffcc88); g.fillRect(LX - 12, LY - 157, 24, 22);
          g.fillStyle(0xffaa66); g.fillEllipse(LX + 2, LY - 146, 10, 8);
          g.fillStyle(0xffffff); g.fillCircle(LX - 5, LY - 153, 4);
          g.fillStyle(0xffffff); g.fillCircle(LX + 7, LY - 153, 4);
          g.fillStyle(0x4488ff); g.fillCircle(LX - 5, LY - 153, 2.5);
          g.fillStyle(0x4488ff); g.fillCircle(LX + 7, LY - 153, 2.5);
          g.fillStyle(0x000000); g.fillCircle(LX - 5, LY - 153, 1.5);
          g.fillStyle(0x000000); g.fillCircle(LX + 7, LY - 153, 1.5);
          g.fillStyle(0x111111);
          g.fillEllipse(LX - 5, LY - 139, 12, 7);
          g.fillEllipse(LX + 7, LY - 139, 12, 7);
          g.fillStyle(0x5a3010);
          g.fillRect(LX - 12, LY - 139, 4, 2); g.fillRect(LX + 8, LY - 139, 4, 2);
          g.fillStyle(0x228822); g.fillRect(LX - 14, LY - 175, 28, 18);
          g.fillStyle(0x116611); g.fillRect(LX - 14, LY - 175, 28, 4);
          g.fillStyle(0x228822); g.fillRect(LX - 16, LY - 159, 32, 4);
          g.fillStyle(0xffffff);
          g.fillRect(LX - 4, LY - 171, 3, 10);
          g.fillRect(LX - 4, LY - 162, 7, 3);
        }
      }

      // ═══ BATHROOM SUB-ROOM (x=W1_B_LEFT..W1_B_RIGHT) ════════════════════════
      {
        const BLX = W1_B_LEFT, BRX = W1_B_RIGHT;
        for (let sx = BLX; sx < BRX; sx += 64) {
          g.fillStyle(0xffffff);  g.fillRect(sx,      CEIL, 32, FL - CEIL);
          g.fillStyle(0xffcce0);  g.fillRect(sx + 32, CEIL, 32, FL - CEIL);
        }
        g.fillStyle(0xddaabb); g.fillRect(BLX, FL - 10, BRX - BLX, 10);
        // Right bounding wall only (no left visual wall — door starts right at the edge)
        g.fillStyle(0xeeccdd); g.fillRect(BRX - 40, CEIL, 40, FL - CEIL);
        const CS = 32;
        for (let cx = BLX; cx < BRX; cx += CS)
          for (let cy = FL; cy < LEVEL_H; cy += CS) {
            g.fillStyle(((cx - BLX) / CS + (cy - FL) / CS) % 2 === 0 ? 0xffffff : 0xeeb8cc);
            g.fillRect(cx, cy, CS, CS);
          }

        // Bathroom exit door flush against left wall (W1_BRETURN_X=3525)
        const BREX = W1_BRETURN_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(BREX - 30, FL - 98, 8, 98); g.fillRect(BREX + 22, FL - 98, 8, 98);
        g.fillRect(BREX - 30, FL - 98, 60, 10);
        g.fillStyle(0xfcfcfc); g.fillRect(BREX - 22, FL - 88, 44, 88);
        g.fillStyle(0xeeeeee);
        g.fillRect(BREX - 18, FL - 84, 36, 38); g.fillRect(BREX - 18, FL - 42, 36, 34);
        g.fillStyle(0xddaa66); g.fillCircle(BREX + 12, FL - 44, 4);
        g.fillStyle(0x443322); g.fillRoundedRect(BREX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xddccaa); g.fillRect(BREX - 26, FL - 116, 52, 12);
        this.add.text(BREX, FL - 113, "EXIT", { fontSize: "9px", color: "#443322", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);

        // Toilet right next to exit door
        const TOX = BREX + 38, TOY = FL;
        g.fillStyle(0xf2f2f2); g.fillRect(TOX, TOY - 192, 52, 92);
        g.fillStyle(0xe5e5e5); g.fillRect(TOX + 2, TOY - 190, 48, 88);
        g.fillStyle(0xfafafa); g.fillRect(TOX - 3, TOY - 196, 58, 10);
        g.fillStyle(0xcccccc); g.fillCircle(TOX + 34, TOY - 190, 5);
        g.fillStyle(0xdddddd); g.fillCircle(TOX + 33, TOY - 191, 3);
        g.fillStyle(0xdadada); g.fillRect(TOX + 8, TOY - 100, 34, 6);
        g.fillStyle(0xefefef); g.fillEllipse(TOX + 28, TOY - 80, 74, 98);
        g.fillStyle(0xe2e2e2); g.fillEllipse(TOX + 28, TOY - 74, 60, 78);
        g.fillStyle(0xccddff, 0.6); g.fillEllipse(TOX + 28, TOY - 66, 48, 58);
        g.fillStyle(0xf5f5f5); g.fillEllipse(TOX + 28, TOY - 96, 74, 22);
        g.fillStyle(0xfefefe); g.fillEllipse(TOX + 28, TOY - 98, 66, 16);
        g.fillStyle(0xeaeaea); g.fillRect(TOX + 8, TOY - 30, 40, 30);

        // Pink bathtub
        const BTX = BREX + 140, BTWW = 148, BTH = 108, BTOY = FL;
        g.fillStyle(0xffaabb); g.fillRect(BTX, BTOY - BTH, BTWW, BTH);
        g.fillStyle(0xffbbcc); g.fillRect(BTX + 5, BTOY - BTH + 5, BTWW - 10, BTH - 10);
        g.fillStyle(0xaaddff, 0.7); g.fillRect(BTX + 8, BTOY - BTH + 14, BTWW - 16, BTH - 28);
        g.fillStyle(0xbbeeff, 0.5); g.fillRect(BTX + 12, BTOY - BTH + 17, 54, 9);
        g.fillStyle(0xffccdd); g.fillRect(BTX - 4, BTOY - BTH - 6, BTWW + 8, 10);
        g.fillStyle(0xbbbbbb); g.fillRect(BTX + 4, BTOY - BTH - 18, 12, 16);
        g.fillStyle(0xaaaaaa); g.fillRect(BTX, BTOY - BTH - 22, 20, 7);
        g.fillStyle(0x888888); g.fillCircle(BTX + BTWW / 2, BTOY - 14, 7);
        g.fillStyle(0x555555); g.fillCircle(BTX + BTWW / 2, BTOY - 14, 4);
        g.fillStyle(0xdd99aa);
        g.fillEllipse(BTX + 12, BTOY, 14, 8); g.fillEllipse(BTX + BTWW - 12, BTOY, 14, 8);

        // Towel rack
        const TRX = BREX + 360, TRY = FL;
        g.fillStyle(0xaaaaaa); g.fillRect(TRX - 3, TRY - 212, 6, 182);
        g.fillStyle(0x999999);
        g.fillRect(TRX - 32, TRY - 190, 64, 7);
        g.fillRect(TRX - 32, TRY - 150, 64, 7);
        g.fillRect(TRX - 32, TRY - 110, 64, 7);
        g.fillStyle(0xff6688); g.fillRect(TRX - 28, TRY - 188, 56, 34);
        g.fillStyle(0xff88aa); g.fillRect(TRX - 24, TRY - 186, 42, 26);
        g.fillStyle(0x6688ff); g.fillRect(TRX - 28, TRY - 148, 56, 34);
        g.fillStyle(0x88aaff); g.fillRect(TRX - 24, TRY - 146, 42, 26);
        g.fillStyle(0xffcc44); g.fillRect(TRX - 28, TRY - 108, 56, 34);
        g.fillStyle(0xffdd66); g.fillRect(TRX - 24, TRY - 106, 42, 26);

        // Boopkins — separate tracked graphics so we can animate/move him
        {
          const BKX = BREX + 500, BKY = FL;
          this.boopkinsGfx = this.add.graphics().setDepth(2);
          const bg = this.boopkinsGfx;
          this.drawBoopkins(bg, BKX, BKY);
        }
      }

      // ═══ BEDROOM SUB-ROOM (x=W1_BROOM_LEFT..W1_BROOM_RIGHT) ═════════════════
      {
        const BRX = W1_BROOM_LEFT, BRRX = W1_BROOM_RIGHT;
        // Purple walls
        g.fillStyle(0x6633cc); g.fillRect(BRX, CEIL, BRRX - BRX, FL - CEIL);
        g.fillStyle(0x5522aa); g.fillRect(BRX, FL - 16, BRRX - BRX, 16);
        // Bounding walls (dark purple)
        g.fillStyle(0x3311aa);
        g.fillRect(BRX,        CEIL, 40, FL - CEIL);
        g.fillRect(BRRX - 40,  CEIL, 40, FL - CEIL);
        // Red plank floor
        for (let fx = BRX; fx < BRRX; fx += 48) {
          g.fillStyle(fx % 96 === 0 ? 0xcc1100 : 0xb50e00);
          g.fillRect(fx, FL, 46, LEVEL_H - FL);
        }
        g.fillStyle(0xdd1800); g.fillRect(BRX, FL, BRRX - BRX, 5);

        // Bedroom exit door (left side)
        const BREX = W1_BROOM_RETURN_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(BREX - 30, FL - 98, 8, 98); g.fillRect(BREX + 22, FL - 98, 8, 98);
        g.fillRect(BREX - 30, FL - 98, 60, 10);
        g.fillStyle(0x8833bb); g.fillRect(BREX - 22, FL - 88, 44, 88);
        g.fillStyle(0x6611aa); g.fillRect(BREX - 22, FL - 88, 6, 88);
        g.fillStyle(0xaa55dd);
        g.fillRect(BREX - 14, FL - 82, 28, 32); g.fillRect(BREX - 14, FL - 46, 28, 28);
        g.fillStyle(0xddaa22); g.fillCircle(BREX + 12, FL - 48, 4);
        g.fillStyle(0x551188); g.fillRoundedRect(BREX - 28, FL - 118, 56, 16, 4);
        g.fillStyle(0xddaaff); g.fillRect(BREX - 26, FL - 116, 52, 12);
        this.add.text(BREX, FL - 113, "EXIT", { fontSize: "9px", color: "#551188", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);

        // ── WAR SCENE PAINTING (lowered for accessibility, uses global constants) ─
        {
          const WPX = W1_WP_CX - 50, WPY = W1_WP_TY;  // 4670, 470
          // Frame
          g.fillStyle(0x3a1a0a); g.fillRect(WPX - 6, WPY - 6, 112, 112);
          // Canvas
          g.fillStyle(0x1a1a2e); g.fillRect(WPX, WPY, 100, 100);
          // Ground (brown)
          g.fillStyle(0x4a3820); g.fillRect(WPX, WPY + 78, 100, 22);
          // Soldiers (silhouettes)
          g.fillStyle(0x111111);
          g.fillRect(WPX + 10, WPY + 60, 5, 18); g.fillCircle(WPX + 12, WPY + 58, 5);
          g.fillRect(WPX + 12, WPY + 70, 16, 2);
          g.fillRect(WPX + 32, WPY + 58, 5, 20); g.fillCircle(WPX + 34, WPY + 55, 5);
          g.fillRect(WPX + 34, WPY + 68, 14, 2);
          g.fillRect(WPX + 58, WPY + 60, 5, 18); g.fillCircle(WPX + 60, WPY + 57, 5);
          g.fillRect(WPX + 55, WPY + 68, 13, 2);
          // Burning building
          g.fillStyle(0x2a2a2a); g.fillRect(WPX + 66, WPY + 64, 24, 14);
          // Fire
          g.fillStyle(0xff6600, 0.85); g.fillCircle(WPX + 74, WPY + 22, 16);
          g.fillStyle(0xffaa22, 0.65); g.fillCircle(WPX + 80, WPY + 15, 11);
          g.fillStyle(0xffff00, 0.5); g.fillCircle(WPX + 72, WPY + 18, 6);
          // Stars
          g.fillStyle(0xffffff, 0.7);
          for (const [sx,sy] of [[12,10],[34,8],[56,14],[22,22],[48,11]] as [number,number][])
            g.fillCircle(WPX + sx, WPY + sy, 1.5);
          // Corner nails
          g.fillStyle(0x9b6a2a);
          for (const [cx2,cy2] of [[-6,-6],[106,-6],[-6,106],[106,106]] as [number,number][])
            g.fillCircle(WPX + cx2, WPY + cy2, 5);
        }

        // ── PURPLE WALL CURTAIN DRAPE ─────────────────────────────────────────
        {
          const PCX = BRX + 200;
          g.fillStyle(0xaa8820); g.fillRect(PCX - 4, CEIL, 54, 5);
          g.fillStyle(0x8811cc); g.fillRect(PCX, CEIL + 4, 46, FL - CEIL - 4);
          g.fillStyle(0x6600aa); g.fillRect(PCX, CEIL + 4, 8, FL - CEIL - 4);
          g.fillStyle(0xbb55ff); g.fillRect(PCX + 14, CEIL + 4, 8, FL - CEIL - 4);
          g.fillStyle(0xbb55ff); g.fillRect(PCX + 30, CEIL + 4, 8, FL - CEIL - 4);
          g.fillStyle(0xffdd44); g.fillCircle(PCX + 23, FL - 250, 8);
        }

        // ── VIOLET TABLE ──────────────────────────────────────────────────────
        {
          const VTX = BRX + 252, VTY = FL;
          g.fillStyle(0x5500aa); g.fillRect(VTX, VTY - 72, 54, 8);
          g.fillStyle(0x4400aa); g.fillRect(VTX + 2, VTY - 70, 50, 6);
          g.fillStyle(0x440088);
          g.fillRect(VTX + 4,  VTY - 62, 8, 62);
          g.fillRect(VTX + 42, VTY - 62, 8, 62);
          g.fillRect(VTX + 4,  VTY - 38, 46, 5);
          g.fillStyle(0xcc77ff); g.fillEllipse(VTX + 27, VTY - 86, 20, 14);
          g.fillStyle(0x9933cc); g.fillRect(VTX + 21, VTY - 80, 12, 8);
          g.fillStyle(0xff77aa); g.fillCircle(VTX + 27, VTY - 91, 6);
          g.fillStyle(0xffaacc); g.fillCircle(VTX + 25, VTY - 93, 3);
        }

        // ── PURPLE BED ────────────────────────────────────────────────────────
        {
          const PBDX = BRX + 330, PBDY = FL;
          g.fillStyle(0x330066);
          g.fillRect(PBDX + 2, PBDY - 8, 8, 8); g.fillRect(PBDX + 110, PBDY - 8, 8, 8);
          g.fillStyle(0x440077); g.fillRect(PBDX, PBDY - 60, 120, 52);
          g.fillStyle(0x6611aa); g.fillRect(PBDX + 2, PBDY - 58, 116, 44);
          g.fillStyle(0x550088); g.fillRect(PBDX, PBDY - 118, 120, 60);
          g.fillStyle(0x7722aa); g.fillRect(PBDX + 4, PBDY - 114, 112, 52);
          g.fillStyle(0x8833bb);
          g.fillRect(PBDX + 8,  PBDY - 110, 46, 42);
          g.fillRect(PBDX + 62, PBDY - 110, 46, 42);
          g.fillStyle(0xddbbff); g.fillRoundedRect(PBDX + 6,  PBDY - 54, 52, 22, 6);
          g.fillStyle(0xeeccff); g.fillRoundedRect(PBDX + 8,  PBDY - 52, 46, 16, 4);
          g.fillStyle(0x9933cc); g.fillRect(PBDX + 4, PBDY - 38, 112, 30);
          g.fillStyle(0xaa44dd); g.fillRect(PBDX + 4, PBDY - 38, 112, 4);
          g.fillStyle(0x440077);
          g.fillRect(PBDX, PBDY - 60, 6, 60); g.fillRect(PBDX + 114, PBDY - 60, 6, 60);
        }

        // ── WINDOW WITH RED CURTAINS (right side) ─────────────────────────────
        {
          const WX = BRX + 480, WY = 140, WW = 86, WH = 240;
          g.fillStyle(0xbbddff); g.fillRect(WX, WY, WW, WH);
          g.fillStyle(0x88ccff); g.fillRect(WX + 2, WY + 2, WW - 4, WH / 2 | 0);
          g.fillStyle(0x44aa22); g.fillRect(WX + 2, WY + WH / 2, WW - 4, WH / 2 - 2);
          g.fillStyle(0xcc1122); g.fillRect(WX,           WY, 20, WH);
          g.fillStyle(0xcc1122); g.fillRect(WX + WW - 20, WY, 20, WH);
          g.fillStyle(0xee3344); g.fillRect(WX + 2,       WY, 7, WH);
          g.fillStyle(0xee3344); g.fillRect(WX + WW - 10, WY, 7, WH);
          g.fillStyle(0xffcc44); g.fillCircle(WX + 20,      WY + (WH * 0.62) | 0, 7);
          g.fillStyle(0xffcc44); g.fillCircle(WX + WW - 20, WY + (WH * 0.62) | 0, 7);
          g.fillStyle(0xffffff);
          g.fillRect(WX - 5, WY - 5, WW + 10, 6);
          g.fillRect(WX - 5, WY + WH, WW + 10, 6);
          g.fillRect(WX - 5, WY - 5, 6, WH + 10);
          g.fillRect(WX + WW - 1, WY - 5, 6, WH + 10);
          g.fillRect(WX + (WW / 2 | 0) - 2, WY, 4, WH);
          g.fillStyle(0xeeeeee); g.fillRect(WX - 8, WY + WH + 4, WW + 16, 8);
        }
      }

      // ═══ WAR PAINTING SUB-ZONE (x=W1_WAR_LEFT..W1_WAR_RIGHT, extended) ══════
      {
        const WLX = W1_WAR_LEFT, WRX = W1_WAR_RIGHT;
        // Dark smoky orange-red war sky
        g.fillStyle(0x1a0500); g.fillRect(WLX, CEIL, WRX - WLX, FL - CEIL);
        // Smoke clouds across the extended zone
        g.fillStyle(0x2a1000, 0.8);
        for (const [cx2,cy2,cw,ch] of [
          [WLX+150,200,200,60],[WLX+500,160,260,70],[WLX+900,190,200,50],
          [WLX+1300,170,280,65],[WLX+1700,200,220,60],[WLX+2100,180,240,70],
          [WLX+2500,165,260,65],[WLX+2800,200,200,58],
        ] as [number,number,number,number][])
          g.fillEllipse(cx2, cy2, cw, ch);
        // Orange fire glow on horizon
        g.fillStyle(0xff5500, 0.22); g.fillRect(WLX, FL - 260, WRX - WLX, 260);
        g.fillStyle(0xff2200, 0.12); g.fillRect(WLX, FL - 400, WRX - WLX, 180);
        // Damaged ground
        g.fillStyle(0x1a1000); g.fillRect(WLX, FL, WRX - WLX, LEVEL_H - FL);
        g.fillStyle(0x2a1800); g.fillRect(WLX, FL - 6, WRX - WLX, 6);
        // Ceiling
        g.fillStyle(0x0a0500); g.fillRect(WLX, CEIL, WRX - WLX, 14);

        // Return exit door (left wall)
        const WLEX = W1_WAR_RETURN_X;
        g.fillStyle(0x8b5e1a);
        g.fillRect(WLEX - 30, FL - 96, 8, 96); g.fillRect(WLEX + 22, FL - 96, 8, 96);
        g.fillRect(WLEX - 30, FL - 96, 60, 10);
        g.fillStyle(0x443311); g.fillRect(WLEX - 22, FL - 86, 44, 86);
        g.fillStyle(0x221100); g.fillRect(WLEX - 22, FL - 86, 6, 86);
        g.fillStyle(0x665533);
        g.fillRect(WLEX - 14, FL - 80, 28, 32); g.fillRect(WLEX - 14, FL - 44, 28, 28);
        g.fillStyle(0xddaa22); g.fillCircle(WLEX + 12, FL - 48, 4);
        this.add.text(WLEX, FL - 113, "EXIT", { fontSize: "9px", color: "#aa8855", fontStyle: "bold" }).setOrigin(0.5, 0).setDepth(2);

        // Helper: small ruined wall fragment (1/4 size — 45px wide, ~70px tall)
        const ruinedBuilding = (bx: number, height: number, tint: number) => {
          const W = 45, H = Math.round(height / 4);
          g.fillStyle(tint);            g.fillRect(bx, FL - H, W, H);
          g.fillStyle(tint - 0x111110); g.fillRect(bx, FL - H, 8, H);
          g.fillStyle(tint + 0x111108); g.fillRect(bx + 8, FL - H, W - 8, H);
          // Jagged broken top
          g.fillStyle(0x1a0500);
          g.fillTriangle(bx + 6, FL - H, bx + 16, FL - H - 14, bx + 26, FL - H);
          g.fillTriangle(bx + 26, FL - H, bx + 36, FL - H - 10, bx + 44, FL - H);
          // Small dark window (if tall enough)
          if (H > 40) {
            g.fillStyle(0x110800);
            g.fillRect(bx + 11, FL - H + 12, 10, 8); g.fillRect(bx + 27, FL - H + 12, 10, 8);
          }
          // Fire glow in window
          g.fillStyle(0xff4400, 0.6); g.fillCircle(bx + 32, FL - H + 18, 5);
          // Rubble
          g.fillStyle(tint - 0x222220);
          g.fillEllipse(bx + 10, FL, 22, 8); g.fillEllipse(bx + 34, FL, 16, 6);
        };

        // 5 ruined wall fragments across the zone (1/4 size, same x positions)
        ruinedBuilding(WLX + 230, 290, 0x888880);
        ruinedBuilding(WLX + 700, 260, 0x7a7a70);
        ruinedBuilding(WLX + 1180, 310, 0x888875);
        ruinedBuilding(WLX + 1660, 250, 0x7a7868);
        ruinedBuilding(WLX + 2140, 280, 0x858575);

        // ── RIVER GAP (x=6500..6700) ───────────────────────────────────────────
        {
          const RX = WLX + 500, RW = 200;
          g.fillStyle(0x001830); g.fillRect(RX, FL, RW, LEVEL_H - FL);
          g.fillStyle(0x002040); g.fillRect(RX, FL, RW, 8);
          g.fillStyle(0x004468, 0.5);
          for (let ri = 0; ri < 5; ri++)
            g.fillEllipse(RX + 20 + ri * 38, FL + 14, 28, 6);
          // Cut sky through river column
          g.fillStyle(0x1a0500); g.fillRect(RX, CEIL, RW, FL - CEIL);
          // Broken bridge planks — low enough to jump onto (y=FL-50)
          g.fillStyle(0x5a3a1a);
          g.fillRect(RX - 10, FL - 52, 58, 12); g.fillRect(RX - 8, FL - 50, 54, 8);
          g.fillRect(RX + 68, FL - 70, 58, 12); g.fillRect(RX + 70, FL - 68, 54, 8);
          g.fillRect(RX + 148, FL - 52, 58, 12); g.fillRect(RX + 150, FL - 50, 54, 8);
          g.fillStyle(0x3a2000); g.fillRect(RX + 18, FL - 50, 4, 8); g.fillRect(RX + 90, FL - 68, 4, 8);
        }

        // ── CHRIS NPC (far right, off-screen at start) ─────────────────────────
        {
          const CX = WLX + 2400, CY = FL;
          this.chrisGfx = this.add.graphics().setDepth(3);
          this.drawChrisNpc(this.chrisGfx, CX, CY);
        }

        // ── SWAGMASTER NPC ─────────────────────────────────────────────────────
        {
          const SX = WLX + 2600, SY = FL;
          this.swagGfx = this.add.graphics().setDepth(3);
          this.drawSwagNpc(this.swagGfx, SX, SY);
        }

        // ── GUN PICKUP (before Chris/Swag) ────────────────────────────────────
        {
          const GX = WLX + 2200, GY = FL;
          this.gunPickupGfx = this.add.graphics().setDepth(3);
          const gg = this.gunPickupGfx;
          gg.fillStyle(0x444444); gg.fillRect(GX - 16, GY - 18, 32, 10);
          gg.fillStyle(0x333333); gg.fillRect(GX + 10, GY - 18, 10, 16);
          gg.fillStyle(0x222222); gg.fillRect(GX - 16, GY - 8, 6, 8);
          gg.fillStyle(0x666666); gg.fillRect(GX - 14, GY - 16, 20, 6);
          this.add.text(GX, GY - 26, "Z  Grab Gun", {
            fontSize: "9px", color: "#ffdd44", stroke: "#000", strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(4).setName("gun-label");
        }

        // (spaghetti clue removed)

        // ── MEGGY'S BUNKER (WLX+3100 to WLX+3350) ────────────────────────────
        {
          const BX = WLX + 3100, BW = 250, BH = 130;
          // Bunker walls (concrete)
          g.fillStyle(0x606055); g.fillRect(BX, FL - BH, BW, BH);
          g.fillStyle(0x505048); g.fillRect(BX, FL - BH, 14, BH);
          g.fillStyle(0x707065); g.fillRect(BX + 14, FL - BH, BW - 28, BH);
          g.fillStyle(0x505048); g.fillRect(BX + BW - 14, FL - BH, 14, BH);
          // Roof
          g.fillStyle(0x484840); g.fillRect(BX - 6, FL - BH - 10, BW + 12, 14);
          // Left door opening
          g.fillStyle(0x1a0500); g.fillRect(BX + 14, FL - 80, 44, 80);
          // Right door opening
          g.fillStyle(0x1a0500); g.fillRect(BX + BW - 58, FL - 80, 44, 80);
          // Window slits
          g.fillStyle(0x110800);
          g.fillRect(BX + 20, FL - BH + 16, 28, 10);
          g.fillRect(BX + BW - 48, FL - BH + 16, 28, 10);
          // Interior shadow
          g.fillStyle(0x0e0800, 0.6); g.fillRect(BX + 58, FL - 80, BW - 116, 80);
          // Bunker label
          g.fillStyle(0x888877); g.fillRect(BX + BW/2 - 26, FL - BH - 4, 52, 8);
          this.add.text(BX + BW/2, FL - BH + 2, "BUNKER", {
            fontSize: "7px", color: "#aaaaaa",
          }).setOrigin(0.5, 0.5).setDepth(3);

          // Meggy NPC inside bunker
          this.meggyGfx = this.add.graphics().setDepth(4);
          this.drawMeggyNpc(this.meggyGfx, BX + BW/2, FL);
          // Down arrow talk prompt
          this.add.text(BX + BW/2, FL - BH + 38, "↓ Talk", {
            fontSize: "9px", color: "#ff9933", stroke: "#000", strokeThickness: 2,
          }).setOrigin(0.5, 0.5).setDepth(4);
        }

        // ── SHROOMY SECTION — cover buildings and tower ────────────────────────
        {
          const SFX = WLX + 3500; // section start x

          // Additional battlefield atmosphere
          g.fillStyle(0x2a0800, 0.4);
          g.fillEllipse(SFX + 250, 200, 300, 70);
          g.fillEllipse(SFX + 800, 170, 280, 60);
          g.fillEllipse(SFX + 1300, 195, 260, 65);

          // 4 small cover buildings for Shroomy section
          ruinedBuilding(SFX + 100, 320, 0x777768);
          ruinedBuilding(SFX + 400, 280, 0x6e6e60);
          ruinedBuilding(SFX + 700, 340, 0x7a7a6a);
          ruinedBuilding(SFX + 950, 300, 0x726858);

          // ── TOWER ───────────────────────────────────────────────────────────
          const TX = W1_SHROOMY_TOWER_X; // tower left edge
          const TH = 340;                // tower height
          // Tower body (stone)
          g.fillStyle(0x5a5a48); g.fillRect(TX, FL - TH, 80, TH);
          g.fillStyle(0x4a4a3a); g.fillRect(TX, FL - TH, 10, TH);
          g.fillStyle(0x6a6a58); g.fillRect(TX + 10, FL - TH, 70, TH);
          // Stone block pattern
          g.fillStyle(0x404030, 0.6);
          for (let ty = 0; ty < TH; ty += 28) {
            g.fillRect(TX, FL - TH + ty, 80, 2);
            if ((ty / 28) % 2 === 0) {
              g.fillRect(TX + 40, FL - TH + ty, 2, 28);
            } else {
              g.fillRect(TX + 20, FL - TH + ty, 2, 28);
              g.fillRect(TX + 60, FL - TH + ty, 2, 28);
            }
          }
          // Battlements at top
          for (let bi = 0; bi < 5; bi++) {
            g.fillStyle(0x6a6a58); g.fillRect(TX + bi * 16, FL - TH - 16, 10, 18);
          }
          // Tower arrow slits
          g.fillStyle(0x110800);
          g.fillRect(TX + 30, FL - TH + 30, 10, 20);
          g.fillRect(TX + 30, FL - TH + 90, 10, 20);
          g.fillRect(TX + 30, FL - TH + 160, 10, 20);
          g.fillRect(TX + 30, FL - TH + 230, 10, 20);

          // Climbing ledges on the LEFT of the tower
          g.fillStyle(0x5a4a2a);
          // Ledge 1 at FL-120 (jutting left)
          g.fillRect(TX - 70, FL - 120, 72, 12);
          g.fillRect(TX - 68, FL - 122, 68, 4); // top edge highlight
          // Ledge 2 at FL-240
          g.fillRect(TX - 60, FL - 240, 62, 12);
          g.fillRect(TX - 58, FL - 242, 58, 4);
          // Top platform at FL-TH (tower top)
          g.fillRect(TX, FL - TH - 2, 80, 12);
          g.fillRect(TX + 2, FL - TH - 4, 76, 4);

          // Shroomy NPC standing on tower top platform
          this.shroomyGfx = this.add.graphics().setDepth(4);
          this.drawShroomyNpc(this.shroomyGfx, TX + 40, FL - TH - 2);

          // Z label above Shroomy (hidden until he is defeated)
          this.shroomyZLabel = this.add.text(TX + 40, FL - TH - 70, "Z  Inspect", {
            fontSize: "9px", color: "#ffffff", stroke: "#000", strokeThickness: 2,
          }).setOrigin(0.5, 0).setDepth(5).setVisible(false);

          // ── ENDING ZONE behind the tower ─────────────────────────────────────
          {
            const EX = TX + 100; // behind tower (tower ends at TX+80)
            // Glowing golden doorway
            g.fillStyle(0x111100); g.fillRect(EX, FL - 110, 60, 110);
            g.fillStyle(0xffdd00, 0.9); g.fillRect(EX - 4, FL - 116, 68, 8);
            g.fillStyle(0xffdd00, 0.7); g.fillRect(EX - 4, FL - 116, 6, 110);
            g.fillRect(EX + 58, FL - 116, 6, 110);
            // Pulsing star
            g.fillStyle(0xffee44); g.fillCircle(EX + 30, FL - 70, 12);
            g.fillStyle(0xffffff); g.fillCircle(EX + 30, FL - 70, 5);
            g.fillStyle(0xffdd00, 0.5);
            g.fillEllipse(EX + 30, FL - 70, 40, 6);
            g.fillEllipse(EX + 30, FL - 70, 6, 40);
            this.add.text(EX + 30, FL - 130, "END", {
              fontSize: "10px", color: "#ffdd00", fontStyle: "bold",
              stroke: "#440000", strokeThickness: 3,
            }).setOrigin(0.5, 0).setDepth(4);
          }
        }
      }

      return;
    }

    const skyColors = [0x1a0a3a, 0x5c94fc, 0x0a2a0a, 0x3a1a00, 0x0a1a3a, 0x2a0a2a, 0x3a0a0a];
    const bg = this.add.graphics();
    bg.fillStyle(skyColors[(this.worldId - 1) % skyColors.length]);
    bg.fillRect(0, 0, LEVEL_W, LEVEL_H);
    bg.fillStyle(0x050508); bg.fillRect(0, 0, LEVEL_W, 50); // ceiling
  }

  private buildWorldLevel() {
    this.platforms = this.physics.add.staticGroup();
    this.mushrooms = this.physics.add.staticGroup();
    const tileCount = Math.ceil(LEVEL_W / 64);
    for (let i = 0; i < tileCount; i++) {
      this.platforms.create(i * 64 + 32, LEVEL_H - 20, "ground-tile");
    }
    if (this.worldId === 8) {
      // ── Hill slope platforms (invisible steps following the ellipse curve) ──
      const HCX = 940, HCY = 800, HRX = 640, HRY = 430;
      for (let hx = 325; hx <= 1555; hx += 10) {
        const t = (hx - HCX) / HRX;
        const hy = HCY - HRY * Math.sqrt(Math.max(0, 1 - t * t));
        if (hy < GROUND_TOP + 5) {
          const sp = this.platforms.create(hx, hy, "ground-tile") as Phaser.Physics.Arcade.Sprite;
          sp.setAlpha(0).setDisplaySize(14, 6).refreshBody();
        }
      }
      // ── Return TV (Puzzlevision, right of house) ────────────────────────
      this.buildReturnTV();
      return; // no text overlay
    }

    if (this.worldId === 9) {
      // Hide main-floor brick tiles (visual floor drawn in background)
      this.platforms.getChildren().forEach(p =>
        (p as Phaser.Physics.Arcade.Sprite).setAlpha(0));

      // Sub-room floors
      for (let kx = W1_K_LEFT; kx < W1_K_RIGHT; kx += 64)
        (this.platforms.create(kx + 32, LEVEL_H - 20, "ground-tile") as Phaser.Physics.Arcade.Sprite).setAlpha(0);
      for (let bx = W1_B_LEFT; bx < W1_B_RIGHT; bx += 64)
        (this.platforms.create(bx + 32, LEVEL_H - 20, "ground-tile") as Phaser.Physics.Arcade.Sprite).setAlpha(0);

      // Invisible wall barriers at every room boundary (full-height, 24px wide)
      const wall = (x: number) => {
        const w = this.platforms.create(x, LEVEL_H / 2, "ground-tile") as Phaser.Physics.Arcade.Sprite;
        w.setAlpha(0).setDisplaySize(24, LEVEL_H).refreshBody();
      };
      wall(1920);                   // right edge of main floor
      wall(W1_BEDROOM_X + 52);     // blocks walking past bedroom door
      wall(W1_K_LEFT);             // left edge of kitchen
      wall(W1_K_RIGHT);            // right edge of kitchen
      wall(W1_B_LEFT);             // left edge of bathroom
      wall(W1_B_RIGHT);            // right edge of bathroom
      wall(W1_BROOM_LEFT);         // left edge of bedroom sub-room
      wall(W1_BROOM_RIGHT);        // right edge of bedroom sub-room

      // Bedroom sub-room floor tiles
      for (let rx = W1_BROOM_LEFT; rx < W1_BROOM_RIGHT; rx += 64)
        (this.platforms.create(rx + 32, LEVEL_H - 20, "ground-tile") as Phaser.Physics.Arcade.Sprite).setAlpha(0);

      // Furniture platforms (invisible)
      const plat = (cx: number, cy: number, w: number, h = 8) => {
        const p = this.platforms.create(cx, cy, "ground-tile") as Phaser.Physics.Arcade.Sprite;
        p.setAlpha(0).setDisplaySize(w, h).refreshBody();
      };
      // Main room
      plat(670,              W1_FL - 178, 100);  // desk top
      plat(810,              W1_FL -  77,  58);  // stool seat
      plat(1140,             W1_FL - 107,  88);  // round table top
      plat(1342,             W1_FL -  68, 104);  // chair seat
      // Wardrobe top in hall
      plat(292,              W1_FL - 222,  70);  // wardrobe crown
      // Kitchen
      plat(W1_K_LEFT + 537, W1_FL - 122, 162);  // countertop (lowered)
      plat(W1_K_LEFT + 908, W1_FL - 276,  76);  // fridge top
      // Bedroom sub-room furniture
      plat(W1_BROOM_LEFT + 279, W1_FL -  64,  54);   // violet table top
      plat(W1_BROOM_LEFT + 390, W1_FL -  52, 116);   // purple bed surface
      plat(W1_WP_CX,            W1_WP_TY - 12, 100); // painting shelf (jump platform to reach painting)

      // War zone floor tiles (skip river gap 6500-6700)
      for (let wx = W1_WAR_LEFT; wx < W1_WAR_RIGHT; wx += 64) {
        if (wx >= W1_WAR_LEFT + 500 && wx < W1_WAR_LEFT + 700) continue; // river gap
        (this.platforms.create(wx + 32, LEVEL_H - 20, "ground-tile") as Phaser.Physics.Arcade.Sprite).setAlpha(0);
      }
      // War zone boundary walls only
      wall(W1_WAR_LEFT);         // left edge
      wall(W1_WAR_RIGHT - 12);   // right edge
      // Broken bridge platforms over river
      const RXB = W1_WAR_LEFT + 500;
      plat(RXB + 19,  W1_FL - 52,  54);
      plat(RXB + 93,  W1_FL - 70,  54);
      plat(RXB + 168, W1_FL - 52,  54);

      // ── War zone building walls (solid, 1/4 size — player + bullets blocked) ─
      this.warBuildingWalls = this.physics.add.staticGroup();
      const bwall = (bx: number, height: number) => {
        const H = Math.round(height / 4), W2 = 45;
        const wb = this.warBuildingWalls!.create(bx + W2/2, W1_FL - H/2, "ground-tile") as Phaser.Physics.Arcade.Sprite;
        wb.setAlpha(0).setDisplaySize(W2, H).refreshBody();
      };
      // 5 main zone buildings
      bwall(W1_WAR_LEFT + 230, 290);
      bwall(W1_WAR_LEFT + 700, 260);
      bwall(W1_WAR_LEFT + 1180, 310);
      bwall(W1_WAR_LEFT + 1660, 250);
      bwall(W1_WAR_LEFT + 2140, 280);
      // Shroomy section cover buildings (SFX = WLX+3500)
      const SFX = W1_WAR_LEFT + 3500;
      bwall(SFX + 100, 320);
      bwall(SFX + 400, 280);
      bwall(SFX + 700, 340);
      bwall(SFX + 950, 300);
      // Tower solid walls (left side only — right stays open so player can't continue)
      const towerPlat = (cx: number, cy: number, w: number, h = 8) => {
        const tp = this.warBuildingWalls!.create(cx, cy, "ground-tile") as Phaser.Physics.Arcade.Sprite;
        tp.setAlpha(0).setDisplaySize(w, h).refreshBody();
      };
      const TX = W1_SHROOMY_TOWER_X;
      // Tower body walls (only outer surfaces, so player can jump on ledges)
      towerPlat(TX + 40, W1_FL - 170, 80, 340);      // tower body (solid block)
      // Climbing ledges (jumpable platforms)
      towerPlat(TX - 35, W1_FL - 120, 72, 12);        // ledge 1
      towerPlat(TX - 30, W1_FL - 240, 62, 12);        // ledge 2
      towerPlat(TX + 40, W1_FL - 340, 80, 12);        // tower top platform

      // Purple exit door warp zone at x=960
      this.returnTVGroup = this.physics.add.staticGroup();
      const dz = this.returnTVGroup.create(960, W1_FL - 43, "ground-tile") as Phaser.Physics.Arcade.Sprite;
      dz.setAlpha(0).setDisplaySize(44, 86).refreshBody();
      dz.setData("hw", 22);
      dz.setData("hh", 43);

      // Kitchen smash overlay — covers tomatoes with meatball when activated
      {
        const CTX = W1_K_LEFT + 460, CTY = W1_FL;
        this.kitchenSmashOverlay = this.add.graphics().setVisible(false).setDepth(3);
        // Erase tomato area (counter color)
        this.kitchenSmashOverlay.fillStyle(0xe8e4d8); this.kitchenSmashOverlay.fillRect(CTX, CTY - 130, 90, 10);
        // Meatball
        this.kitchenSmashOverlay.fillStyle(0x883311); this.kitchenSmashOverlay.fillCircle(CTX + 35, CTY - 140, 18);
        this.kitchenSmashOverlay.fillStyle(0xaa5533); this.kitchenSmashOverlay.fillCircle(CTX + 30, CTY - 144, 10);
        this.kitchenSmashOverlay.fillStyle(0x662200); this.kitchenSmashOverlay.fillCircle(CTX + 41, CTY - 143, 7);
        this.kitchenSmashOverlay.fillStyle(0x995522);
        this.kitchenSmashOverlay.fillCircle(CTX + 28, CTY - 138, 4); this.kitchenSmashOverlay.fillCircle(CTX + 42, CTY - 138, 3);
        // Sauce splatter
        this.kitchenSmashOverlay.fillStyle(0xdd2200, 0.7);
        this.kitchenSmashOverlay.fillCircle(CTX + 18, CTY - 128, 5); this.kitchenSmashOverlay.fillCircle(CTX + 52, CTY - 127, 4);
        this.kitchenSmashOverlay.fillCircle(CTX + 10, CTY - 133, 3); this.kitchenSmashOverlay.fillCircle(CTX + 60, CTY - 132, 4);
        this.kitchenSmashOverlay.fillStyle(0xff4400, 0.5);
        this.kitchenSmashOverlay.fillCircle(CTX + 35, CTY - 126, 3); this.kitchenSmashOverlay.fillCircle(CTX + 55, CTY - 128, 3);
        // "Z to inspect" label
        this.meatballZLabel = this.add.text(CTX + 35, CTY - 165, "Z", { fontSize: "8px", color: "#ffffff", stroke: "#000", strokeThickness: 2 }).setOrigin(0.5, 0).setDepth(4).setVisible(false);
      }

      // Carrot smash overlay (orange sauce) — hidden until smashed
      {
        const CRX = W1_K_LEFT + 460 + 73, CRY = W1_FL; // carrot center
        this.carrotSmashOverlay = this.add.graphics().setVisible(false).setDepth(3);
        const co = this.carrotSmashOverlay;
        // Orange sauce puddle
        co.fillStyle(0xff7700, 0.85); co.fillEllipse(CRX, CRY - 122, 80, 14);
        co.fillStyle(0xff8800); co.fillCircle(CRX - 8, CRY - 136, 7);
        co.fillStyle(0xff9922); co.fillCircle(CRX + 4, CRY - 140, 5);
        co.fillStyle(0xffaa44); co.fillCircle(CRX + 14, CRY - 134, 4);
        co.fillStyle(0xff6600, 0.7);
        co.fillCircle(CRX - 20, CRY - 130, 4); co.fillCircle(CRX + 24, CRY - 128, 3);
        // Flatten carrot greens
        co.fillStyle(0x44aa22); co.fillRect(CRX - 10, CRY - 148, 4, 6);
        co.fillRect(CRX + 4, CRY - 150, 4, 5);
      }

      // Cucumber smash overlay (green sauce) — hidden until smashed
      {
        const CUX = W1_K_LEFT + 460 + 119, CUY = W1_FL; // cucumber center
        this.cucumberSmashOverlay = this.add.graphics().setVisible(false).setDepth(3);
        const cu = this.cucumberSmashOverlay;
        // Green sauce puddle
        cu.fillStyle(0x228822, 0.85); cu.fillEllipse(CUX, CUY - 124, 76, 14);
        cu.fillStyle(0x33aa33); cu.fillCircle(CUX - 6, CUY - 138, 7);
        cu.fillStyle(0x44cc44); cu.fillCircle(CUX + 8, CUY - 142, 5);
        cu.fillStyle(0x55cc44, 0.7);
        cu.fillCircle(CUX - 18, CUY - 130, 4); cu.fillCircle(CUX + 22, CUY - 128, 3);
        // Cucumber seeds
        cu.fillStyle(0xffffff, 0.7);
        cu.fillCircle(CUX - 4, CUY - 138, 2); cu.fillCircle(CUX + 6, CUY - 140, 2);
      }

      // Bathroom pipe reveal — hidden until Boopkins explodes
      {
        const pipeX = W1_BRETURN_X + 66;   // toilet center x
        const pipeY = W1_FL;
        this.pipeRevealGfx = this.add.graphics().setVisible(false).setDepth(3);
        const pg = this.pipeRevealGfx;
        // Green Warp Pipe
        pg.fillStyle(0x228822); pg.fillRect(pipeX - 16, pipeY - 82, 32, 70);
        pg.fillStyle(0x44cc44); pg.fillRect(pipeX - 14, pipeY - 80, 10, 68);
        pg.fillStyle(0x1a6a1a); pg.fillRect(pipeX - 16, pipeY - 82, 32, 3);
        // Pipe cap (wider)
        pg.fillStyle(0x1a7a1a); pg.fillRect(pipeX - 22, pipeY - 88, 44, 14);
        pg.fillStyle(0x44cc44); pg.fillRect(pipeX - 18, pipeY - 86, 12, 10);
        // Meatball peeking from pipe top
        pg.fillStyle(0x883311); pg.fillCircle(pipeX, pipeY - 95, 14);
        pg.fillStyle(0xaa5533); pg.fillCircle(pipeX - 4, pipeY - 100, 8);
        pg.fillStyle(0x662200); pg.fillCircle(pipeX + 5, pipeY - 99, 5);
        pg.fillStyle(0xdd4400, 0.6);
        pg.fillCircle(pipeX - 14, pipeY - 88, 4); pg.fillCircle(pipeX + 18, pipeY - 88, 3);
        // Z label
        this.pipeZLabel = this.add.text(pipeX, pipeY - 116, "Z", {
          fontSize: "9px", color: "#ffffff", stroke: "#000", strokeThickness: 2,
        }).setOrigin(0.5, 0).setDepth(4).setVisible(false);
      }

      return;
    }

    const namedShows: Record<number, { title: string; color: string; stroke: string }> = {
      1: { title: "Once upon an SMG4",                          color: "#cc88ff", stroke: "#220044" },
      2: { title: "Scooby Mario,\nWhere'd You Go!",             color: "#44ffcc", stroke: "#003322" },
      3: { title: "Mr. Puzzles'\nIncredible Game\nShow Spectacular", color: "#ffcc22", stroke: "#2a1a00" },
      4: { title: "Mario the Exploro",                          color: "#ffaa44", stroke: "#441100" },
      5: { title: "Despicable\nMr. Puzzles",                    color: "#ff4477", stroke: "#330011" },
      6: { title: "SMG4 Inside Out",                            color: "#33ccff", stroke: "#001833" },
      9: { title: "Mario's Mysteries\nHouse Interior",          color: "#ffcc44", stroke: "#332200" },
    };
    const show = namedShows[this.worldId];
    if (show) {
      this.add.text(640, 260, show.title, {
        fontSize: "56px", color: show.color,
        stroke: show.stroke, strokeThickness: 6,
        fontStyle: "bold italic", align: "center",
      }).setScrollFactor(0).setOrigin(0.5);
      this.add.text(640, 360, "Coming Soon!", {
        fontSize: "32px", color: "#ffffff",
        stroke: "#000000", strokeThickness: 4,
      }).setScrollFactor(0).setOrigin(0.5);
    } else {
      this.add.text(640, 280, `WORLD ${this.worldId}`, {
        fontSize: "80px", color: "#ffffff",
        stroke: "#000000", strokeThickness: 8,
      }).setScrollFactor(0).setOrigin(0.5);
      this.add.text(640, 380, "Under Construction", {
        fontSize: "30px", color: "#aaaaaa",
        stroke: "#000", strokeThickness: 4,
      }).setScrollFactor(0).setOrigin(0.5);
    }
  }

  private enterWorld(worldId: number) {
    if (this.dying) return;
    this.dying = true;
    this.cameras.main.flash(500, 255, 255, 255);
    this.time.delayedCall(500, () => {
      this.scene.start("GameScene", {
        character: this.character,
        worldId,
        ...(worldId === 0 && { fromWorld: this.worldId }),
        ...((worldId === 8 && this.worldId === 9) && { fromWorld: 9 }),
      });
    });
  }

  private showPersonDialogue(text: string, color: string, durationMs: number) {
    this.showDialogue(text, color, durationMs);
    this.personTalkingUntil = this.time.now + durationMs;
  }

  private showDialogue(text: string, color: string, durationMs: number) {
    // Reuse or create dialogue box (HUD-space, scroll-fixed)
    if (!this.dialogueBg) {
      this.dialogueBg = this.add.graphics().setScrollFactor(0).setDepth(15);
    }
    if (!this.dialogueText) {
      this.dialogueText = this.add.text(640, 620, "", {
        fontSize: "14px", align: "center",
        stroke: "#000000", strokeThickness: 3,
        backgroundColor: "#00000000",
      }).setScrollFactor(0).setDepth(16).setOrigin(0.5, 1);
    }
    this.dialogueText.setText(text).setColor(color).setVisible(true);
    const tw = this.dialogueText.width + 24, th = this.dialogueText.height + 14;
    this.dialogueBg.clear().setVisible(true);
    this.dialogueBg.fillStyle(0x000000, 0.78).fillRoundedRect(640 - tw / 2, 620 - th, tw, th, 6);
    this.dialogueBg.lineStyle(2, 0xffffff, 0.3).strokeRoundedRect(640 - tw / 2, 620 - th, tw, th, 6);
    this.dialogueUntil = this.time.now + durationMs;
  }

  private addClue(text: string) {
    this.phoneLog.push(text);
  }

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyZ     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyX     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    // Use event-driven flag so no keypress is ever missed between frames
    this.keyShift.on("down", () => { if (!this.holdingMallet && !this.holdingGun) this.dashPending = true; });
  }

  private setupCamera() {
    const camW = this.worldId === 9 ? 1920 : LEVEL_W;
    this.cameras.main.setBounds(0, 0, camW, LEVEL_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private buildHUD() {
    this.buildSettingsButton();
    this.warpPromptText = this.add.text(0, 0, "↓  Enter", {
      fontSize: "15px", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3,
      backgroundColor: "#00000099",
      padding: { x: 7, y: 4 },
    }).setOrigin(0.5, 1).setDepth(6).setVisible(false);

    this.buildHpDisplay();

    if (this.worldId === 9) {
      // Phone icon — hidden until player picks up the phone
      const phoneX = 34 + this.maxHp * 30 + 12;
      const pg = this.add.graphics().setScrollFactor(0).setDepth(10);
      pg.fillStyle(0x1a1a1a); pg.fillRoundedRect(phoneX, 26, 18, 28, 3);
      pg.fillStyle(0x3388ff); pg.fillRoundedRect(phoneX + 2, 29, 14, 18, 2);
      pg.fillStyle(0x222222); pg.fillCircle(phoneX + 9, 50, 2);
      this.phoneIconObj = this.add.text(phoneX + 9, 56, "PHONE", {
        fontSize: "6px", color: "#88ccff", stroke: "#000", strokeThickness: 1,
      }).setScrollFactor(0).setDepth(10).setOrigin(0.5, 0);
      const phoneGroup = [pg, this.phoneIconObj];
      phoneGroup.forEach(o => (o as Phaser.GameObjects.GameObject & { setVisible(v: boolean): void }).setVisible(this.hasPhone));
      // Store reference to update visibility later
      this.phoneIconObj.setData("gfx", pg);

      // Clickable zone over phone icon — opens clue log
      const phoneBtnW = 42, phoneBtnH = 46;
      const phoneBtn = this.add.rectangle(phoneX + 9, 49, phoneBtnW, phoneBtnH)
        .setScrollFactor(0).setDepth(11).setInteractive({ useHandCursor: true }).setAlpha(0.01);
      phoneBtn.on("pointerdown", () => { if (this.hasPhone) this.togglePhoneLog(); });
      phoneBtn.on("pointerover",  () => { if (this.hasPhone) pg.setAlpha(0.7); });
      phoneBtn.on("pointerout",   () => pg.setAlpha(1));
    }

    if (this.character === "yoshi") {
      this.yoshiIndicator = this.add.text(12, 62,
        "Z : Eat/Spit  |  Stomach: empty",
        { fontSize: "13px", color: "#88ff88", stroke: "#000", strokeThickness: 3 }
      ).setScrollFactor(0).setDepth(10);
    }
  }

  private buildSettingsButton() {
    const btn = this.add.text(1262, 10, "⚙", {
      fontSize: "24px", color: "#cccccc",
      stroke: "#000000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(20).setInteractive({ useHandCursor: true });
    btn.on("pointerover",  () => btn.setTint(0xffdd44));
    btn.on("pointerout",   () => btn.clearTint());
    btn.on("pointerdown",  () => {
      if (this.settingsOpen) this.closeSettings();
      else this.openSettings();
    });
  }

  private openSettings() {
    this.settingsOpen = true;
    const D = 50;
    const W = 500, H = 430, cx = 640, cy = 360;
    const px = cx - W / 2, py = cy - H / 2;

    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.settingsObjects.push(o); return o;
    };

    // Dim overlay
    push(this.add.graphics().setScrollFactor(0).setDepth(D))
      .fillStyle(0x000000, 0.72).fillRect(0, 0, 1280, 720);

    // Panel background
    const panelG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    panelG.fillStyle(0x0b0b20, 0.97);
    panelG.fillRoundedRect(px, py, W, H, 14);
    panelG.lineStyle(2, 0x4444aa, 1);
    panelG.strokeRoundedRect(px, py, W, H, 14);

    const txt = (x: number, y: number, s: string, style: object) =>
      push(this.add.text(x, y, s, style as Phaser.Types.GameObjects.Text.TextStyle)
        .setScrollFactor(0).setDepth(D + 2));

    // Title
    txt(cx, py + 30, "⚙  SETTINGS", { fontSize: "22px", color: "#ccccff", stroke: "#000", strokeThickness: 3, }).setOrigin(0.5);

    // Divider
    const div = (y: number) => {
      const g = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));
      g.lineStyle(1, 0x333366, 1); g.lineBetween(px + 18, y, px + W - 18, y);
    };
    div(py + 52);

    // Controls section
    txt(px + 22, py + 60, "CONTROLS", { fontSize: "12px", color: "#7777bb", stroke: "#000", strokeThickness: 2 });
    const rows: [string, string][] = [
      ["← →  /  A D",       "Move"],
      ["↑  /  W  /  Space", "Jump  (hold for higher)"],
      ["Shift",              "Dash"],
      ["↓  near TV",        "Enter a TV  (lobby)"],
    ];
    if (this.character === "yoshi") rows.push(["Z", "Yoshi eat / spit"]);
    rows.forEach(([key, desc], i) => {
      const y = py + 80 + i * 23;
      txt(px + 28,  y, key,  { fontSize: "13px", color: "#ffffff", stroke: "#000", strokeThickness: 2 });
      txt(px + 200, y, desc, { fontSize: "13px", color: "#aaaaaa", stroke: "#000", strokeThickness: 2 });
    });

    div(py + 210);

    // Assist Mode section
    const ay = py + 225;
    txt(px + 22, ay, "ASSIST MODE", { fontSize: "12px", color: "#7777bb", stroke: "#000", strokeThickness: 2 });
    txt(px + 22, ay + 18, "Grants +3 extra health for a more relaxed experience.", {
      fontSize: "12px", color: "#777788", stroke: "#000", strokeThickness: 2, wordWrap: { width: W - 44 },
    });

    const isOn = this.assistModeActive;
    const btnG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));
    btnG.fillStyle(isOn ? 0x1a3a1a : 0x1a1a3a, 1);
    btnG.fillRoundedRect(cx - 110, ay + 50, 220, 38, 9);
    btnG.lineStyle(2, isOn ? 0x44bb44 : 0x5555bb, 1);
    btnG.strokeRoundedRect(cx - 110, ay + 50, 220, 38, 9);
    const btnTxt = txt(cx, ay + 69, isOn ? "✓  Assist Mode  ON" : "Activate Assist Mode", {
      fontSize: "14px", color: isOn ? "#88ff88" : "#ccccff", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5);
    const hitArea = push(this.add.rectangle(cx, ay + 69, 220, 38, 0x000000, 0)
      .setScrollFactor(0).setDepth(D + 3).setInteractive({ useHandCursor: true }));
    hitArea.on("pointerover",  () => btnTxt.setTint(0xffdd44));
    hitArea.on("pointerout",   () => btnTxt.clearTint());
    hitArea.on("pointerdown",  () => this.toggleAssistMode());

    // ── Change Character ───────────────────────────────────────────────────
    div(py + 338);
    const cy2 = py + 352;
    txt(cx - 110 + 14, cy2, "CHARACTER", { fontSize: "12px", color: "#7777bb", stroke: "#000", strokeThickness: 2 });
    const chG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));
    chG.fillStyle(0x1a1a2a, 1);
    chG.fillRoundedRect(cx - 110, cy2 + 18, 220, 38, 9);
    chG.lineStyle(2, 0x4455aa, 1);
    chG.strokeRoundedRect(cx - 110, cy2 + 18, 220, 38, 9);
    const chTxt = txt(cx, cy2 + 37, "⟵  Change Character", {
      fontSize: "14px", color: "#ccccff", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5);
    const chHit = push(this.add.rectangle(cx, cy2 + 37, 220, 38, 0x000000, 0)
      .setScrollFactor(0).setDepth(D + 3).setInteractive({ useHandCursor: true }));
    chHit.on("pointerover",  () => (chTxt as Phaser.GameObjects.Text).setTint(0xffdd44));
    chHit.on("pointerout",   () => (chTxt as Phaser.GameObjects.Text).clearTint());
    chHit.on("pointerdown",  () => {
      this.closeSettings();
      this.scene.start("CharacterSelectScene");
    });

    // Close button
    const closeBtn = push(this.add.text(px + W - 18, py + 18, "✕", {
      fontSize: "18px", color: "#777788", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(D + 3).setOrigin(0.5).setInteractive({ useHandCursor: true }));
    closeBtn.on("pointerover",  () => (closeBtn as Phaser.GameObjects.Text).setColor("#ffffff"));
    closeBtn.on("pointerout",   () => (closeBtn as Phaser.GameObjects.Text).setColor("#777788"));
    closeBtn.on("pointerdown",  () => this.closeSettings());
  }

  private closeSettings() {
    this.settingsOpen = false;
    this.settingsObjects.forEach(o => o.destroy());
    this.settingsObjects = [];
  }

  private toggleAssistMode() {
    if (this.assistModeActive) {
      this.assistModeActive = false;
      this.maxHp = 3;
      this.hp = Math.min(this.hp, this.maxHp);
    } else {
      this.assistModeActive = true;
      this.maxHp = 6;
      this.hp = Math.min(this.hp + 3, this.maxHp);
    }
    this.redrawHp();
    this.closeSettings();
    this.openSettings();
  }

  private buildHpDisplay() {
    this.add.text(12, 33, "♥", {
      fontSize: "17px", color: "#ff2255",
      stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(10);

    this.hpDisplay = this.add.graphics().setScrollFactor(0).setDepth(10);
    this.redrawHp();
  }

  private redrawHp() {
    this.hpDisplay.clear();
    for (let i = 0; i < this.maxHp; i++) {
      const x = 34 + i * 30;
      const y = 33;
      if (i < this.hp) {
        // Filled segment — bright red pill with white shine
        this.hpDisplay.fillStyle(0xff2255, 1);
        this.hpDisplay.fillRoundedRect(x, y, 24, 14, 7);
        this.hpDisplay.fillStyle(0xffffff, 0.5);
        this.hpDisplay.fillRoundedRect(x + 3, y + 2, 12, 5, 4);
      } else {
        // Empty segment — dark grey
        this.hpDisplay.fillStyle(0x333344, 1);
        this.hpDisplay.fillRoundedRect(x, y, 24, 14, 7);
      }
    }
  }

  private takeDamage() {
    if (!this.player.active || this.dying) return;
    if (this.time.now < this.invincibleUntil) return;

    this.hp = Math.max(0, this.hp - 1);
    this.redrawHp();

    if (this.hp <= 0) {
      this.playerDie();
      return;
    }

    this.invincibleUntil = this.time.now + 1500;
    this.cameras.main.shake(120, 0.007);

    // Flicker during invincibility window
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      alpha: { from: 1, to: 0.15 },
      duration: 80,
      yoyo: true,
      repeat: 9,
      onComplete: () => { if (this.player.active) this.player.setAlpha(1); },
    });
  }

  private yoshiEat(type: "goomba" | "koopa") {
    this.yoshiStomach = type;
    if (this.yoshiIndicator) {
      const label = type === "koopa" ? "KOOPA SHELL" : "GOOMBA";
      this.yoshiIndicator.setText(`Z : Eat/Spit  |  Stomach: ${label}`);
      this.yoshiIndicator.setColor(type === "koopa" ? "#aaff44" : "#ffcc44");
    }
  }

  private yoshiSpit() {
    if (this.yoshiStomach === "empty") return;
    const wasKoopa = this.yoshiStomach === "koopa";
    this.yoshiStomach = "empty";
    if (this.yoshiIndicator) {
      this.yoshiIndicator.setText("Z : Eat/Spit  |  Stomach: empty");
      this.yoshiIndicator.setColor("#88ff88");
    }
    if (wasKoopa) {
      const dir   = this.player.flipX ? -1 : 1;
      const shell = this.shells.create(
        this.player.x + dir * 40, this.player.y, "shell"
      ) as Phaser.Physics.Arcade.Sprite;
      shell.setData("sliding", true);
      (shell.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 350);
      (shell.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    }
  }

  private activateTongue() {
    this.tongueActive = true;
    if (this.tongue) this.tongue.setVisible(true);
    this.time.delayedCall(220, () => this.deactivateTongue());
  }

  private deactivateTongue() {
    this.tongueActive = false;
    if (this.tongue) this.tongue.setVisible(false);
  }

  private checkTongueEat() {
    if (!this.tongue) return;
    const tr = new Phaser.Geom.Rectangle(
      this.tongue.x - this.tongue.width  / 2,
      this.tongue.y - this.tongue.height / 2,
      this.tongue.width, this.tongue.height
    );

    for (const g of this.goombas.getChildren()) {
      const sp = g as Phaser.Physics.Arcade.Sprite;
      if (!sp.active) continue;
      const b = sp.body as Phaser.Physics.Arcade.Body;
      if (Phaser.Geom.Rectangle.Overlaps(tr, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
        sp.destroy();
        // Goombas are swallowed automatically — no stomach slot used
        this.deactivateTongue();
        return;
      }
    }

    for (const k of this.koopas.getChildren()) {
      const sp = k as Phaser.Physics.Arcade.Sprite;
      if (!sp.active) continue;
      const b = sp.body as Phaser.Physics.Arcade.Body;
      if (Phaser.Geom.Rectangle.Overlaps(tr, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
        sp.destroy();
        this.yoshiEat("koopa");
        this.deactivateTongue();
        return;
      }
    }

    for (const s of this.shells.getChildren()) {
      const sp = s as Phaser.Physics.Arcade.Sprite;
      if (!sp.active || sp.getData("sliding")) continue;
      const b = sp.body as Phaser.Physics.Arcade.Body;
      if (Phaser.Geom.Rectangle.Overlaps(tr, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
        sp.destroy();
        this.yoshiEat("koopa");
        this.deactivateTongue();
        return;
      }
    }
  }

  // ── Boopkins sprite helper ───────────────────────────────────────────────────

  private drawBoopkins(g: Phaser.GameObjects.Graphics, cx: number, baseY: number) {
    g.clear();
    // Blue mohawk spike
    g.fillStyle(0x3399cc);
    g.fillTriangle(cx - 6, baseY - 74, cx, baseY - 84, cx + 6, baseY - 74);
    // Round green body
    g.fillStyle(0x55bb55); g.fillEllipse(cx, baseY - 40, 60, 68);
    // Light belly
    g.fillStyle(0x88ee88); g.fillEllipse(cx, baseY - 32, 36, 44);
    // Fin arms
    g.fillStyle(0x44aa44);
    g.fillTriangle(cx - 30, baseY - 46, cx - 36, baseY - 60, cx - 24, baseY - 42);
    g.fillTriangle(cx + 30, baseY - 46, cx + 36, baseY - 60, cx + 24, baseY - 42);
    // Big white eyes
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 14, baseY - 56, 14); g.fillCircle(cx + 14, baseY - 56, 14);
    // Black pupils
    g.fillStyle(0x000000);
    g.fillCircle(cx - 14, baseY - 56, 8); g.fillCircle(cx + 14, baseY - 56, 8);
    // Eye shine
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 18, baseY - 60, 3); g.fillCircle(cx + 10, baseY - 60, 3);
    // Wide red mouth (open, singing O shape)
    g.fillStyle(0xcc1111); g.fillEllipse(cx, baseY - 28, 32, 20);
    // Teeth
    g.fillStyle(0xffffff);
    g.fillRect(cx - 12, baseY - 36, 6, 6);
    g.fillRect(cx - 2,  baseY - 36, 6, 6);
    g.fillRect(cx + 8,  baseY - 36, 6, 6);
    // Shoes
    g.fillStyle(0x333333);
    g.fillRect(cx - 20, baseY - 10, 16, 10);
    g.fillRect(cx + 4,  baseY - 10, 16, 10);
  }

  // ── Cutscene system ─────────────────────────────────────────────────────────

  private buildHouseCutscene() {
    if (this.cutsceneDone) return;
    this.cutsceneActive = true;
    this.cutsceneStep   = 0;
    // Freeze player
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.cameras.main.centerOn(960, 360);
    this.displayCutsceneStep();
  }

  private displayCutsceneStep() {
    // Destroy previous step objects
    this.cutsceneObjs.forEach(o => o.destroy());
    this.cutsceneObjs = [];

    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.cutsceneObjs.push(o); return o;
    };

    const W = 1280, H = 720;
    const D = 30;

    // Dark overlay
    const dim = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    dim.fillStyle(0x000000, 0.72).fillRect(0, 0, W, H);

    // Dialogue box at bottom
    const boxH = 140, boxY = H - boxH - 20;
    const boxG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    boxG.fillStyle(0x0a0a1a, 0.95).fillRoundedRect(40, boxY, W - 80, boxH, 10);
    boxG.lineStyle(2, 0x8888cc, 0.8).strokeRoundedRect(40, boxY, W - 80, boxH, 10);

    // Speaker portrait (left = SMG4, right = Mario portrait area)
    const smg4G = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));
    const marioG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));

    const step = this.cutsceneStep;

    // Red tint overlay: step 7 (MAYBE branch — SMG4 grabs gun, screen turns dark red)
    if (step === 7) {
      const redDim = push(this.add.graphics().setScrollFactor(0).setDepth(D));
      redDim.fillStyle(0x880000, 0.40).fillRect(0, 0, W, H);
    }

    // Steps: 0=SMG4 intro, 1=Mario sad, 2=SMG4 asks, 3=Mario spaghetti,
    //        4=SMG4 asks help, 5/6 = choice buttons (handled separately)
    //        7=Maybe branch: SMG4 gun
    const lines: Array<{ speaker: string; text: string; color: string }> = [
      { speaker: "SMG4",  text: "Mario look who's here!",                              color: "#4488ff" },
      { speaker: "Mario", text: "(Mario appears with a sad expression and tears...)",   color: "#ffffff" },
      { speaker: "SMG4",  text: "Oh no Mario what's wrong?",                           color: "#4488ff" },
      { speaker: "Mario", text: "My spaghetti is missing!",                             color: "#ff4444" },
      { speaker: "SMG4",  text: "That's terrible!\nWill you help us find Mario's spaghetti?", color: "#4488ff" },
    ];

    const isMaybeStep = step === 7;
    const currentLine = isMaybeStep
      ? { speaker: "SMG4", text: "You will help us, RIGHT?", color: "#4488ff" }
      : lines[Math.min(step, lines.length - 1)];

    // Draw SMG4 portrait (left side)
    const hasGun = isMaybeStep;
    this.drawCutsceneSmg4(smg4G, 120, boxY - 10, 1, hasGun);

    // Draw Mario portrait (right side) if it's Mario's line
    if (currentLine.speaker === "Mario" || step === 1) {
      this.drawCutsceneMarioSad(marioG, W - 120, boxY - 10, 1);
    }

    // Speaker name
    const nameCol = currentLine.speaker === "SMG4" ? "#4488ff" : "#ff4444";
    push(this.add.text(120, boxY + 14, currentLine.speaker, {
      fontSize: "16px", fontStyle: "bold", color: nameCol,
      stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(D + 3).setOrigin(0.5, 0));

    // Dialogue text
    push(this.add.text(W / 2, boxY + 20, currentLine.text, {
      fontSize: "18px", color: currentLine.color, align: "center",
      stroke: "#000000", strokeThickness: 3,
      wordWrap: { width: W - 260 },
    }).setScrollFactor(0).setDepth(D + 3).setOrigin(0.5, 0));

    // Step 4 or 7: show choice buttons
    if (step === 4 || step === 7) {
      const btnY = boxY + 90;
      const yesBtn = push(this.add.text(W / 2 - 80, btnY, "[ Yes ]", {
        fontSize: "20px", color: "#44ff44", fontStyle: "bold",
        stroke: "#003300", strokeThickness: 3,
        backgroundColor: "#002200", padding: { x: 14, y: 8 },
      }).setScrollFactor(0).setDepth(D + 4).setInteractive({ useHandCursor: true }));
      yesBtn.on("pointerover",  () => yesBtn.setColor("#88ff88"));
      yesBtn.on("pointerout",   () => yesBtn.setColor("#44ff44"));
      yesBtn.on("pointerdown",  () => this.endCutscene());

      if (step === 4) {
        const maybeBtn = push(this.add.text(W / 2 + 80, btnY, "[ Maybe ]", {
          fontSize: "20px", color: "#ffcc44", fontStyle: "bold",
          stroke: "#332200", strokeThickness: 3,
          backgroundColor: "#221100", padding: { x: 14, y: 8 },
        }).setScrollFactor(0).setDepth(D + 4).setInteractive({ useHandCursor: true }));
        maybeBtn.on("pointerover",  () => maybeBtn.setColor("#ffee88"));
        maybeBtn.on("pointerout",   () => maybeBtn.setColor("#ffcc44"));
        maybeBtn.on("pointerdown",  () => {
          this.cutsceneStep = 7;
          this.displayCutsceneStep();
        });
      }

      // Continue hint — no auto-advance on button steps
      push(this.add.text(W - 60, H - 30, "", {}).setScrollFactor(0).setDepth(D + 4));
    } else {
      // Advance hint
      push(this.add.text(W - 60, H - 30, "▶ Space/Z", {
        fontSize: "13px", color: "#aaaaaa", stroke: "#000", strokeThickness: 2,
      }).setScrollFactor(0).setDepth(D + 4).setOrigin(1, 1));
    }
  }

  private advanceCutscene() {
    if (this.cutsceneStep === 4 || this.cutsceneStep === 7) return; // wait for button
    this.cutsceneStep++;
    if (this.cutsceneStep > 4) {
      this.endCutscene();
      return;
    }
    this.displayCutsceneStep();
  }

  private endCutscene() {
    this.cutsceneObjs.forEach(o => o.destroy());
    this.cutsceneObjs  = [];
    this.cutsceneActive = false;
    this.cutsceneDone   = true;
  }

  private drawCutsceneSmg4(g: Phaser.GameObjects.Graphics, cx: number, baseY: number, _s: number, hasGun = false) {
    // SMG4 portrait — matches playable sprite style (blue cap + S badge, white overalls)
    const scale = 2.6;
    const ox = cx - Math.round(18 * scale);
    const oy = baseY - Math.round(42 * scale);
    const r = (x: number, y: number, w: number, h: number, col: number) => {
      g.fillStyle(col); g.fillRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
    };
    const ci = (x: number, y: number, rad: number, col: number) => {
      g.fillStyle(col); g.fillCircle(ox + x * scale, oy + y * scale, rad * scale);
    };
    // Blue cap
    r(4,  0, 28, 8, 0x2244cc);
    r(1,  7, 34, 4, 0x2244cc);
    // S badge (white bg + blue S shape)
    r(14, 1, 8, 6, 0xffffff);
    r(14, 1, 8, 2, 0x4488ee);
    r(14, 4, 8, 2, 0x4488ee);
    r(14, 6, 8, 2, 0x4488ee);
    r(14, 1, 2, 3, 0x4488ee);
    r(20, 4, 2, 3, 0x4488ee);
    // Dark hair
    r(6,  9, 24, 4, 0x222200);
    // Face
    r(8, 10, 20, 12, 0xffcc88);
    // Eyes
    r(11, 13, 3, 3, 0x000000);
    r(22, 13, 3, 3, 0x000000);
    // Mustache
    r(10, 19, 6, 2, 0x333333);
    r(20, 19, 6, 2, 0x333333);
    // White overalls
    r(0, 22, 36, 14, 0xffffff);
    // Blue shirt center
    r(10, 22, 16, 6, 0x2244cc);
    // Gray straps + yellow buttons
    r(4,  22, 6, 8, 0xdddddd);
    r(26, 22, 6, 8, 0xdddddd);
    r(5,  23, 3, 3, 0xffdd00);
    r(27, 23, 3, 3, 0xffdd00);
    // Blue arms
    r(0,  22, 4, 12, 0x2244cc);
    r(32, 22, 4, 12, 0x2244cc);
    // White gloves
    ci(2,  28, 4, 0xffffff);
    ci(34, 28, 4, 0xffffff);
    // Brown boots
    r(1,  36, 14, 6, 0x6b3a1e);
    r(21, 36, 14, 6, 0x6b3a1e);
    // Legs (blue)
    r(4,  36, 12, 4, 0x1133cc);
    r(20, 36, 12, 4, 0x1133cc);
    if (hasGun) {
      // Black pistol in right hand
      r(32, 20, 14, 8,  0x222222);
      r(38, 14, 8,  14, 0x444444);
    }
  }

  private drawCutsceneMarioSad(g: Phaser.GameObjects.Graphics, cx: number, baseY: number, _s: number) {
    // Pixel-art Mario — matches playable sprite (red cap/shirt, blue overalls, skin face, brown mustache)
    const scale = 2.6;
    const ox = cx - Math.round(18 * scale);
    const oy = baseY - Math.round(42 * scale);
    const r = (x: number, y: number, w: number, h: number, col: number) => {
      g.fillStyle(col); g.fillRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
    };
    const ci = (x: number, y: number, rad: number, col: number) => {
      g.fillStyle(col); g.fillCircle(ox + x * scale, oy + y * scale, rad * scale);
    };
    // Red shirt (body, behind cap)
    r(4,  0, 28, 22, 0xdd2200);
    // Red cap
    r(4,  0, 28,  8, 0xdd2200);
    r(1,  7, 34,  4, 0xdd2200);
    // White M badge on cap
    r(14, 1,  8,  6, 0xffffff);
    r(14, 1,  2,  5, 0xdd2200);
    r(20, 1,  2,  5, 0xdd2200);
    r(15, 1,  6,  2, 0xdd2200);
    r(16, 3,  2,  2, 0xdd2200);
    // Dark hair under cap brim
    r(6,  9, 24,  4, 0x222200);
    // Skin face
    r(8, 10, 20, 12, 0xffcc88);
    // Black eyes
    r(11, 13, 3, 3, 0x000000);
    r(22, 13, 3, 3, 0x000000);
    // Brown mustache
    r(10, 19, 6, 2, 0x552200);
    r(20, 19, 6, 2, 0x552200);
    // Blue overalls (full width)
    r(0, 22, 36, 14, 0x1133cc);
    // Red shirt sides / arms
    r(0,  22, 4, 12, 0xdd2200);
    r(32, 22, 4, 12, 0xdd2200);
    // Yellow bib buttons
    r(10, 23, 3, 3, 0xffdd00);
    r(23, 23, 3, 3, 0xffdd00);
    // White gloves
    ci(2,  28, 4, 0xffffff);
    ci(34, 28, 4, 0xffffff);
    // Blue legs
    r(4,  36, 12, 4, 0x1133cc);
    r(20, 36, 12, 4, 0x1133cc);
    // Brown boots
    r(1,  36, 14, 6, 0x6b3a1e);
    r(21, 36, 14, 6, 0x6b3a1e);
  }

  // ── "A/Another clue!" popup ──────────────────────────────────────────────────

  private showSmg4CluePopup(text = "A clue!") {
    const D = 20;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => { objs.push(o); return o; };

    const bx = 20, by = 570, bw = 190, bh = 88;
    const bg = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    bg.fillStyle(0x0a0a1a, 0.94).fillRoundedRect(bx, by, bw, bh, 8);
    bg.lineStyle(2, 0x4488ff, 0.8).strokeRoundedRect(bx, by, bw, bh, 8);

    // SMG4 mini portrait (matches playable style)
    const pg = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    this.drawCutsceneSmg4(pg, bx + 36, by + bh - 2, 0.7);

    push(this.add.text(bx + bw - 10, by + bh / 2, text, {
      fontSize: "20px", fontStyle: "bold italic",
      color: "#4488ff", stroke: "#000033", strokeThickness: 4,
    }).setScrollFactor(0).setDepth(D + 2).setOrigin(1, 0.5));

    this.time.delayedCall(2500, () => objs.forEach(o => o.destroy()));
  }

  // ── Boopkins singing animation ───────────────────────────────────────────────

  private startBoopkinsSinging() {
    if (!this.boopkinsGfx) return;
    const startX = W1_BRETURN_X + 500;
    const startY = W1_FL;
    const toiletX = W1_BRETURN_X + 66;
    const toiletY = W1_FL - 96;

    this.tweens.add({
      targets: this.boopkinsGfx,
      x: toiletX - startX,
      y: toiletY - startY,
      duration: 600,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.boopkinsGfx,
          y: `+=${16}`,
          duration: 340,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        });
      },
    });
  }

  // ── Movie cutscene (Mr. Puzzles gives pipe bomb) ─────────────────────────────

  private showMovieCutscene() {
    const D = 25;
    const W = 1280, H = 720;
    const objs: Phaser.GameObjects.GameObject[] = [];
    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => { objs.push(o); return o; };

    const dismiss = () => { objs.forEach(o => o.destroy()); };

    // Dark room overlay
    const dim = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    dim.fillStyle(0x000000, 0.9).fillRect(0, 0, W, H);

    // TV / cinema screen (center)
    const tvX = W / 2, tvY = 260, tvW = 480, tvH = 280;
    const tvG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    tvG.fillStyle(0x111111); tvG.fillRect(tvX - tvW/2 - 16, tvY - tvH/2 - 16, tvW + 32, tvH + 32);
    // Movie screen (colorful Mario Movie scene)
    tvG.fillStyle(0x44aaff); tvG.fillRect(tvX - tvW/2, tvY - tvH/2, tvW, tvH);
    tvG.fillStyle(0x228822); tvG.fillRect(tvX - tvW/2, tvY + tvH/2 - 60, tvW, 60);
    tvG.fillStyle(0xffcc22); tvG.fillEllipse(tvX - tvW/2 + 80, tvY, 60, 60);  // sun
    tvG.fillStyle(0xffffff); tvG.fillEllipse(tvX - 60, tvY - 30, 80, 40);
    tvG.fillStyle(0xffffff); tvG.fillEllipse(tvX + 80, tvY - 50, 100, 45);
    tvG.fillStyle(0xdd2200); tvG.fillEllipse(tvX, tvY + tvH/2 - 45, 30, 36); // Mario tiny

    // "Now Playing" text on screen
    push(this.add.text(tvX, tvY - tvH/2 + 14, "★  THE SUPER MARIO BROS. MOVIE  ★\nBONUS FEATURES EDITION", {
      fontSize: "14px", color: "#ffdd44", fontStyle: "bold", align: "center",
      stroke: "#000000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(D + 2).setOrigin(0.5, 0));

    // Two silhouettes watching (player + Mario movie style)
    const seatY = H - 100;
    const sG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 2));
    // Left chair silhouette (player character)
    sG.fillStyle(0x111111);
    sG.fillEllipse(W/2 - 100, seatY - 40, 36, 40);  // head
    sG.fillRect(W/2 - 118, seatY - 20, 36, 50);      // body
    // Right chair silhouette (Movie Mario — big head + mustache)
    sG.fillStyle(0x222222);
    sG.fillEllipse(W/2 + 100, seatY - 44, 52, 52);   // big round head
    sG.fillRect(W/2 + 100 - 22, seatY - 64, 50, 10); // cap brim
    sG.fillEllipse(W/2 + 100, seatY - 66, 44, 22);   // cap dome
    sG.fillEllipse(W/2 + 90,  seatY - 28, 32, 14);   // mustache l
    sG.fillEllipse(W/2 + 112, seatY - 28, 32, 14);   // mustache r
    sG.fillRect(W/2 + 78,  seatY - 20, 44, 50);      // body
    // Simple red chairs behind them
    sG.fillStyle(0x550000);
    sG.fillRect(W/2 - 128, seatY - 10, 56, 40);
    sG.fillRect(W/2 + 72,  seatY - 10, 56, 40);

    push(this.add.text(W/2, H - 40, "Enjoying the movie...", {
      fontSize: "18px", color: "#aaaaaa", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(D + 2).setOrigin(0.5, 1));

    // After 3.5 s, show Mr. Puzzles giving pipe bomb
    this.time.delayedCall(3500, () => {
      dismiss();
      this.showDialogue(
        "Mr. Puzzles: For watching the Mario Movie with\nbonus features, you get… A PIPE BOMB",
        "#111111", 4500
      );
      // Make dialogue bg bright yellow so black text is readable
      if (this.dialogueBg) {
        this.dialogueBg.clear();
        const tw2 = (this.dialogueText?.width ?? 200) + 24;
        const th2 = (this.dialogueText?.height ?? 40) + 14;
        this.dialogueBg.fillStyle(0xffee22, 1).fillRoundedRect(640 - tw2/2, 620 - th2, tw2, th2, 6);
        this.dialogueBg.lineStyle(2, 0x000000, 0.6).strokeRoundedRect(640 - tw2/2, 620 - th2, tw2, th2, 6);
      }
      this.time.delayedCall(4800, () => {
        this.hasPipeBomb = true;
        this.showDialogue("You received the PIPE BOMB!\nPress X to open inventory.", "#ffdd00", 3500);
      });
    });
  }

  // ── Inventory (pipe bomb) ────────────────────────────────────────────────────

  private openInventory() {
    if (this.inventoryOpen) return;
    this.inventoryOpen = true;
    const D = 28;
    const W = 1280, H = 720;
    const iW = 340, iH = 200, ix = W/2 - iW/2, iy = H/2 - iH/2;

    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.inventoryObjs.push(o); return o;
    };

    // Panel bg
    const bg = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    bg.fillStyle(0x0a0a1a, 0.97).fillRoundedRect(ix, iy, iW, iH, 12);
    bg.lineStyle(2, 0xffdd44, 0.8).strokeRoundedRect(ix, iy, iW, iH, 12);

    push(this.add.text(W/2, iy + 18, "🎒  INVENTORY", {
      fontSize: "18px", fontStyle: "bold", color: "#ffdd44", stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 0));

    // Pipe bomb icon (small drawn representation)
    const ibG = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    const ibx = ix + 24, iby = iy + 52;
    ibG.fillStyle(0x333333); ibG.fillRoundedRect(ibx, iby, 26, 38, 4);
    ibG.fillStyle(0xaaaaaa); ibG.fillRect(ibx + 4, iby - 8, 8, 10);
    ibG.fillStyle(0xffaa00); ibG.fillRect(ibx + 8, iby - 20, 4, 14);
    ibG.lineStyle(2, 0x666666, 1); ibG.strokeRoundedRect(ibx, iby, 26, 38, 4);

    push(this.add.text(ix + 64, iy + 60, "Pipe Bomb  x1", {
      fontSize: "16px", color: "#ffffff", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(D + 1));

    push(this.add.text(ix + 64, iy + 80, "Throw at a singing target.", {
      fontSize: "11px", color: "#888888",
    }).setScrollFactor(0).setDepth(D + 1));

    // Use button
    const useBtn = push(this.add.text(W/2, iy + iH - 40, "[ 💣  Use on Boopkins ]", {
      fontSize: "16px", fontStyle: "bold", color: "#ff6644",
      stroke: "#330000", strokeThickness: 3,
      backgroundColor: "#1a0000", padding: { x: 14, y: 8 },
    }).setScrollFactor(0).setDepth(D + 2).setInteractive({ useHandCursor: true }).setOrigin(0.5));

    useBtn.on("pointerover", () => useBtn.setColor("#ff9966"));
    useBtn.on("pointerout",  () => useBtn.setColor("#ff6644"));
    useBtn.on("pointerdown", () => {
      const px = this.player.x;
      const inBathroom = px >= W1_B_LEFT && px < W1_B_RIGHT;
      if (!inBathroom || !this.boopkinsGreeted) {
        this.closeInventory();
        this.showDialogue("You need to be in the bathroom near Boopkins!", "#ff8844", 2500);
        return;
      }
      this.closeInventory();
      this.explodeBoopkins();
    });

    // Close button
    const closeBtn = push(this.add.text(ix + iW - 8, iy + 8, "✕", {
      fontSize: "18px", color: "#888888", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(D + 2).setInteractive({ useHandCursor: true }).setOrigin(1, 0));
    closeBtn.on("pointerover", () => closeBtn.setColor("#ffffff"));
    closeBtn.on("pointerout",  () => closeBtn.setColor("#888888"));
    closeBtn.on("pointerdown", () => this.closeInventory());

    push(this.add.text(W/2, iy + iH - 12, "X  to close", {
      fontSize: "11px", color: "#555555",
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 1));
  }

  private closeInventory() {
    this.inventoryOpen = false;
    this.inventoryObjs.forEach(o => o.destroy());
    this.inventoryObjs = [];
  }

  // ── Boopkins explosion + pipe reveal ────────────────────────────────────────

  private explodeBoopkins() {
    this.hasPipeBomb = false;
    this.pipeBombUsed = true;

    // Stop any singing tweens
    if (this.boopkinsGfx) this.tweens.killTweensOf(this.boopkinsGfx);

    // Brief flash
    const flash = this.add.graphics().setScrollFactor(0).setDepth(35);
    flash.fillStyle(0xffffff, 0.8).fillRect(0, 0, 1280, 720);
    this.time.delayedCall(80, () => flash.destroy());

    // Hide Boopkins, reveal pipe — capture reference now so respawn can't interfere
    const gfxToHide = this.boopkinsGfx;
    this.time.delayedCall(100, () => {
      gfxToHide?.setVisible(false);
      this.pipeRevealGfx?.setVisible(true);
      this.showDialogue("BOOM! Boopkins is gone! Inspect the pipe with Z.", "#ffaa22", 3500);
    });
  }

  // ── Phone log overlay (clue list) ───────────────────────────────────────────

  private togglePhoneLog() {
    if (this.phoneLogOpen) this.closePhoneLog();
    else this.openPhoneLog();
  }

  private openPhoneLog() {
    if (this.phoneLogOpen) return;
    this.phoneLogOpen = true;
    const D = 28;
    const lW = 360, lH = 60 + Math.max(1, this.phoneLog.length) * 32 + 40;
    const lx = 10, ly = 70;

    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.phoneLogObjs.push(o); return o;
    };

    const bg = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    bg.fillStyle(0x0a0a1a, 0.97).fillRoundedRect(lx, ly, lW, lH, 10);
    bg.lineStyle(2, 0x3388ff, 0.8).strokeRoundedRect(lx, ly, lW, lH, 10);

    push(this.add.text(lx + lW/2, ly + 16, "📱 CLUE LOG", {
      fontSize: "16px", fontStyle: "bold", color: "#88ccff", stroke: "#000", strokeThickness: 3,
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 0));

    if (this.phoneLog.length === 0) {
      push(this.add.text(lx + 16, ly + 50, "No clues yet...", {
        fontSize: "13px", color: "#666666",
      }).setScrollFactor(0).setDepth(D + 1));
    } else {
      this.phoneLog.forEach((entry, i) => {
        push(this.add.text(lx + 16, ly + 50 + i * 32, `• ${entry}`, {
          fontSize: "13px", color: "#ffffff", stroke: "#000", strokeThickness: 2,
          wordWrap: { width: lW - 32 },
        }).setScrollFactor(0).setDepth(D + 1));
      });
    }

    const closeBtn = push(this.add.text(lx + lW - 8, ly + 8, "✕", {
      fontSize: "16px", color: "#666666",
    }).setScrollFactor(0).setDepth(D + 2).setInteractive({ useHandCursor: true }).setOrigin(1, 0));
    closeBtn.on("pointerover", () => closeBtn.setColor("#ffffff"));
    closeBtn.on("pointerout",  () => closeBtn.setColor("#666666"));
    closeBtn.on("pointerdown", () => this.closePhoneLog());

    // Also show X key hint only if not shown in unused space
    push(this.add.text(lx + lW - 8, ly + lH - 10, "click phone to close", {
      fontSize: "10px", color: "#333333",
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(1, 1));
  }

  private closePhoneLog() {
    this.phoneLogOpen = false;
    this.phoneLogObjs.forEach(o => o.destroy());
    this.phoneLogObjs = [];
  }

  // ── War zone setup ───────────────────────────────────────────────────────────

  private setupWarZone() {
    // Player collision with building walls
    if (this.warBuildingWalls) {
      this.physics.add.collider(this.player, this.warBuildingWalls);
    }

    // ── Barrage danger-zone warning overlay (HUD-space, toggled in update) ───
    const wg = this.add.graphics().setScrollFactor(0).setDepth(18).setVisible(false);
    wg.fillStyle(0xff1100, 0.28).fillRect(0, 0, 1280, 220);
    wg.lineStyle(4, 0xff3300, 0.85).strokeRect(0, 0, 1280, 220);
    // Pulsing border lines
    wg.lineStyle(2, 0xff6600, 0.5).strokeRect(4, 4, 1272, 212);
    this.barrageWarningGfx = wg;
    this.barrageWarningText = this.add.text(640, 22, "⚠  DANGER — STAY LOW!  ⚠", {
      fontSize: "20px", color: "#ff4400", fontStyle: "bold",
      stroke: "#000000", strokeThickness: 4,
    }).setScrollFactor(0).setDepth(19).setOrigin(0.5, 0).setVisible(false);

    // ── High-altitude barrage: 2 s on / 1 s off ──────────────────────────────
    // Bullets fly well above the small buildings (FL-70) from far right.
    // Damage dealt by height-check in update() while warBarrageActive is true.
    // Cycle: 3 s active (red, bullets) → 2 s rest (yellow flashing) → repeat.
    const barrageCycle = () => {
      if (this.warSectionDone) { this.warBarrageActive = false; return; }
      // Cancel any leftover flash event from previous rest phase
      if (this.barrageFlashEvent) {
        this.barrageFlashEvent.remove(false);
        this.barrageFlashEvent = null;
      }
      this.warBarrageActive = true;
      // Spawn ~16 visual streaks spread over 3 s (delay 180 ms × 16 repeats = 2880 ms)
      this.time.addEvent({
        delay: 180,
        repeat: 16,
        callback: () => {
          if (this.warEntered && !this.warSectionDone) this.spawnBarrageStreak();
        },
      });
      // After 3 s → rest phase with flashing yellow for 2 s → next cycle
      this.time.delayedCall(3000, () => {
        this.warBarrageActive = false;
        if (!this.warSectionDone) {
          // Flash the warning sign during the 2 s safe window
          let flashOn = true;
          this.barrageFlashEvent = this.time.addEvent({
            delay: 250,
            repeat: 7,   // 8 toggles × 250 ms = 2000 ms
            callback: () => {
              if (!this.warEntered) return;
              flashOn = !flashOn;
              this.barrageWarningGfx?.setVisible(flashOn);
              this.barrageWarningText?.setVisible(flashOn);
            },
          });
          this.time.delayedCall(2000, barrageCycle);
        }
      });
    };
    barrageCycle();
  }

  // Spawn one orange tracer streak flying from right → left above all buildings
  private spawnBarrageStreak() {
    // Sources: alive enemies contribute more bullets
    const sources: number[] = [];
    if (this.chrisAlive)   sources.push(W1_WAR_LEFT + 2420);
    if (this.swagAlive)    sources.push(W1_WAR_LEFT + 2640);
    if (this.shroomyAlive) sources.push(W1_SHROOMY_TOWER_X + 50);
    if (sources.length === 0) return;

    for (const sx of sources) {
      const yOff = (Math.random() - 0.5) * 28; // slight y jitter
      const fy   = W1_FL - 95 + yOff;          // well above 70 px buildings
      const streak = this.add.graphics().setDepth(5);
      streak.fillStyle(0xff5500, 0.92);
      streak.fillRect(-14, -3, 28, 5);          // horizontal dash
      streak.fillStyle(0xff8800, 0.6);
      streak.fillRect(-26, -1, 14, 3);          // dimmer tail
      streak.x = sx;
      streak.y = fy;
      // Muzzle flash at source
      const flash = this.add.graphics().setDepth(5);
      flash.fillStyle(0xffdd44, 0.9);
      flash.fillCircle(sx, fy, 9);
      this.time.delayedCall(70, () => flash.destroy());
      // Fly left at high speed via tween (not physics — buildings don't block)
      this.tweens.add({
        targets: streak,
        x: sx - (W1_WAR_RIGHT - W1_WAR_LEFT + 200),
        duration: 2800,
        ease: "Linear",
        onComplete: () => streak.destroy(),
      });
    }
  }

  private showShroomyMeatball() {
    const TX  = W1_SHROOMY_TOWER_X + 40;
    const TY  = W1_FL - 342 - 18;  // above Shroomy's head on tower top
    this.shroomyMeatballGfx = this.add.graphics().setDepth(6);
    const m = this.shroomyMeatballGfx;
    m.fillStyle(0x883311); m.fillCircle(TX, TY, 13);
    m.fillStyle(0xaa5533); m.fillCircle(TX - 4, TY - 4, 7);
    m.fillStyle(0x662200); m.fillCircle(TX + 4, TY - 3, 5);
    m.fillStyle(0x995522); m.fillCircle(TX - 7, TY + 2, 3); m.fillCircle(TX + 7, TY + 3, 3);
    // Sauce drops
    m.fillStyle(0xdd2200, 0.7);
    m.fillCircle(TX - 9, TY + 8, 4); m.fillCircle(TX + 10, TY + 7, 3);
  }

  private firePlayerBullet() {
    if (this.playerBullet?.active) return;
    const bx = this.player.x + 20;
    const by = this.player.y - 14;
    // Muzzle flash
    const flash = this.add.graphics().setDepth(5);
    flash.fillStyle(0xffffff, 0.9); flash.fillCircle(bx, by, 8);
    this.time.delayedCall(70, () => flash.destroy());
    // Visible bullet — white/yellow tracer
    const blt = this.physics.add.sprite(bx, by, "ground-tile");
    blt.setDisplaySize(18, 5).setAlpha(1).setTint(0xffee44);
    (blt.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setVelocityX(560);
    this.playerBullet = blt;
    this.time.delayedCall(3000, () => {
      if (blt.active) blt.destroy();
      this.playerBullet = null;
    });
  }

  // ── SMG4 guess sequence ──────────────────────────────────────────────────────

  private startGuessSequence() {
    if (this.guessingActive) return;
    this.guessingActive = true;
    this.guessText = "";

    const D = 22;
    const W = 500, H = 260, x = (1280 - W) / 2, y = (720 - H) / 2;
    const push = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.guessPromptObjs.push(o); return o;
    };

    const bg = push(this.add.graphics().setScrollFactor(0).setDepth(D));
    bg.fillStyle(0x05050f, 0.97).fillRoundedRect(x, y, W, H, 12);
    bg.lineStyle(3, 0x4488ff, 0.9).strokeRoundedRect(x, y, W, H, 12);

    // SMG4 mini portrait
    const pg = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    this.drawCutsceneSmg4(pg, x + 62, y + 185, 1, false);

    push(this.add.text(x + W / 2, y + 20, "SMG4", {
      fontSize: "15px", color: "#66aaff", fontStyle: "bold", stroke: "#000", strokeThickness: 2,
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 0));

    push(this.add.text(x + W / 2, y + 48, "\"We have all the clues!\nWho do you think it is?\"", {
      fontSize: "15px", color: "#ffffff", align: "center",
      stroke: "#000", strokeThickness: 2,
      wordWrap: { width: W - 60 },
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 0));

    push(this.add.text(x + W / 2, y + 122, "Type your answer and press ENTER:", {
      fontSize: "11px", color: "#aaaacc",
    }).setScrollFactor(0).setDepth(D + 1).setOrigin(0.5, 0));

    // Input field
    const ib = push(this.add.graphics().setScrollFactor(0).setDepth(D + 1));
    ib.fillStyle(0x0a0a22).fillRoundedRect(x + 40, y + 144, W - 80, 36, 6);
    ib.lineStyle(2, 0x6666ff).strokeRoundedRect(x + 40, y + 144, W - 80, 36, 6);

    this.guessTextObj = push(this.add.text(x + 52, y + 154, "_", {
      fontSize: "17px", color: "#ffffff",
    }).setScrollFactor(0).setDepth(D + 2));

    // Keyboard listener using window so all keys are captured
    this.guessKeyHandler = (event: KeyboardEvent) => {
      if (!this.guessingActive) return;
      if (event.key === "Enter") {
        this.checkGuess();
      } else if (event.key === "Backspace") {
        this.guessText = this.guessText.slice(0, -1);
        this.guessTextObj?.setText((this.guessText || "") + "_");
      } else if (event.key.length === 1 && this.guessText.length < 20) {
        this.guessText += event.key;
        this.guessTextObj?.setText(this.guessText + "_");
      }
    };
    window.addEventListener("keydown", this.guessKeyHandler);
  }

  private checkGuess() {
    if (this.guessText.trim().toLowerCase() === "mario") {
      this.closeGuessPrompt();
      // SMG4's incredulous reaction
      this.showPersonDialogue(
        "SMG4: Mario, you made me live through a war…\njust to get to THE MOST OBVIOUS CONCLUSION POSSIBLE?!",
        "#ffcc44", 5000
      );
      // Mario's reply
      this.time.delayedCall(5500, () => {
        this.showPersonDialogue("Mario: Yeah.", "#ff4422", 2200);
      });
      // Fade out and return to theater
      this.time.delayedCall(8000, () => {
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("GameScene", {
            character: this.character,
            worldId: 0,
            fromWorld: 9,
          });
        });
      });
    } else {
      // Wrong — let them try again
      this.guessText = "";
      this.guessTextObj?.setText("_");
      this.showPersonDialogue("SMG4: Hmm, that doesn't seem right...\nTry again!", "#ff8844", 2200);
    }
  }

  private closeGuessPrompt() {
    this.guessingActive = false;
    this.guessText      = "";
    if (this.guessKeyHandler) {
      window.removeEventListener("keydown", this.guessKeyHandler);
      this.guessKeyHandler = null;
    }
    this.guessPromptObjs.forEach(o => o.destroy());
    this.guessPromptObjs = [];
    this.guessTextObj    = null;
  }

  // ── Painting smoke animation ─────────────────────────────────────────────────

  private startPaintingSmoke() {
    const numPuffs = 5;
    for (let i = 0; i < numPuffs; i++) {
      const sg = this.add.graphics().setDepth(4);
      const offsetX = (i - 2) * 18;
      const startY  = W1_WP_TY - 10;

      sg.fillStyle(0x888888, 0.45 + i * 0.04);
      sg.fillEllipse(W1_WP_CX + offsetX, startY, 14 + i * 2, 16 + i * 2);

      const tween = this.tweens.add({
        targets: sg,
        y: `-=${30 + i * 10}`,
        alpha: { from: 0.55, to: 0 },
        duration: 1200 + i * 300,
        ease: "Sine.easeOut",
        delay: i * 220,
        yoyo: false,
        repeat: -1,
        repeatDelay: 400,
        onRepeat: () => {
          sg.clear();
          const grey = 0x888888 + (i % 3) * 0x111111;
          sg.fillStyle(grey, 0.5);
          sg.fillEllipse(W1_WP_CX + offsetX, startY, 12 + i * 2, 14 + i * 2);
          sg.setPosition(0, 0);
        },
      });
      this.paintingSmokeTweens.push(tween);
    }
  }

  // ── Chris NPC sprite (war zone) ──────────────────────────────────────────────

  private drawChrisNpc(g: Phaser.GameObjects.Graphics, cx: number, baseY: number) {
    const BY = baseY;
    // Light blue military jumpsuit body
    g.fillStyle(0xaaccee); g.fillRect(cx - 14, BY - 68, 28, 48);
    // Suit highlights
    g.fillStyle(0xbbd8f8); g.fillRect(cx - 12, BY - 66, 10, 44);
    // Belt (dark)
    g.fillStyle(0x334466); g.fillRect(cx - 14, BY - 30, 28, 6);
    g.fillStyle(0x888800); g.fillRect(cx - 4, BY - 30, 8, 6); // belt buckle
    // Gold wrist cuffs
    g.fillStyle(0xddaa22);
    g.fillRect(cx - 18, BY - 42, 6, 8); // left cuff
    g.fillRect(cx + 12, BY - 42, 6, 8); // right cuff
    // Arms (light blue sleeves)
    g.fillStyle(0xaaccee);
    g.fillRect(cx - 22, BY - 64, 10, 34); // left arm
    g.fillRect(cx + 12, BY - 64, 10, 34); // right arm (gun side)
    // Gun in right hand
    g.fillStyle(0x333333); g.fillRect(cx + 22, BY - 52, 18, 8); // barrel
    g.fillStyle(0x444444); g.fillRect(cx + 20, BY - 46, 10, 14); // grip
    // Angular "photo-face" head (rectangular, flattened top)
    g.fillStyle(0xffd0a0); g.fillRect(cx - 13, BY - 96, 26, 26);
    // Angular jaw line
    g.fillStyle(0xeec090);
    g.fillRect(cx - 11, BY - 72, 22, 6); // chin
    // Dark hair (flat top)
    g.fillStyle(0x1a1200); g.fillRect(cx - 13, BY - 96, 26, 7);
    // Eyes (angular, spaced)
    g.fillStyle(0x1133aa);
    g.fillRect(cx - 8, BY - 86, 5, 5);
    g.fillRect(cx + 3, BY - 86, 5, 5);
    // Eye whites
    g.fillStyle(0xffffff);
    g.fillRect(cx - 9, BY - 87, 3, 3); g.fillRect(cx + 4, BY - 87, 3, 3);
    // Nose
    g.fillStyle(0xcc9966); g.fillRect(cx - 2, BY - 80, 4, 5);
    // Mouth line
    g.fillStyle(0x994444); g.fillRect(cx - 5, BY - 74, 10, 2);
    // Legs/boots
    g.fillStyle(0x334466); g.fillRect(cx - 12, BY - 20, 10, 20); // left leg
    g.fillRect(cx + 2, BY - 20, 10, 20);  // right leg
    g.fillStyle(0x111111); g.fillRect(cx - 14, BY - 6, 12, 6); // boots
    g.fillRect(cx + 2, BY - 6, 12, 6);
  }

  // ── Swagmaster NPC sprite (war zone) ─────────────────────────────────────────

  private drawSwagNpc(g: Phaser.GameObjects.Graphics, sx: number, baseY: number) {
    const BY = baseY;
    // Light blue military uniform body
    g.fillStyle(0x99bbdd); g.fillRect(sx - 14, BY - 66, 28, 46);
    g.fillStyle(0xaaccee); g.fillRect(sx - 12, BY - 64, 10, 40);
    // Red belt
    g.fillStyle(0x883322); g.fillRect(sx - 14, BY - 28, 28, 7);
    g.fillStyle(0xcc5544); g.fillRect(sx - 4, BY - 28, 8, 7); // buckle
    // Arms (one raised — waving)
    g.fillStyle(0x99bbdd);
    g.fillRect(sx - 22, BY - 62, 10, 34); // left arm (hanging)
    g.fillRect(sx + 12, BY - 68, 10, 18); // right arm (raised)
    g.fillRect(sx + 16, BY - 80, 10, 14); // forearm going up
    // Fist
    g.fillStyle(0xffc888); g.fillRect(sx + 14, BY - 86, 12, 10);
    // Face (slightly rounder than Chris)
    g.fillStyle(0xffc888); g.fillRect(sx - 13, BY - 96, 26, 26);
    // Dark wavy hair
    g.fillStyle(0x1a0a00); g.fillRect(sx - 13, BY - 96, 26, 8);
    g.fillStyle(0x2a1200);
    g.fillRect(sx - 14, BY - 90, 4, 6); g.fillRect(sx + 10, BY - 90, 4, 6);
    // Dark sunglasses (signature Swag look)
    g.fillStyle(0x111111);
    g.fillRect(sx - 10, BY - 86, 8, 6);
    g.fillRect(sx + 2,  BY - 86, 8, 6);
    g.fillStyle(0x333333); g.fillRect(sx - 2, BY - 85, 4, 4); // bridge
    // Mustache (brown, thick)
    g.fillStyle(0x4a2a10);
    g.fillEllipse(sx - 5, BY - 77, 14, 6);
    g.fillEllipse(sx + 5, BY - 77, 14, 6);
    // Mouth (smirk)
    g.fillStyle(0x883322); g.fillRect(sx - 4, BY - 73, 8, 2);
    // Legs
    g.fillStyle(0x334466); g.fillRect(sx - 12, BY - 20, 10, 20);
    g.fillRect(sx + 2, BY - 20, 10, 20);
    g.fillStyle(0x111111); g.fillRect(sx - 14, BY - 6, 12, 6);
    g.fillRect(sx + 2, BY - 6, 12, 6);
  }

  private drawMeggyNpc(g: Phaser.GameObjects.Graphics, cx: number, baseY: number) {
    // Meggy the Landmine — same height as Mario player sprite (~42 px tall)
    // Uses direct-coordinate style matching Chris / Swag NPCs
    const BY = baseY;
    // Orange hair (wide mass above head)
    g.fillStyle(0xff6600); g.fillEllipse(cx, BY - 50, 30, 18);
    g.fillStyle(0xff5500); g.fillRect(cx - 12, BY - 46, 5, 20); // left strand
    g.fillRect(cx + 7, BY - 46, 5, 20);                          // right strand
    g.fillStyle(0xff8833); g.fillRect(cx - 5, BY - 57, 10, 10); // top highlight
    // Goggles (two small circles on forehead)
    g.fillStyle(0x333344); g.fillCircle(cx - 5, BY - 46, 4); g.fillCircle(cx + 5, BY - 46, 4);
    g.fillStyle(0x558899); g.fillCircle(cx - 5, BY - 46, 2); g.fillCircle(cx + 5, BY - 46, 2);
    g.fillStyle(0x555566); g.fillRect(cx - 1, BY - 48, 2, 4); // goggle bridge
    // Skin face
    g.fillStyle(0xffcc88); g.fillRect(cx - 9, BY - 42, 18, 14);
    // Reddish-pink Inkling eyes
    g.fillStyle(0xcc4466); g.fillRect(cx - 6, BY - 39, 4, 4); g.fillRect(cx + 2, BY - 39, 4, 4);
    g.fillStyle(0xffffff); g.fillRect(cx - 5, BY - 40, 2, 2); g.fillRect(cx + 3, BY - 40, 2, 2);
    // Red crimson jacket
    g.fillStyle(0xcc2244); g.fillRect(cx - 11, BY - 28, 22, 22);
    g.fillStyle(0xee3355); g.fillRect(cx - 4, BY - 28, 8, 5); // collar
    // Landmine disc (compact, held in front)
    g.fillStyle(0x888844); g.fillCircle(cx, BY - 18, 10);
    g.fillStyle(0x9a9a55); g.fillCircle(cx, BY - 18, 8);
    g.fillStyle(0x555522); g.fillRect(cx - 8, BY - 19, 16, 2); g.fillRect(cx - 1, BY - 25, 2, 14);
    g.fillStyle(0xffcc00); g.fillCircle(cx - 6, BY - 18, 2); g.fillCircle(cx + 6, BY - 18, 2);
    g.fillStyle(0x111100); g.fillCircle(cx, BY - 18, 2); // trigger
    // Arms (jacket sleeves)
    g.fillStyle(0xcc2244); g.fillRect(cx - 16, BY - 26, 6, 12); g.fillRect(cx + 10, BY - 26, 6, 12);
    g.fillStyle(0xffffff); g.fillCircle(cx - 13, BY - 15, 4); g.fillCircle(cx + 13, BY - 15, 4); // gloves
    // Legs
    g.fillStyle(0x222233); g.fillRect(cx - 8, BY - 6, 6, 6); g.fillRect(cx + 2, BY - 6, 6, 6);
    // Boots
    g.fillStyle(0x111122); g.fillRect(cx - 10, BY - 2, 9, 2); g.fillRect(cx + 1, BY - 2, 9, 2);
  }

  private drawShroomyNpc(g: Phaser.GameObjects.Graphics, cx: number, baseY: number) {
    // Shroomy — big red mushroom cap, army hat, tan face+body, orange ascot
    const scale = 2.6;
    const ox = cx - Math.round(21 * scale);
    const oy = baseY - Math.round(52 * scale);
    const r = (x: number, y: number, w: number, h: number, col: number) => {
      g.fillStyle(col); g.fillRect(ox + x * scale, oy + y * scale, w * scale, h * scale);
    };
    const ci = (x: number, y: number, rad: number, col: number) => {
      g.fillStyle(col); g.fillCircle(ox + x * scale, oy + y * scale, rad * scale);
    };
    // Army green beret (top)
    r(10,  0, 22,  6, 0x4a5518);
    r( 6,  4, 30,  4, 0x4a5518);
    r( 4,  7, 34,  3, 0x3a4410);  // brim
    r( 6,  6, 30,  2, 0xddbb00);  // yellow band
    // Red mushroom cap (very wide)
    r( 0,  8, 42, 16, 0xcc2200);
    r( 4, 10, 16,  5, 0xee3311);  // highlight
    ci( 8, 14,  4, 0xffffff);     // white spots
    ci(22, 13,  5, 0xffffff);
    ci(36, 15,  3, 0xffffff);
    // Cap underside gills
    r( 5, 23, 32,  3, 0xddbbaa);
    // Tan face (mushroom stem)
    r(11, 22, 20, 14, 0xd4a46a);
    ci(13, 30,  2, 0xee8866);     // blush
    ci(29, 30,  2, 0xee8866);
    // Eyes
    r(14, 26,  3,  4, 0x111100);
    r(25, 26,  3,  4, 0x111100);
    // Gap teeth grin
    r(12, 32, 18,  2, 0x332200);  // mouth
    r(14, 32,  4,  4, 0xffffff);  // left tooth
    r(24, 32,  4,  4, 0xffffff);  // right tooth
    r(19, 32,  5,  4, 0x331100);  // gap
    // Tan body
    r( 9, 36, 24, 12, 0xd4a46a);
    // Orange ascot
    r(14, 34, 14,  6, 0xff8822);
    ci(21, 37,  4, 0xee6600);     // ascot knot
    ci(17, 35,  2, 0xddaaee);     // polka dots
    ci(25, 35,  2, 0x88ccee);
    // Short legs
    r(11, 46,  8,  5, 0xd4a46a);
    r(23, 46,  8,  5, 0xd4a46a);
    // Brown boots
    r( 8, 46, 12,  8, 0x5a2e0a);
    r(22, 46, 12,  8, 0x5a2e0a);
  }
}
