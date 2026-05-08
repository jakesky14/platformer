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
  shroomy: { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  bob:     { speed: 240, jumpVel: -420, jumpHold:  90, jumpHoldF: 25, flutter: false, float: false },
  bowser:  { speed: 200, jumpVel: -380, jumpHold:  70, jumpHoldF: 18, flutter: false, float: false },
  meggy:   { speed: 290, jumpVel: -450, jumpHold: 100, jumpHoldF: 28, flutter: false, float: false },
};

const LEVEL_W    = 6400;
const LEVEL_H    = 720;
const GROUND_TOP = LEVEL_H - 40;   // y=680, top surface of ground tiles

const GOOMBA_XS = [600, 1100, 1900, 2800, 3600, 4500, 5350];
const KOOPA_XS  = [900, 1450, 2250, 3200, 4000, 4950];

// ── 1-1 style layout ──────────────────────────────────────────────────────────
const PIPE_W     = 64;
const PIPE_CAP_H = 22;
const BLOCK_SIZE = 40;

const PIPES: { x: number; h: number }[] = [
  { x:  420, h:  80 }, { x:  760, h: 100 }, { x: 1200, h:  80 },
  { x: 1650, h: 130 }, { x: 2100, h:  80 }, { x: 2560, h: 100 },
  { x: 2960, h:  80 }, { x: 3400, h: 130 }, { x: 3840, h: 100 },
  { x: 4280, h:  80 }, { x: 4780, h: 130 }, { x: 5180, h: 100 },
  { x: 5580, h:  80 }, { x: 6020, h: 130 },
];

const BLO = 560;   // low block row   (GROUND_TOP − 120)
const BHI = 510;   // high block row  (GROUND_TOP − 170)
const BTO = 460;   // top row         (GROUND_TOP − 220)

type BlockDef = { x: number; y: number; type: "brick" | "question"; mushroom?: true };
const BLOCKS: BlockDef[] = [
  // §1 lone intro ? block
  { x:  560, y: BLO, type: "question", mushroom: true  },
  // §2 first brick + ? row
  { x:  840, y: BLO, type: "brick"    }, { x:  880, y: BLO, type: "question", mushroom: true },
  { x:  920, y: BLO, type: "brick"    }, { x:  960, y: BLO, type: "brick"    },
  { x: 1000, y: BLO, type: "question" }, { x: 1040, y: BLO, type: "brick"    },
  { x:  960, y: BHI, type: "question", mushroom: true  }, // elevated ?
  // §3
  { x: 1450, y: BLO, type: "brick"    }, { x: 1490, y: BLO, type: "question", mushroom: true },
  { x: 1530, y: BLO, type: "brick"    },
  { x: 1490, y: BHI, type: "brick"    }, { x: 1530, y: BHI, type: "question", mushroom: true },
  // §4
  { x: 2000, y: BLO, type: "brick"    }, { x: 2040, y: BLO, type: "question", mushroom: true },
  { x: 2080, y: BLO, type: "brick"    },
  // §5
  { x: 2400, y: BLO, type: "brick"    }, { x: 2440, y: BLO, type: "question" },
  { x: 2480, y: BLO, type: "brick"    }, { x: 2520, y: BLO, type: "question", mushroom: true },
  { x: 2440, y: BHI, type: "brick"    }, { x: 2480, y: BHI, type: "brick"    },
  // §6
  { x: 3100, y: BLO, type: "brick"    }, { x: 3140, y: BLO, type: "question", mushroom: true },
  { x: 3180, y: BLO, type: "brick"    }, { x: 3140, y: BHI, type: "question", mushroom: true },
  // §7
  { x: 3600, y: BLO, type: "brick"    }, { x: 3640, y: BLO, type: "question" },
  { x: 3680, y: BLO, type: "brick"    }, { x: 3720, y: BLO, type: "brick"    },
  { x: 3640, y: BHI, type: "question", mushroom: true  },
  // §8
  { x: 4060, y: BLO, type: "brick"    }, { x: 4100, y: BLO, type: "question", mushroom: true },
  { x: 4140, y: BLO, type: "brick"    },
  // §9
  { x: 4560, y: BLO, type: "brick"    }, { x: 4600, y: BLO, type: "question", mushroom: true },
  { x: 4640, y: BLO, type: "brick"    }, { x: 4680, y: BLO, type: "brick"    },
  { x: 4600, y: BHI, type: "brick"    }, { x: 4640, y: BHI, type: "question", mushroom: true },
  // §10
  { x: 5000, y: BLO, type: "brick"    }, { x: 5040, y: BLO, type: "question", mushroom: true },
  { x: 5080, y: BLO, type: "brick"    },
  // §11
  { x: 5380, y: BLO, type: "brick"    }, { x: 5420, y: BLO, type: "question" },
  { x: 5460, y: BLO, type: "brick"    }, { x: 5500, y: BLO, type: "question", mushroom: true },
  { x: 5420, y: BHI, type: "brick"    },
  // §12
  { x: 5800, y: BLO, type: "brick"    }, { x: 5840, y: BLO, type: "question", mushroom: true },
  { x: 5880, y: BLO, type: "brick"    },
  { x: 5840, y: BHI, type: "question", mushroom: true  }, { x: 5880, y: BHI, type: "brick" },
  // End staircase
  { x: 6140, y: BLO, type: "brick" }, { x: 6180, y: BLO, type: "brick" }, { x: 6220, y: BLO, type: "brick" },
  { x: 6180, y: BHI, type: "brick" }, { x: 6220, y: BHI, type: "brick" },
  { x: 6220, y: BTO, type: "brick" },
];

const CHAR_COLORS: Record<string, { cap: number; shirt: number; pants: number; skin: number }> = {
  mario:   { cap: 0xdd2200, shirt: 0xdd2200, pants: 0x1133cc, skin: 0xffcc88 },
  luigi:   { cap: 0x228822, shirt: 0x228822, pants: 0x1133cc, skin: 0xffcc88 },
  toad:    { cap: 0xff4444, shirt: 0xffffff, pants: 0x4444ff, skin: 0xffeecc },
  yoshi:   { cap: 0xff4444, shirt: 0x44cc44, pants: 0x44cc44, skin: 0xffffff },
  peach:   { cap: 0xff88bb, shirt: 0xffddee, pants: 0xff88bb, skin: 0xffcc88 },
  smg4:    { cap: 0x2244cc, shirt: 0x2244cc, pants: 0x112299, skin: 0xffcc88 },
  smg3:    { cap: 0x8822cc, shirt: 0x8822cc, pants: 0x551199, skin: 0xffcc88 },
  shroomy: { cap: 0x22aa44, shirt: 0xeeffee, pants: 0x116633, skin: 0xffeecc },
  bob:     { cap: 0x222222, shirt: 0x333333, pants: 0x111111, skin: 0x99bb77 },
  bowser:  { cap: 0x2a7a2a, shirt: 0xddaa00, pants: 0xddaa00, skin: 0xccaa44 },
  meggy:   { cap: 0xcc2200, shirt: 0xffffff, pants: 0x333344, skin: 0xffccaa },
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
  private readonly maxHp  = 3;
  private invincibleUntil = 0;
  private hpDisplay!: Phaser.GameObjects.Graphics;

  // Yoshi-specific
  private yoshiStomach: "empty" | "goomba" | "koopa" = "empty";
  private yoshiIndicator: Phaser.GameObjects.Text | null = null;
  private tongue: Phaser.GameObjects.Rectangle | null = null;
  private tongueActive = false;
  private keyZ!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;

  constructor() { super("GameScene"); }

  init(data: { character?: string }) {
    this.character = data?.character ?? "mario";
    this.stats     = CHAR_STATS[this.character] ?? CHAR_STATS.mario;
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
  }

  // ── create ──────────────────────────────────────────────────────────────────

  create() {
    this.generateTextures();
    this.physics.world.setBounds(0, 0, LEVEL_W, LEVEL_H);

    this.buildBackground();
    this.buildLevel();
    this.buildPlayer();
    this.buildEnemies();
    this.setupEnemyCollisions();
    this.buildFlag();
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
    ["player", "ground-tile", "plat-tile", "flag", "cloud", "goomba", "koopa", "shell",
     "pipe-body", "pipe-cap", "brick-block", "question-block", "mushroom-item"].forEach(k => {
      if (this.textures.exists(k)) this.textures.remove(k);
    });

    if (this.character === "shroomy") {
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
        // Green Robin Hood hat
        ctx.fillStyle = "#3d6b2e";
        ctx.beginPath(); ctx.moveTo(14,8); ctx.lineTo(18,0); ctx.lineTo(22,8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#dd8822"; ctx.fillRect(10, 7, 16, 3);

        // Red mushroom cap (dominant feature — wide ellipse)
        ctx.fillStyle = "#cc2020";
        ctx.beginPath(); ctx.ellipse(18, 15, 17, 9, 0, 0, Math.PI * 2); ctx.fill();

        // White spots
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.ellipse(9, 13, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(25, 11, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

        // Eyes on cap face
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(14, 15, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(21, 15, 1.5, 0, Math.PI * 2); ctx.fill();

        // Toothy grin
        ctx.fillStyle = "#dddddd"; ctx.fillRect(13, 18, 9, 3);
        ctx.fillStyle = "#111";    ctx.fillRect(16, 18, 2, 3);

        // Beige stem body
        ctx.fillStyle = "#c49060"; ctx.fillRect(14, 23, 8, 11);

        // Orange sash
        ctx.fillStyle = "#dd7722"; ctx.fillRect(11, 25, 14, 4);

        // Badge dots
        ["#ff4444","#4466ff","#44cc44","#eeee22","#ff88ee"].forEach((col, i) => {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(12 + i*2.8, 27, 1.4, 0, Math.PI * 2); ctx.fill();
        });

        // Thin stick legs
        ctx.fillStyle = "#c49060";
        ctx.fillRect(15, 34, 2, 6); ctx.fillRect(19, 34, 2, 6);

        // Brown boots
        ctx.fillStyle = "#6b3a1e";
        ctx.fillRect(13, 38, 5, 4); ctx.fillRect(18, 38, 5, 4);
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
        ctx.fillStyle = "#33bb33";                                                        // green body
        ctx.beginPath(); ctx.ellipse(18,14,14,13,0,0,Math.PI*2); ctx.fill();
        ctx.fillRect(4,20,28,14);
        ctx.fillStyle = "#ffffff";                                                        // white belly
        ctx.beginPath(); ctx.ellipse(18,24, 9, 8,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffffff";                                                        // eye whites
        ctx.beginPath(); ctx.ellipse(11,10, 5, 5,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(24,10, 5, 5,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#000";                                                           // pupils
        ctx.beginPath(); ctx.arc(12,10,2.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(23,10,2.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = "#dd2222";                                                        // red saddle
        ctx.beginPath(); ctx.ellipse(18,15, 8, 5,0,0,Math.PI*2); ctx.fill();
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
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(14,1,8,6);                               // S badge bg
        ctx.fillStyle = "#dd2200";                                                        // S shape
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
      this.textures.addCanvas("player", this.makeCanvas(36, 42, ctx => {
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
        // Green shell peek (right side)
        ctx.fillStyle = "#2a7a2a"; ctx.fillRect(26,20,10,12);
        ctx.fillStyle = "#ffeeaa"; // shell spines
        ctx.fillRect(28,20,3,4); ctx.fillRect(28,25,3,4); ctx.fillRect(28,30,3,4);
        // Yellow legs
        ctx.fillStyle = "#ddaa00"; ctx.fillRect(2,34,13,8); ctx.fillRect(21,34,13,8);
        // White claws (3 per foot)
        ctx.fillStyle = "#fff";
        ctx.fillRect(3,39,3,3); ctx.fillRect(7,39,3,3); ctx.fillRect(11,39,3,3);
        ctx.fillRect(22,39,3,3); ctx.fillRect(26,39,3,3); ctx.fillRect(30,39,3,3);
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

    this.textures.addCanvas("ground-tile", this.makeCanvas(64, 40, ctx => {
      ctx.fillStyle = this.css(0x5a8a2c); ctx.fillRect(0, 0, 64, 40);
      ctx.fillStyle = this.css(0x7ab83e); ctx.fillRect(0, 0, 64, 10);
      ctx.fillStyle = this.css(0x9cd04e); ctx.fillRect(0, 0, 64,  3);
    }));

    // Pipe body (tiled vertically; horizontal stripes give depth)
    this.textures.addCanvas("pipe-body", this.makeCanvas(64, 64, ctx => {
      ctx.fillStyle = "#228822"; ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = "#33aa33"; ctx.fillRect(6, 0, 18, 64);
      ctx.fillStyle = "#1a6a1a"; ctx.fillRect(48, 0, 14, 64);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < 64; y += 16) ctx.fillRect(0, y, 64, 2);
    }));

    // Pipe cap (slightly wider top section)
    this.textures.addCanvas("pipe-cap", this.makeCanvas(72, 22, ctx => {
      ctx.fillStyle = "#1a6a1a"; ctx.fillRect(0, 0, 72, 22);
      ctx.fillStyle = "#228822"; ctx.fillRect(2, 0, 68, 20);
      ctx.fillStyle = "#33aa33"; ctx.fillRect(6, 2, 18, 18);
      ctx.fillStyle = "#44cc44"; ctx.fillRect(6, 2, 20, 5);
      ctx.fillStyle = "#1a6a1a"; ctx.fillRect(50, 0, 16, 20); ctx.fillRect(2, 18, 68, 4);
    }));

    // Brick block (40×40)
    this.textures.addCanvas("brick-block", this.makeCanvas(40, 40, ctx => {
      ctx.fillStyle = "#aa4422"; ctx.fillRect(0, 0, 40, 40);
      ctx.fillStyle = "#cc6644";
      ctx.fillRect(2, 2, 16, 14); ctx.fillRect(22, 2, 16, 14);
      ctx.fillRect(0, 22, 8, 14); ctx.fillRect(12, 22, 16, 14); ctx.fillRect(32, 22, 8, 14);
      ctx.fillStyle = "#661100";
      ctx.fillRect(0, 16, 40, 4); ctx.fillRect(18, 2, 4, 14);
      ctx.fillRect(8, 22, 4, 14); ctx.fillRect(28, 22, 4, 14);
      ctx.fillStyle = "#dd7755";
      ctx.fillRect(2, 2, 16, 2); ctx.fillRect(2, 2, 2, 14);
      ctx.fillRect(22, 2, 16, 2); ctx.fillRect(22, 2, 2, 14);
    }));

    // Question block (40×40)
    this.textures.addCanvas("question-block", this.makeCanvas(40, 40, ctx => {
      ctx.fillStyle = "#dd9900"; ctx.fillRect(0, 0, 40, 40);
      ctx.fillStyle = "#ffcc00"; ctx.fillRect(2, 2, 36, 36);
      ctx.fillStyle = "#aa6600";
      ctx.fillRect(0, 0, 40, 4); ctx.fillRect(0, 36, 40, 4);
      ctx.fillRect(0, 0, 4, 40); ctx.fillRect(36, 0, 4, 40);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(14, 6, 12, 3);  // ? top bar
      ctx.fillRect(22, 9, 4, 6);   // ? right leg down
      ctx.fillRect(14, 15, 10, 3); // ? elbow
      ctx.fillRect(18, 18, 4, 5);  // ? shaft
      ctx.fillRect(18, 27, 4, 5);  // ? dot
    }));

    // Mushroom item (28×32)
    this.textures.addCanvas("mushroom-item", this.makeCanvas(28, 32, ctx => {
      ctx.fillStyle = "#dd2222";
      ctx.beginPath(); ctx.ellipse(14, 12, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.ellipse(7, 10, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(20, 9, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(14, 17, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffeecc"; ctx.fillRect(8, 19, 12, 10);
      ctx.fillStyle = "#000"; ctx.fillRect(10, 21, 3, 3); ctx.fillRect(16, 21, 3, 3);
      ctx.fillStyle = "#664400"; ctx.fillRect(7, 27, 5, 4); ctx.fillRect(16, 27, 5, 4);
    }));

    this.textures.addCanvas("flag", this.makeCanvas(50, 120, ctx => {
      ctx.fillStyle = "#888"; ctx.fillRect(6, 0, 6, 120);
      ctx.fillStyle = "#22cc22";
      ctx.beginPath(); ctx.moveTo(12, 10); ctx.lineTo(12, 50); ctx.lineTo(48, 30); ctx.fill();
    }));

    this.textures.addCanvas("cloud", this.makeCanvas(120, 70, ctx => {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath(); ctx.ellipse(60, 45, 45, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(40, 32, 25, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(75, 30, 28, 20, 0, 0, Math.PI * 2); ctx.fill();
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
  }

  // ── update ──────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.player.active) return;

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
    const dashDown = Phaser.Input.Keyboard.JustDown(this.keyShift);

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
        this.yoshiSpit();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.yoshiStomach === "empty" && !this.tongueActive) {
        this.activateTongue();
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
    // Sky gradient overlay
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x5c94fc, 0x5c94fc, 0xaaccff, 0xaaccff, 1);
    sky.fillRect(0, 0, LEVEL_W, LEVEL_H);
    sky.setScrollFactor(0.1);

    // Simple cloud shapes
    const cloudPositions = [
      { x: 200, y: 80 }, { x: 600, y: 120 }, { x: 1100, y: 70 },
      { x: 1600, y: 110 }, { x: 2200, y: 85 }, { x: 2800, y: 130 },
      { x: 3400, y: 75 }, { x: 4000, y: 105 }, { x: 4600, y: 90 },
      { x: 5200, y: 120 }, { x: 5800, y: 80 },
    ];
    for (const c of cloudPositions) {
      this.add.image(c.x, c.y, "cloud").setScrollFactor(0.3).setAlpha(0.85);
    }
  }

  private buildLevel() {
    this.platforms = this.physics.add.staticGroup();
    this.mushrooms = this.physics.add.staticGroup();

    // Ground
    const tileCount = Math.ceil(LEVEL_W / 64);
    for (let i = 0; i < tileCount; i++) {
      this.platforms.create(i * 64 + 32, LEVEL_H - 20, "ground-tile");
    }

    // Pipes: body + cap stacked
    for (const p of PIPES) {
      const bodyH = p.h - PIPE_CAP_H;
      const pBody = this.platforms.create(p.x, GROUND_TOP - bodyH / 2, "pipe-body") as Phaser.Physics.Arcade.Sprite;
      pBody.setDisplaySize(PIPE_W, bodyH);
      pBody.refreshBody();

      const pCap = this.platforms.create(p.x, GROUND_TOP - p.h + PIPE_CAP_H / 2, "pipe-cap") as Phaser.Physics.Arcade.Sprite;
      pCap.setDisplaySize(PIPE_W + 8, PIPE_CAP_H);
      pCap.refreshBody();
    }

    // Blocks + mushrooms on ? blocks
    for (const b of BLOCKS) {
      const key = b.type === "question" ? "question-block" : "brick-block";
      const block = this.platforms.create(b.x, b.y, key) as Phaser.Physics.Arcade.Sprite;
      block.setDisplaySize(BLOCK_SIZE, BLOCK_SIZE);
      block.refreshBody();

      if (b.mushroom) {
        const mush = this.mushrooms.create(b.x, b.y - BLOCK_SIZE, "mushroom-item") as Phaser.Physics.Arcade.Sprite;
        mush.setDisplaySize(24, 28);
        mush.refreshBody();
      }
    }
  }

  private buildPlayer() {
    this.player = this.physics.add.sprite(100, 600, "player");
    this.player.setCollideWorldBounds(true);
    (this.player.body as Phaser.Physics.Arcade.Body).setMaxVelocityX(700);
    this.physics.add.collider(this.player, this.platforms);

    if (this.character === "yoshi") {
      this.tongue = this.add.rectangle(0, 0, 36, 8, 0xff2222)
        .setDepth(5).setVisible(false);
    }
  }

  private buildFlag() {
    const flag = this.physics.add.staticImage(LEVEL_W - 120, LEVEL_H - 160, "flag");
    flag.setImmovable(true);

    this.physics.add.overlap(this.player, flag, () => {
      this.scene.pause();
      this.add.text(LEVEL_W / 2 - 200, LEVEL_H / 2 - 40, "YOU WIN! 🎉", {
        fontSize: "52px", color: "#ffff00",
        stroke: "#000", strokeThickness: 6,
      }).setScrollFactor(0);
    });
  }

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.keyA     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyShift = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyZ     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyE     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, LEVEL_W, LEVEL_H);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  }

  private buildHUD() {
    this.add.text(12, 12,
      "← → / A D : Move    ↑ / W / Space : Jump    Shift : Dash",
      { fontSize: "13px", color: "#fff", stroke: "#000", strokeThickness: 3 }
    ).setScrollFactor(0).setDepth(10);

    this.buildHpDisplay();

    if (this.character === "yoshi") {
      this.yoshiIndicator = this.add.text(12, 62,
        "E : Eat  |  Z : Spit  |  Stomach: empty",
        { fontSize: "13px", color: "#88ff88", stroke: "#000", strokeThickness: 3 }
      ).setScrollFactor(0).setDepth(10);
    }
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
      this.yoshiIndicator.setText(`E : Eat (full)  |  Z : Spit  |  Stomach: ${label}`);
      this.yoshiIndicator.setColor(type === "koopa" ? "#aaff44" : "#ffcc44");
    }
  }

  private yoshiSpit() {
    if (this.yoshiStomach === "empty") return;
    const wasKoopa = this.yoshiStomach === "koopa";
    this.yoshiStomach = "empty";
    if (this.yoshiIndicator) {
      this.yoshiIndicator.setText("E : Eat  |  Z : Spit  |  Stomach: empty");
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
