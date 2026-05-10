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
  }

  // ── create ──────────────────────────────────────────────────────────────────

  create() {
    this.generateTextures();
    this.physics.world.setBounds(0, 0, LEVEL_W, LEVEL_H);

    if (this.worldId === 0) {
      this.buildBackground();
      this.buildLevel();          // lobby: TVs + warp zones, no flag
    } else {
      this.buildWorldBackground();
      this.buildWorldLevel(); // for worldId 8, calls buildReturnTV() internally
      if (this.worldId !== 8) this.buildReturnTV();
    }

    this.buildPlayer();
    this.buildEnemies();
    this.setupEnemyCollisions();
    this.setupInput();
    this.setupCamera();
    this.buildHUD();
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
    if (!this.isDashing) {
      if (goLeft) {
        this.player.setVelocityX(-this.stats.speed);
        this.player.setFlipX(true);
        this.dashDir = -1;
      } else if (goRight) {
        this.player.setVelocityX(this.stats.speed);
        this.player.setFlipX(false);
        this.dashDir = 1;
      } else {
        this.player.setVelocityX(body.velocity.x * 0.7);
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
    if (this.character === "yoshi") {
      if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
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
        if (this.nearWarpId >= 0 && Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
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
            if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.enterWorld(0);
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
            if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.enterWorld(9);
          }
        }
      }

      if (this.warpPromptText) {
        if (promptVisible) this.warpPromptText.setPosition(promptX, promptY).setVisible(true);
        else               this.warpPromptText.setVisible(false);
      }
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
    if (this.fromWorld > 0) {
      const tvIdx = this.fromWorld === 8 ? 0 : this.fromWorld;
      if (tvIdx < TV_POSITIONS.length) spawnX = TV_POSITIONS[tvIdx].x;
    }
    this.player = this.physics.add.sprite(spawnX, 600, "player");
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
    const TX  = this.worldId === 8 ? 290 : 300;
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
      });
    });
  }

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyZ     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    // Use event-driven flag so no keypress is ever missed between frames
    this.keyShift.on("down", () => { this.dashPending = true; });
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, LEVEL_W, LEVEL_H);
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
}
