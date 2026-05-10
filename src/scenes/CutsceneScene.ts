import Phaser from "phaser";

const CW = 1280, CH = 720;

export class CutsceneScene extends Phaser.Scene {
  constructor() { super("CutsceneScene"); }

  preload() {
    this.load.image("marios-mysteries", "/marios-mysteries.jpg");
  }

  create() {
    this.cameras.main.fadeIn(700, 0, 0, 0);

    // ── Build showgrounds scene — visible immediately ──────────────────────
    const sgSky   = this.makeSky();
    const sgFence = this.makeFence();
    const sgTent  = this.makeTent();
    const sgCrowd = this.makeCrowd();
    const sgArm   = this.makeArm();
    const sgTV    = this.makeBigTV();
    // arm and tv are hidden inside their constructors

    // ── Build dialogue scene — hidden initially ────────────────────────────
    const dlgBg    = this.makeDialogueBg();
    const dlgPlate = this.makeSpaghetti();
    const dlgSMG4  = this.makeSMG4();   // also creates cs-smg4 texture
    const dlgMario = this.makeMario();  // also creates cs-mario texture
    [dlgBg, dlgPlate, dlgSMG4, dlgMario].forEach(o => o.setVisible(false));

    // ── SMG4 + Mario standing in the showgrounds (textures created above) ──
    const sgSMG4  = this.add.image(570, 470, "cs-smg4")
      .setScale(3).setOrigin(0.5, 1).setDepth(6);
    const sgMario = this.add.image(710, 470, "cs-mario")
      .setScale(3).setOrigin(0.5, 1).setDepth(6);

    // Skip button
    const doSkip = () => this.endCutscene();
    this.add.text(CW - 14, CH - 14, "SKIP  ▶", {
      fontSize: "14px", color: "#ffffff60",
    }).setOrigin(1, 1).setDepth(200)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", doSkip);
    this.input.keyboard!.once("keydown", doSkip);

    // ── Phase 1: Showgrounds establishing shot ─────────────────────────────
    const estBanner = this.add.graphics().setDepth(50);
    estBanner.fillStyle(0x000000, 0.72);
    estBanner.fillRect(0, CH - 88, CW, 58);
    const estBannerTxt = this.add.text(CW / 2, CH - 60, "The SMG4 Showgrounds", {
      fontSize: "28px", fontStyle: "bold italic",
      color: "#ffffff", stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    this.tweens.add({ targets: estBannerTxt, alpha: 1, duration: 700 });

    // ── t=2600 — flash-cut to spaghetti dialogue ───────────────────────────
    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: [estBanner, estBannerTxt], alpha: 0, duration: 250 });
      this.cameras.main.flash(320, 255, 255, 255);
      this.time.delayedCall(320, () => {
        [sgSky, sgFence, sgTent, sgSMG4, sgMario, ...sgCrowd].forEach(o => o.setVisible(false));
        [dlgBg, dlgPlate, dlgSMG4, dlgMario].forEach(o => o.setVisible(true));

        // ── Run dialogue → Luigi scene (same outdoor setting) → showgrounds ──
        this.runDialogue(dlgMario, () => {
          // Hide plate; keep outdoor bg + SMG4 for the Luigi scene
          dlgPlate.setVisible(false);
          // Mario steps off the table to watch
          this.tweens.add({ targets: dlgMario, x: 130, y: 525, duration: 380, ease: "Power2.easeOut" });

          this.runLuigiScene(dlgMario, () => {
            [dlgBg, dlgPlate, dlgSMG4, dlgMario].forEach(o => o.setVisible(false));
            [sgSky, sgFence, sgTent, ...sgCrowd].forEach(o => o.setVisible(true));
            this.runShowgrounds(sgTent, sgFence, sgCrowd, sgArm, sgTV);
          });
        });
      });
    });
  }

  // ── Dialogue phase ────────────────────────────────────────────────────────

  private runDialogue(mario: Phaser.GameObjects.Image, onDone: () => void) {
    // Speech bubble + text (appear at t=500)
    const bubble = this.add.graphics().setDepth(14).setAlpha(0);
    bubble.fillStyle(0x001144, 0.82);
    bubble.fillRoundedRect(160, 58, 620, 108, 14);
    // Tail toward SMG4 (bottom-left of bubble)
    bubble.fillTriangle(210, 166, 268, 166, 218, 214);

    const dlgTxt = this.add.text(470, 112,
      '"Mario enjoying your spaghetti?"',
      {
        fontSize: "28px", fontStyle: "bold italic",
        color: "#55aaff", stroke: "#000d22", strokeThickness: 5,
        wordWrap: { width: 580 }, align: "center",
      },
    ).setOrigin(0.5).setDepth(15).setAlpha(0);

    this.time.delayedCall(500, () => {
      this.tweens.add({ targets: [bubble, dlgTxt], alpha: 1, duration: 500 });
    });

    // t=2000 — Mario crawls across the spaghetti plate
    this.time.delayedCall(2000, () => {
      // Horizontal crawl back and forth
      this.tweens.add({
        targets: mario, x: mario.x + 130,
        duration: 360, yoyo: true, repeat: 6,
        ease: "Sine.easeInOut",
      });
      // Tilt left-right to simulate scrambling
      this.tweens.add({
        targets: mario, angle: { from: -22, to: 22 },
        duration: 180, yoyo: true, repeat: 12,
        ease: "Sine.easeInOut",
      });
      // Slight vertical bounce
      this.tweens.add({
        targets: mario, y: mario.y - 18,
        duration: 180, yoyo: true, repeat: 12,
        ease: "Sine.easeInOut",
      });
    });

    // t=2300 — Mario's "Mamma Mia!" speech bubble (reaction to being spotted)
    this.time.delayedCall(2300, () => {
      const marioBubble = this.add.graphics().setDepth(14).setAlpha(0);
      marioBubble.fillStyle(0x440000, 0.88);
      marioBubble.fillRoundedRect(698, 195, 384, 80, 12);
      marioBubble.fillTriangle(768, 275, 808, 275, 787, 318);  // tail toward Mario
      const mammaText = this.add.text(890, 235, '"Mamma Mia!"', {
        fontSize: "26px", fontStyle: "bold italic",
        color: "#ff3300", stroke: "#1a0000", strokeThickness: 5,
        align: "center",
      }).setOrigin(0.5).setDepth(15).setAlpha(0);
      this.tweens.add({ targets: [marioBubble, mammaText], alpha: 1, duration: 340 });
      // Fade out with the main flash at t≈4200 (1900ms from now)
      this.time.delayedCall(1900, () => {
        this.tweens.add({ targets: [marioBubble, mammaText], alpha: 0, duration: 200 });
      });
    });

    // t=3200 — Ominous distant rumble (Mr. Puzzles approaches)
    this.time.delayedCall(3200, () => {
      this.cameras.main.shake(380, 0.008);
    });
    this.time.delayedCall(3800, () => {
      this.cameras.main.shake(500, 0.018);
    });

    // t=4200 — Flash-cut transition
    this.time.delayedCall(4200, () => {
      this.cameras.main.flash(320, 255, 255, 255);
      this.tweens.add({ targets: [bubble, dlgTxt], alpha: 0, duration: 180 });
    });

    // t=4600 — hand off to showgrounds
    this.time.delayedCall(4600, () => {
      bubble.destroy(); dlgTxt.destroy();
      onDone();
    });
  }

  // ── Showgrounds sequence ──────────────────────────────────────────────────

  private runShowgrounds(
    tent:  Phaser.GameObjects.Graphics,
    fence: Phaser.GameObjects.Graphics,
    crowd: Phaser.GameObjects.Container[],
    arm:   Phaser.GameObjects.Container,
    tv:    Phaser.GameObjects.Container,
  ) {
    // Banner (t=0 of this phase)
    const banner = this.add.graphics().setDepth(50);
    banner.fillStyle(0x000000, 0.72);
    banner.fillRect(0, CH - 88, CW, 58);
    const bannerTxt = this.add.text(CW / 2, CH - 60, "The SMG4 Showgrounds", {
      fontSize: "28px", fontStyle: "bold italic",
      color: "#ffffff", stroke: "#000000", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(51).setAlpha(0);
    this.tweens.add({ targets: bannerTxt, alpha: 1, duration: 700 });

    // t=1600 — arm slides in (tension already built in dialogue)
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: [banner, bannerTxt], alpha: 0, duration: 400 });
      arm.setVisible(true);
      this.tweens.add({
        targets: arm, x: CW - 160, duration: 1100, ease: "Power3.easeOut",
        onComplete: () => this.cameras.main.shake(180, 0.004),
      });
      this.time.addEvent({
        delay: 200, repeat: 6,
        callback: () => this.cameras.main.shake(40, 0.001),
      });
    });

    // t=3100 — ZAP  (arm at 0.6×scale: hand glow at container+(4×0.6, 170×0.6))
    this.time.delayedCall(3100, () => {
      this.doZap(CW - 158, 252, 640, 295);
    });

    // t=3600 — Explosion
    this.time.delayedCall(3600, () => {
      this.cameras.main.shake(720, 0.02);
      tent.setVisible(false);
      fence.setVisible(false);
      this.doExplosion(640, 295);
    });

    // t=4900 — Giant TV materializes
    this.time.delayedCall(4900, () => {
      tv.setVisible(true).setScale(0.01);
      this.tweens.add({
        targets: tv, scaleX: 1, scaleY: 1,
        duration: 900, ease: "Back.easeOut",
        onComplete: () => this.cameras.main.shake(120, 0.006),
      });
    });

    // t=6600 — Crowd sucked in + arm retreats
    this.time.delayedCall(6600, () => {
      this.tweens.add({ targets: arm, x: CW + 400, duration: 700, ease: "Power3.easeIn" });
      crowd.forEach((c, i) => {
        this.time.delayedCall(i * 145, () => {
          this.tweens.add({
            targets: c, x: 640, y: 310,
            scaleX: 0.02, scaleY: 0.02, alpha: 0,
            duration: 620, ease: "Power3.easeIn",
          });
        });
      });
    });

    // t=8100 — Flash + "Welcome to Puzzlevision!"
    this.time.delayedCall(8100, () => {
      this.cameras.main.flash(350, 255, 255, 255);
      this.time.delayedCall(380, () => {
        this.add.text(CW / 2, CH / 2, "Welcome to\nPuzzlevision!", {
          fontSize: "58px", fontStyle: "bold italic",
          color: "#ffdd00", stroke: "#440088", strokeThickness: 9,
          align: "center",
        }).setOrigin(0.5).setDepth(80);
        this.time.delayedCall(1600, () => {
          this.cameras.main.flash(400, 255, 255, 255);
          this.time.delayedCall(420, () => this.runTheaterScene());
        });
      });
    });
  }

  // ── Luigi / SMG3 outdoor scene ──────────────────────────────────────────

  private runLuigiScene(mario: Phaser.GameObjects.Image, onDone: () => void) {
    const toDestroy: Phaser.GameObjects.GameObject[] = [];

    // Pixel-art Luigi (center) and SMG3 (far right, flipped to face left)
    const luigi = this.makeLuigiPx();          toDestroy.push(luigi);
    const smg3  = this.makeSMG3Px().setFlipX(true); toDestroy.push(smg3);

    // "Meanwhile..." caption
    const caption = this.add.text(CW / 2, 42, "Meanwhile...", {
      fontSize: "24px", fontStyle: "italic",
      color: "#ffffbb", stroke: "#222200", strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setAlpha(0);
    toDestroy.push(caption);
    this.tweens.add({ targets: caption, alpha: 1, duration: 500 });

    // Teletubby mob — 7 random-coloured characters surrounding Luigi
    const TUBBY_COLORS = [0xcc2200, 0x882299, 0x228833, 0xddcc00, 0xcc6611, 0x2255cc, 0xee44aa];
    const TUBBY_POS = [
      { x: 418, y: 528 }, { x: 470, y: 525 }, { x: 522, y: 528 },
      { x: 762, y: 528 }, { x: 814, y: 525 }, { x: 866, y: 528 }, { x: 918, y: 525 },
    ];
    const tubbies = TUBBY_POS.map((p, i) => {
      const t = this.makeTeletubby(p.x, p.y, TUBBY_COLORS[i]);
      toDestroy.push(t);
      return t;
    });

    // Hit loop — each Teletubby lunges toward Luigi, Luigi bounces
    let hitCount = 0;
    const luigiX = luigi.x;
    const hitLuigi = () => {
      tubbies.forEach((t, i) => {
        const dir = t.x < luigiX ? 1 : -1;
        const origX = t.x;
        this.time.delayedCall(i * 55, () => {
          this.tweens.add({ targets: t, x: origX + dir * 22, duration: 105, yoyo: true, ease: "Power2.easeIn" });
        });
      });
      hitCount++;
      if (hitCount % 2 === 0) {
        this.tweens.add({ targets: luigi, y: luigi.y - 14, duration: 78, yoyo: true });
        this.cameras.main.shake(48, 0.003);
      }
    };
    this.time.addEvent({ delay: 560, repeat: 7, callback: hitLuigi });

    // Mario shakes head in horror watching Luigi
    this.tweens.add({
      targets: mario, angle: { from: -8, to: 8 },
      duration: 230, yoyo: true, repeat: 4, ease: "Sine.easeInOut", delay: 350,
    });

    // t=900 — SMG3 speech bubble (to the left of SMG3 at x≈1090, pointing right)
    this.time.delayedCall(900, () => {
      const sbg = this.add.graphics().setDepth(18).setAlpha(0);
      sbg.fillStyle(0x220044, 0.90); sbg.fillRoundedRect(648, 228, 408, 96, 12);
      sbg.fillTriangle(1028, 308, 1056, 324, 1095, 390);  // tail toward SMG3
      const stxt = this.add.text(852, 276,
        '"Are you enjoying yourself,\nLuigi? Heh heh heh..."',
        {
          fontSize: "19px", fontStyle: "bold italic",
          color: "#ddbbff", stroke: "#110022", strokeThickness: 3,
          align: "center",
        },
      ).setOrigin(0.5).setDepth(19).setAlpha(0);
      toDestroy.push(sbg, stxt);
      this.tweens.add({ targets: [sbg, stxt], alpha: 1, duration: 420 });
    });

    // t=4200 — clean up and hand off
    this.time.delayedCall(4200, () => {
      toDestroy.forEach(o => { if (o.active) o.destroy(); });
      onDone();
    });
  }

  // ── Pixel-art sprites for Luigi scene ────────────────────────────────────

  private makeLuigiPx(): Phaser.GameObjects.Image {
    if (!this.textures.exists("cs-luigi-px")) {
      this.textures.addCanvas("cs-luigi-px", this.makeCanvas(36, 42, ctx => {
        // Green cap + brim
        ctx.fillStyle = "#228B22"; ctx.fillRect(4, 0, 28, 8); ctx.fillRect(1, 7, 34, 4);
        // L on cap
        ctx.fillStyle = "#ffffff"; ctx.fillRect(13, 1, 3, 5); ctx.fillRect(13, 5, 7, 2);
        // Face
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8, 10, 20, 11);
        // Eyes (blue)
        ctx.fillStyle = "#334499"; ctx.fillRect(11, 12, 3, 3); ctx.fillRect(22, 12, 3, 3);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(11, 12, 1, 1); ctx.fillRect(22, 12, 1, 1);
        // Mustache
        ctx.fillStyle = "#222222"; ctx.fillRect(9, 18, 7, 3); ctx.fillRect(20, 18, 7, 3);
        // Green shirt
        ctx.fillStyle = "#228B22"; ctx.fillRect(6, 22, 24, 8);
        // Blue overalls
        ctx.fillStyle = "#1133cc"; ctx.fillRect(2, 22, 6, 12); ctx.fillRect(28, 22, 6, 12);
        ctx.fillRect(0, 30, 36, 6);
        // Buttons
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(3, 24, 3, 3); ctx.fillRect(29, 24, 3, 3);
        // Brown shoes
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(1, 36, 14, 6); ctx.fillRect(21, 36, 14, 6);
      }));
    }
    return this.add.image(640, 528, "cs-luigi-px").setScale(5).setOrigin(0.5, 1).setDepth(6);
  }

  private makeSMG3Px(): Phaser.GameObjects.Image {
    if (!this.textures.exists("cs-smg3-px")) {
      this.textures.addCanvas("cs-smg3-px", this.makeCanvas(36, 42, ctx => {
        // Purple cap + brim
        ctx.fillStyle = "#5511aa"; ctx.fillRect(4, 0, 28, 8); ctx.fillRect(1, 7, 34, 4);
        // Skull badge
        ctx.fillStyle = "#000000"; ctx.fillRect(14, 2, 8, 5);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(15, 2, 2, 2); ctx.fillRect(19, 2, 2, 2);
        ctx.fillRect(15, 5, 6, 1);
        // Face
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(7, 10, 22, 11);
        // Red evil eyes
        ctx.fillStyle = "#cc0000"; ctx.fillRect(11, 12, 4, 4); ctx.fillRect(21, 12, 4, 4);
        // Angry eyebrows
        ctx.fillStyle = "#000000"; ctx.fillRect(10, 10, 6, 2); ctx.fillRect(20, 10, 6, 2);
        // Goatee
        ctx.fillStyle = "#222222"; ctx.fillRect(14, 19, 8, 3);
        // Purple jacket
        ctx.fillStyle = "#5511aa"; ctx.fillRect(6, 22, 24, 8);
        // Dark pants
        ctx.fillStyle = "#330077"; ctx.fillRect(2, 22, 6, 12); ctx.fillRect(28, 22, 6, 12);
        ctx.fillRect(0, 30, 36, 6);
        // White gloves
        ctx.fillStyle = "#dddddd"; ctx.fillRect(3, 24, 4, 4); ctx.fillRect(29, 24, 4, 4);
        // Black boots
        ctx.fillStyle = "#111111"; ctx.fillRect(1, 36, 14, 6); ctx.fillRect(21, 36, 14, 6);
      }));
    }
    return this.add.image(1090, 528, "cs-smg3-px").setScale(5).setOrigin(0.5, 1).setDepth(6);
  }

  private makeTeletubby(x: number, y: number, color: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(7);
    // Legs (feet at y=0 = ground)
    g.fillStyle(color);
    g.fillEllipse(-7, -7, 15, 14); g.fillEllipse(7, -7, 15, 14);
    // Body
    g.fillEllipse(0, -28, 34, 46);
    // Belly screen
    g.fillStyle(0xffffff, 0.80); g.fillEllipse(0, -22, 15, 20);
    // Head
    g.fillStyle(color); g.fillCircle(0, -54, 18);
    // Face
    g.fillStyle(0xffd080); g.fillCircle(0, -54, 14);
    // Eyes
    g.fillStyle(0x000000); g.fillCircle(-5, -57, 3); g.fillCircle(5, -57, 3);
    // Mouth
    g.fillStyle(0xff3333); g.fillRect(-3, -51, 6, 2);
    // Antenna wire + ball
    g.fillStyle(0xaaaaaa); g.fillRect(-1, -74, 2, 20);
    g.fillStyle(color); g.fillCircle(0, -75, 5);
    // Arms
    g.fillStyle(color);
    g.fillEllipse(-18, -34, 14, 9); g.fillEllipse(18, -34, 14, 9);
    // Cane (right hand)
    g.fillStyle(0x8b4510); g.fillRect(22, -40, 5, 48);
    g.fillStyle(0x6b3408); g.fillRect(12, -40, 10, 5); g.fillRect(12, -40, 5, 14);
    g.setPosition(x, y);
    return g;
  }

  // ── Theater scene ─────────────────────────────────────────────────────────

  private runTheaterScene() {
    // ── Background: dark theater room ─────────────────────────────────
    const bg = this.add.graphics().setDepth(85);
    bg.fillStyle(0x06040e); bg.fillRect(0, 0, CW, CH);
    // Ceiling strip
    bg.fillStyle(0x040309); bg.fillRect(0, 0, CW, 52);
    bg.fillStyle(0x0e0b18); bg.fillRect(0, 50, CW, 3);

    // ── Theater seat rows (10 rows, matches lobby style) ──────────────
    const SBACK_H = 32, SBASE_H = 10, ROW_GAP = 7, SEAT_W = 40, NUM_ROWS = 10;
    for (let row = 0; row < NUM_ROWS; row++) {
      const ry = 54 + row * (SBACK_H + SBASE_H + ROW_GAP);
      const t  = row / (NUM_ROWS - 1);
      const rv = Math.floor(0x08 + t * 0x08);
      const gv = Math.floor(0x0c + t * 0x0e);
      const bv = Math.floor(0x1c + t * 0x18);
      const backCol = (rv << 16) | (gv << 8) | bv;
      const hiCol   = ((rv + 0x08) << 16) | ((gv + 0x0c) << 8) | (bv + 0x18);
      const baseCol = Math.max(0, backCol - 0x020408);
      bg.fillStyle(backCol); bg.fillRect(54, ry, CW - 54, SBACK_H);
      bg.fillStyle(hiCol);   bg.fillRect(54, ry, CW - 54, 3);
      bg.fillStyle(0x050710);
      for (let x = 54; x <= CW; x += SEAT_W) bg.fillRect(x, ry, 1, SBACK_H);
      bg.fillStyle(baseCol); bg.fillRect(54, ry + SBACK_H, CW - 54, SBASE_H);
    }
    // Carpet aisle between seats and stage
    bg.fillStyle(0x3a0808); bg.fillRect(54, 541, CW - 54, 4);

    // ── Left entrance curtain (same as lobby) ─────────────────────────
    bg.fillStyle(0x560808); bg.fillRect(0, 50, 54, 500);
    bg.fillStyle(0x3e0505); bg.fillRect(0, 50, 22, 500);
    bg.fillStyle(0x6e1111);
    for (let y = 55; y < 548; y += 48) bg.fillRect(22, y, 20, 26);
    bg.fillStyle(0xaa8820); bg.fillRect(0, 48, 60, 5);

    // ── Stage floor (where TVs + characters stand) ────────────────────
    for (let px = 0; px < CW; px += 80) {
      bg.fillStyle(px % 160 === 0 ? 0x3b2210 : 0x2f1b0c);
      bg.fillRect(px, 548, 78, CH - 548);
    }
    bg.fillStyle(0x4a2a14); bg.fillRect(0, 548, CW, 6);

    // ── Overhead light cones (one per TV) ─────────────────────────────
    const lightG = this.add.graphics().setDepth(86);
    for (const lx of [91, 274, 457, 640, 823, 1006, 1189]) {
      lightG.fillStyle(0xffdd88, 0.032);
      lightG.fillTriangle(lx, 52, lx - 75, 340, lx + 75, 340);
      lightG.fillStyle(0xffeeaa, 0.75); lightG.fillCircle(lx, 53, 4);
      lightG.fillStyle(0xffffff, 0.50); lightG.fillCircle(lx - 1, 52, 1.5);
    }

    // 7 floor TVs — all flickering (TV_Y places bottom at stage floor y=548)
    const TV_CX = [91, 274, 457, 640, 823, 1006, 1189];
    const TV_Y  = 500;
    const TW = 132, TH = 96;
    const TSW = 108, TSH = 72;

    const tvScreens: Phaser.GameObjects.Rectangle[] = [];

    TV_CX.forEach((cx, i) => {
      const frame = this.add.graphics().setDepth(87);
      // Stand
      frame.fillStyle(0x2a2a2a);
      frame.fillRect(cx - 8,  TV_Y + TH / 2,      6, 28);
      frame.fillRect(cx + 2,  TV_Y + TH / 2,      6, 28);
      frame.fillRect(cx - 20, TV_Y + TH / 2 + 24, 40,  6);
      // Body
      frame.fillStyle(0x1a1a1a);
      frame.fillRoundedRect(cx - TW / 2, TV_Y - TH / 2, TW, TH, 8);
      // Bezel
      frame.fillStyle(0x0a0a0a);
      frame.fillRect(cx - TSW / 2, TV_Y - TSH / 2, TSW, TSH);
      // Power indicator
      frame.fillStyle(i === 0 ? 0x003300 : 0x660000);
      frame.fillCircle(cx + TW / 2 - 12, TV_Y + TH / 2 - 14, 4);

      const screen = this.add.rectangle(cx, TV_Y, TSW - 6, TSH - 6, 0x1a1a1a).setDepth(88);
      tvScreens.push(screen);
    });

    // Flicker engine
    const STATIC = [0x555555, 0x777777, 0x888888, 0x999999, 0x333333,
                    0xaaaaaa, 0x111111, 0x666666, 0x222222, 0x444444];
    const flickerEvents: Phaser.Time.TimerEvent[] = [];
    tvScreens.forEach(screen => {
      const ev = this.time.addEvent({
        delay: 50 + Phaser.Math.Between(0, 80),
        repeat: -1,
        callback: () => {
          if (Math.random() < 0.12) {
            screen.setAlpha(0);
          } else {
            screen.setAlpha(1);
            screen.setFillStyle(STATIC[Math.floor(Math.random() * STATIC.length)]);
          }
        },
      });
      flickerEvents.push(ev);
    });

    // Characters
    this.makeMrPuzzlesPx().setFlipX(true);
    this.add.image(260, 548, "cs-smg4").setScale(3).setOrigin(0.5, 1).setDepth(89);

    // t=600 — Mr. Puzzles: "My old theater.."
    this.time.delayedCall(600, () => {
      const bub = this.add.graphics().setDepth(92).setAlpha(0);
      bub.fillStyle(0x1a0044, 0.90);
      bub.fillRoundedRect(618, 132, 370, 76, 12);
      bub.fillTriangle(964, 208, 996, 208, 978, 252);
      const txt = this.add.text(803, 170, '"My old theater.."', {
        fontSize: "24px", fontStyle: "bold italic",
        color: "#cc88ff", stroke: "#0a001a", strokeThickness: 4,
      }).setOrigin(0.5).setDepth(93).setAlpha(0);
      this.tweens.add({ targets: [bub, txt], alpha: 1, duration: 340 });
      this.time.delayedCall(1100, () =>
        this.tweens.add({ targets: [bub, txt], alpha: 0, duration: 220 }));
    });

    // t=2200 — SMG4: "Puzzles, if you can get us out, please do."
    this.time.delayedCall(2200, () => {
      const bub = this.add.graphics().setDepth(92).setAlpha(0);
      bub.fillStyle(0x001144, 0.90);
      bub.fillRoundedRect(118, 108, 530, 98, 12);
      bub.fillTriangle(170, 206, 228, 206, 198, 252);
      const txt = this.add.text(383, 157, '"Puzzles, if you can get us\nout, please do."', {
        fontSize: "22px", fontStyle: "bold italic",
        color: "#55aaff", stroke: "#000d22", strokeThickness: 4,
        align: "center",
      }).setOrigin(0.5).setDepth(93).setAlpha(0);
      this.tweens.add({ targets: [bub, txt], alpha: 1, duration: 340 });
      this.time.delayedCall(1400, () =>
        this.tweens.add({ targets: [bub, txt], alpha: 0, duration: 220 }));
    });

    // t=4000 — Mr. Puzzles: "I can try to activate one of these TVs."
    this.time.delayedCall(4000, () => {
      const bub = this.add.graphics().setDepth(92).setAlpha(0);
      bub.fillStyle(0x1a0044, 0.90);
      bub.fillRoundedRect(508, 100, 474, 98, 12);
      bub.fillTriangle(950, 198, 982, 198, 966, 242);
      const txt = this.add.text(745, 149, '"I can try to activate one\nof these TVs."', {
        fontSize: "22px", fontStyle: "bold italic",
        color: "#cc88ff", stroke: "#0a001a", strokeThickness: 4,
        align: "center",
      }).setOrigin(0.5).setDepth(93).setAlpha(0);
      this.tweens.add({ targets: [bub, txt], alpha: 1, duration: 340 });
      this.time.delayedCall(1200, () =>
        this.tweens.add({ targets: [bub, txt], alpha: 0, duration: 220 }));
    });

    // t=5600 — Zap! TV 0 (Mario's Mysteries) activates
    this.time.delayedCall(5600, () => {
      // Mr. Puzzles is at x=1020 flipped; visual left hand ~(960, 480)
      this.doZap(960, 480, TV_CX[0], TV_Y);
      this.time.removeEvent(flickerEvents[0]);
      this.time.delayedCall(440, () => {
        // Swap static rectangle for the real Mario's Mysteries thumbnail
        tvScreens[0].setAlpha(0);
        const SW = TSW - 6, SH = TSH - 6;  // 102 × 66 — screen area
        if (!this.textures.exists("cs-marios-mysteries")) {
          const srcImg = this.textures.get("marios-mysteries").source[0].image as HTMLImageElement;
          this.textures.addCanvas("cs-marios-mysteries", this.makeCanvas(SW, SH, ctx => {
            const scale = Math.max(SW / srcImg.naturalWidth, SH / srcImg.naturalHeight);
            const dw = srcImg.naturalWidth  * scale;
            const dh = srcImg.naturalHeight * scale;
            ctx.drawImage(srcImg, (SW - dw) / 2, (SH - dh) / 2, dw, dh);
          }));
        }
        this.add.image(TV_CX[0], TV_Y, "cs-marios-mysteries").setDepth(89);
        // Green power-on glow behind TV 0
        const glow = this.add.graphics().setDepth(86);
        glow.fillStyle(0x00ff44, 0.30);
        glow.fillRoundedRect(TV_CX[0] - TW / 2 - 14, TV_Y - TH / 2 - 14, TW + 28, TH + 28, 12);
      });
    });

    // t=7400 — hand off to game
    this.time.delayedCall(7400, () => this.endCutscene());
  }

  private makeMrPuzzlesPx(): Phaser.GameObjects.Image {
    if (!this.textures.exists("cs-puzzles")) {
      this.textures.addCanvas("cs-puzzles", this.makeCanvas(36, 42, ctx => {
        // Exact copy of the playable mrpuzzles sprite
        // Antenna rod + ball
        ctx.fillStyle = "#666666"; ctx.fillRect(17, 0, 2, 6);
        ctx.fillStyle = "#ffdd00";
        ctx.beginPath(); ctx.arc(18, 0, 2, 0, Math.PI * 2); ctx.fill();
        // TV box head
        ctx.fillStyle = "#888888"; ctx.fillRect(5, 4, 26, 16);
        // Screen
        ctx.fillStyle = "#222222"; ctx.fillRect(7, 6, 22, 12);
        // Eyes (light blue-gray circles with black pupils)
        ctx.fillStyle = "#aabbcc";
        ctx.beginPath(); ctx.arc(13, 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(23, 9, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000"; ctx.fillRect(12, 9, 2, 2); ctx.fillRect(22, 9, 2, 2);
        // Color-bar mouth (red / green / yellow / blue)
        ctx.fillStyle = "#ff4444"; ctx.fillRect(7,  13, 6, 5);
        ctx.fillStyle = "#44dd44"; ctx.fillRect(13, 13, 5, 5);
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(18, 13, 5, 5);
        ctx.fillStyle = "#4488ff"; ctx.fillRect(23, 13, 6, 5);
        // Black suit body
        ctx.fillStyle = "#111111"; ctx.fillRect(5, 20, 26, 16);
        // White shirt + bow tie
        ctx.fillStyle = "#ffffff"; ctx.fillRect(13, 20, 10, 8);
        ctx.fillStyle = "#111111";
        ctx.beginPath(); ctx.moveTo(14, 20); ctx.lineTo(18, 23); ctx.lineTo(14, 26); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(22, 20); ctx.lineTo(18, 23); ctx.lineTo(22, 26); ctx.closePath(); ctx.fill();
        // Long thin arms
        ctx.fillStyle = "#111111"; ctx.fillRect(0, 21, 6, 3); ctx.fillRect(30, 21, 6, 3);
        // Large hands
        ctx.fillStyle = "#333333"; ctx.fillRect(0, 18, 5, 8); ctx.fillRect(31, 18, 5, 8);
        // Pants + shoes
        ctx.fillStyle = "#111111"; ctx.fillRect(9, 36, 18, 6);
        ctx.fillStyle = "#000000"; ctx.fillRect(8, 39, 9, 3); ctx.fillRect(19, 39, 9, 3);
      }));
    }
    return this.add.image(1020, 548, "cs-puzzles").setScale(3).setOrigin(0.5, 1).setDepth(89);
  }

  private endCutscene() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.cameras.main.fadeOut(650, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () =>
      this.scene.start("CharacterSelectScene"),
    );
  }

  // ── Dialogue scene elements ───────────────────────────────────────────────

  private makeDialogueBg(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(0);
    // Warm outdoor sky
    g.fillGradientStyle(0xaaddff, 0xaaddff, 0x77bbff, 0x77bbff, 1);
    g.fillRect(0, 0, CW, CH);
    // Grass
    g.fillStyle(0x44aa22); g.fillRect(0, 530, CW, CH - 530);
    g.fillStyle(0x339922); g.fillRect(0, 530, CW, 14);
    // Wooden picnic table (right side where Mario + spaghetti are)
    g.fillStyle(0xaa7733); g.fillRect(570, 468, 530, 18);  // tabletop
    g.fillStyle(0x885522);
    g.fillRect(592, 486, 14, 66); g.fillRect(1066, 486, 14, 66); // legs
    g.fillRect(580, 536, 516, 14);                                // crossbar
    // Background tree (left, behind SMG4)
    g.fillStyle(0x6b3a1e); g.fillRect(64, 330, 18, 220);
    g.fillStyle(0x228822); g.fillCircle(73, 305, 50);
    g.fillStyle(0x33aa33); g.fillCircle(56, 290, 34);
    g.fillStyle(0x44cc44); g.fillCircle(90, 285, 30);
    return g;
  }

  private makeSpaghetti(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(2);
    const PX = 830, PY = 434;
    // Plate shadow
    g.fillStyle(0x888888, 0.35); g.fillEllipse(PX + 8, PY + 12, 318, 102);
    // Plate rim
    g.fillStyle(0xffffff); g.fillEllipse(PX, PY, 310, 96);
    g.fillStyle(0xeeeeee); g.fillEllipse(PX, PY, 284, 84);
    // Tomato sauce
    g.fillStyle(0xbb2200, 0.75); g.fillEllipse(PX, PY, 248, 68);
    // Noodle strands (orange-yellow squiggles drawn as segmented lines)
    g.lineStyle(5, 0xffcc44, 0.95);
    const strands: number[][] = [
      [-100,-6, -55,10, 0,-8, 55,12, 100,-4],
      [-90, 10, -40,-10, 20,14, 70,-6, 105, 8],
      [-80,-12,  -30,8, 30,-10, 80, 10, 108,-6],
      [-95,  4, -45,-8, 10,12, 60, -8,  98,  4],
      [-70,  8,  -20,-12, 40, 8, 85,-10],
    ];
    strands.forEach(pts => {
      g.beginPath();
      for (let i = 0; i < pts.length; i += 2) {
        const wx = PX + pts[i], wy = PY + pts[i + 1] * 0.32;
        i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
      }
      g.strokePath();
    });
    // Meatballs
    [[-42,-2],[18,-10],[68,6],[-72,-6]].forEach(([dx, dy]) => {
      g.fillStyle(0x6a2f18); g.fillCircle(PX + dx, PY + dy * 0.32, 15);
      g.fillStyle(0x7a3a22); g.fillCircle(PX + dx - 3, PY + dy * 0.32 - 4, 6);
    });
    // Parmesan flecks
    g.fillStyle(0xffffc8, 0.75);
    [[0,14],[-55,4],[52,-12],[30,10]].forEach(([dx, dy]) => {
      g.fillCircle(PX + dx, PY + dy * 0.32, 5);
    });
    return g;
  }

  private makeCanvas(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    return c;
  }

  private makeSMG4(): Phaser.GameObjects.Image {
    if (!this.textures.exists("cs-smg4")) {
      this.textures.addCanvas("cs-smg4", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#2244cc"; ctx.fillRect(4,0,28,8); ctx.fillRect(1,7,34,4);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(14,1,8,6);
        ctx.fillStyle = "#4488ee";
        ctx.fillRect(14,1,8,2); ctx.fillRect(14,4,8,2); ctx.fillRect(14,6,8,2);
        ctx.fillRect(14,1,2,3); ctx.fillRect(20,4,2,3);
        ctx.fillStyle = "#222200"; ctx.fillRect(6,9,24,4);
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(8,10,20,12);
        ctx.fillStyle = "#000";    ctx.fillRect(11,13,3,3); ctx.fillRect(22,13,3,3);
        ctx.fillStyle = "#333";    ctx.fillRect(10,19,6,2); ctx.fillRect(20,19,6,2);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0,22,36,14);
        ctx.fillStyle = "#2244cc"; ctx.fillRect(10,22,16,6);
        ctx.fillStyle = "#dddddd"; ctx.fillRect(4,22,6,8); ctx.fillRect(26,22,6,8);
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(5,23,3,3); ctx.fillRect(27,23,3,3);
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(1,36,14,6); ctx.fillRect(21,36,14,6);
      }));
    }
    return this.add.image(240, 525, "cs-smg4")
      .setScale(5).setOrigin(0.5, 1).setDepth(5);
  }

  private makeMario(): Phaser.GameObjects.Image {
    if (!this.textures.exists("cs-mario")) {
      this.textures.addCanvas("cs-mario", this.makeCanvas(36, 42, ctx => {
        ctx.fillStyle = "#dd2200"; ctx.fillRect(4, 0, 28, 8); ctx.fillRect(1, 7, 34, 4);
        ctx.fillStyle = "#ffcc88"; ctx.fillRect(7, 9, 22, 13);
        ctx.fillStyle = "#000";    ctx.fillRect(10,12, 4, 4); ctx.fillRect(22,12, 4, 4);
        ctx.fillStyle = "#333";    ctx.fillRect(7,18, 9, 3); ctx.fillRect(20,18, 9, 3);
        ctx.fillStyle = "#dd2200"; ctx.fillRect(7,22, 22, 7);
        ctx.fillStyle = "#1133cc"; ctx.fillRect(3,22, 6,10); ctx.fillRect(27,22, 6,10);
        ctx.fillRect(0, 29, 36, 7);
        ctx.fillStyle = "#ffdd00"; ctx.fillRect(4,23, 3, 3); ctx.fillRect(28,23, 3, 3);
        ctx.fillStyle = "#6b3a1e"; ctx.fillRect(1,36,14, 6); ctx.fillRect(21,36,14, 6);
      }));
    }
    return this.add.image(810, 440, "cs-mario")
      .setScale(4).setOrigin(0.5, 1).setDepth(6);
  }

  // ── Showgrounds elements ──────────────────────────────────────────────────

  private makeSky(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(0);
    g.fillGradientStyle(0x88ccff, 0x88ccff, 0x44aaee, 0x44aaee, 1);
    g.fillRect(0, 0, CW, CH);
    g.fillStyle(0x44aa22); g.fillRect(0, 480, CW, CH - 480);
    g.fillStyle(0x339922); g.fillRect(0, 480, CW, 14);
    g.fillStyle(0x55bb33, 0.35);
    g.fillEllipse(220, 490, 420, 110); g.fillEllipse(1080, 492, 370, 100);
    g.fillStyle(0xffffff, 0.88);
    ([
      [130, 72, 88, 32], [440, 56, 70, 25], [760, 82, 80, 28], [1060, 64, 64, 22],
    ] as number[][]).forEach(([cx, cy, rw, rh]) => {
      g.fillEllipse(cx, cy, rw * 2, rh * 2);
      g.fillEllipse(cx - rw * 0.38, cy + rh * 0.45, rw * 1.5, rh * 1.6);
      g.fillEllipse(cx + rw * 0.38, cy + rh * 0.45, rw * 1.5, rh * 1.5);
    });
    return g;
  }

  private makeFence(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xddcc88);
    for (let fx = 80; fx <= 1200; fx += 56) g.fillRect(fx, 464, 7, 26);
    g.fillRect(80, 468, 1127, 7); g.fillRect(80, 480, 1127, 6);
    return g;
  }

  private makeTent(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics().setDepth(3);
    this.drawSideTent(g, 258, 430, 0.76);
    this.drawSideTent(g, 1022, 430, 0.76);
    g.fillStyle(0xbbbbbb);
    g.fillRect(122, 196, 6, 292); g.fillRect(1152, 196, 6, 292);
    g.fillStyle(0xdd2222); g.fillRect(128, 196, 50, 28);
    g.fillStyle(0x2244cc); g.fillRect(1152, 210, 50, 28);
    g.fillStyle(0x1a3bcc); g.fillEllipse(640, 295, 570, 440);
    for (let s = 0; s < 12; s++) {
      const a = -Math.PI * 0.95 + (s / 12) * Math.PI * 1.9;
      g.fillStyle(s % 2 === 0 ? 0x1a3bcc : 0x233fd4);
      g.fillTriangle(640, 295,
        640 + Math.cos(a) * 310, 295 + Math.sin(a) * 230,
        640 + Math.cos(a + Math.PI / 12) * 310, 295 + Math.sin(a + Math.PI / 12) * 230);
    }
    g.fillStyle(0xffcc00);
    for (let sc = 0; sc < 14; sc++) g.fillCircle(362 + sc * 48, 392, 25);
    g.fillRect(358, 372, 570, 26);
    g.fillStyle(0xffffff); g.fillRect(358, 392, 570, 15);
    g.fillStyle(0xffcc00); g.fillRect(358, 407, 570, 10);
    g.fillStyle(0x1a3bcc); g.fillRect(442, 392, 396, 100);
    g.fillStyle(0xffcc00); g.fillEllipse(640, 272, 128, 116);
    g.fillStyle(0x162fcc); g.fillEllipse(640, 272, 102, 92);
    g.fillStyle(0xffdd00);
    g.fillRect(620, 233, 46, 10); g.fillRect(620, 233, 11, 26);
    g.fillRect(620, 259, 46, 10); g.fillRect(655, 259, 11, 26);
    g.fillRect(620, 285, 46, 10);
    g.fillStyle(0x0e2599); g.fillRect(572, 394, 136, 98); g.fillEllipse(640, 394, 136, 56);
    g.fillStyle(0x000011); g.fillRect(583, 406, 114, 86); g.fillEllipse(640, 406, 114, 44);
    g.fillStyle(0xaaaaaa); g.fillRect(637, 68, 6, 90);
    g.fillStyle(0x2244dd); g.fillTriangle(643, 68, 643, 42, 643 + 42, 58);
    g.fillStyle(0xffcc00); g.fillTriangle(637, 42, 637, 68, 637 - 16, 54);
    const bunting = [0xdd2222, 0x2244dd, 0xffcc00, 0x22aa44, 0xcc44aa, 0xff8811, 0x22bbcc];
    for (let b = 0; b < 8; b++) {
      const bx = 370 + b * 66, by = 358 + Math.sin(b * 1.2) * 16;
      g.fillStyle(bunting[b % bunting.length]);
      g.fillTriangle(bx, by, bx + 14, by, bx + 7, by + 20);
    }
    return g;
  }

  private drawSideTent(
    g: Phaser.GameObjects.Graphics,
    cx: number, baseY: number, scale: number,
  ) {
    const sw = 290 * scale, sh = 210 * scale;
    g.fillStyle(0x1a3bcc);
    g.fillEllipse(cx, baseY - sh * 0.45, sw, sh * 0.9);
    g.fillRect(cx - sw / 2, baseY - sh * 0.45, sw, sh * 0.55);
    g.fillStyle(0xffcc00);
    for (let sc = 0; sc < 5; sc++) {
      g.fillCircle(cx - sw / 2 + 26 + sc * ((sw - 52) / 4), baseY - sh * 0.45 + 5, 18 * scale);
    }
    g.fillRect(cx - sw / 2, baseY - sh * 0.45 - 10, sw, 14);
    g.fillStyle(0xffffff); g.fillRect(cx - sw / 2, baseY - sh * 0.45 + 4, sw, 10);
    g.fillStyle(0xffcc00); g.fillRect(cx - sw / 2, baseY - sh * 0.45 + 14, sw, 8);
    g.fillStyle(0x000011);
    g.fillRect(cx - 26 * scale, baseY - sh * 0.12, 52 * scale, sh * 0.22);
    g.fillEllipse(cx, baseY - sh * 0.12, 52 * scale, 26 * scale);
  }

  private makeCrowd(): Phaser.GameObjects.Container[] {
    const defs = [
      { x: 145, cap: 0xdd2200, body: 0xdd2200, pants: 0x1133cc },
      { x: 270, cap: 0x228822, body: 0x228822, pants: 0x1133cc },
      { x: 380, cap: 0xeecc00, body: 0xeecc00, pants: 0x882288 },
      { x: 490, cap: 0xff88cc, body: 0xffffff, pants: 0xff44aa },
      { x: 760, cap: 0x2244cc, body: 0x2244cc, pants: 0x112299 },
      { x: 870, cap: 0x8822cc, body: 0x8822cc, pants: 0x551199 },
      { x: 975, cap: 0x4488ff, body: 0x4488ff, pants: 0xccbb88 },
      { x: 1075, cap: 0xcc2200, body: 0xffffff, pants: 0x333344 },
    ];
    return defs.map(({ x, cap, body, pants }) => {
      const g = this.add.graphics();
      g.fillStyle(0xffcc88); g.fillEllipse(0, -24, 24, 20);
      g.fillStyle(cap);      g.fillEllipse(0, -34, 28, 14);
      g.fillStyle(body);     g.fillRect(-11, -14, 22, 20);
      g.fillStyle(pants);    g.fillRect(-11,   6, 22, 18);
      g.fillStyle(0x6b3a1e); g.fillRect(-11, 22, 9, 8); g.fillRect(2, 22, 9, 8);
      return this.add.container(x, 472, [g]).setDepth(5);
    });
  }

  private makeArm(): Phaser.GameObjects.Container {
    const g = this.add.graphics();
    // Sleeve — extends far upward so the top hangs off the screen edge
    g.fillStyle(0x555555); g.fillRect(-15, -300, 30, 300);
    g.fillStyle(0x3d3d3d); g.fillRect(-17, -12, 34, 10);  // elbow band
    // Forearm
    g.fillStyle(0x666666); g.fillRect(-13, -2, 26, 120);
    g.fillStyle(0x3d3d3d); g.fillRect(-15, 116, 30, 12);  // wrist band
    // Palm + fingers
    g.fillStyle(0x444444); g.fillEllipse(4, 158, 72, 52);
    for (let f = -2; f <= 2; f++) {
      g.fillStyle(0x4a4a4a);
      g.fillRect(f * 13 - 5, 138, 10, 36 - Math.abs(f) * 4);
    }
    // Electricity glow
    g.fillStyle(0xffffaa, 0.35); g.fillCircle(4, 170, 30);
    g.fillStyle(0xffff66, 0.80); g.fillCircle(4, 170, 18);
    g.fillStyle(0xffffff, 0.55); g.fillCircle(4, 170, 9);

    // scale=0.6, y=150 → sleeve top at 150 - 300*0.6 = -30 (off-screen above)
    // hand glow at screen y = 150 + 170*0.6 = 252
    const cont = this.add.container(CW + 350, 150, [g]).setDepth(18).setScale(0.6);
    cont.setVisible(false);
    return cont;
  }

  private makeBigTV(): Phaser.GameObjects.Container {
    const TW = 460, TH = 338;
    const g = this.add.graphics();
    g.fillStyle(0x191919); g.fillRoundedRect(-TW / 2, -TH / 2, TW, TH, 14);
    g.fillStyle(0x0c0c0c); g.fillRect(-TW / 2 + 10, -TH / 2 + 10, TW - 20, TH - 50);
    g.fillStyle(0x0a1a66); g.fillRect(-TW / 2 + 14, -TH / 2 + 14, TW - 28, TH - 58);
    g.fillStyle(0xffffff, 0.7);
    [[-140,-100],[-70,-120],[40,-90],[130,-110],[-110,-60],[100,-70],[0,-130],[-50,-40]].forEach(
      ([sx, sy]) => g.fillCircle(sx, sy, 2));
    const bars = [0xff4444, 0xffdd00, 0x44cc44, 0x44aaff, 0xcc44cc, 0xff8833];
    bars.forEach((c, i) => { g.fillStyle(c); g.fillRect(-TW / 2 + 14 + i * 72, TH / 2 - 68, 68, 22); });
    g.fillStyle(0xffffff, 0.9); g.fillRect(-130, -TH / 2 + 28, 260, 26);
    g.fillStyle(0x1a1a1a); g.fillRect(-118, -TH / 2 + 32, 28, 18);
    g.fillStyle(0x3366aa); g.fillRect(-115, -TH / 2 + 34, 22, 14);
    g.fillStyle(0xffffff, 0.15); g.fillEllipse(0, -20, 120, 100);
    g.fillStyle(0xffdd00); g.fillEllipse(0, -20, 70, 60);
    g.fillStyle(0x0a1a66); g.fillEllipse(0, -20, 50, 42);
    g.fillStyle(0xffdd00);
    g.fillRect(-8, -42, 16, 10); g.fillRect(-8, 0, 16, 10);
    g.fillRect(-42, -12, 10, 16); g.fillRect(2, -12, 10, 16);
    g.fillStyle(0x333333);
    g.fillRect(-34, -TH / 2 - 58, 7, 60); g.fillRect(27, -TH / 2 - 46, 7, 48);
    g.fillCircle(-30, -TH / 2 - 60, 8); g.fillCircle(30, -TH / 2 - 48, 8);
    g.fillStyle(0x222222);
    g.fillRect(-28, TH / 2, 56, 24); g.fillRect(-64, TH / 2 + 20, 128, 10);
    g.fillStyle(0xcc1100); g.fillCircle(TW / 2 - 22, TH / 2 - 16, 7);
    const title = this.add.text(0, -TH / 2 + 42, "PUZZLEVISION", {
      fontSize: "20px", fontStyle: "bold", color: "#1a1a66", letterSpacing: 3,
    }).setOrigin(0.5, 0.5).setDepth(0);
    const cont = this.add.container(640, 310, [g, title]).setDepth(20);
    cont.setVisible(false);
    return cont;
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  private doZap(fromX: number, fromY: number, toX: number, toY: number) {
    const zap = this.add.graphics().setDepth(30);
    const draw = () => {
      zap.clear();
      zap.lineStyle(12, 0xffffff, 0.2);
      zap.beginPath(); zap.moveTo(fromX, fromY); zap.lineTo(toX, toY); zap.strokePath();
      zap.lineStyle(3, 0xffff44, 1);
      zap.beginPath();
      const steps = 16;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const jx = (i > 0 && i < steps) ? Phaser.Math.Between(-32, 32) : 0;
        const jy = (i > 0 && i < steps) ? Phaser.Math.Between(-20, 20) : 0;
        const x = fromX + (toX - fromX) * t + jx;
        const y = fromY + (toY - fromY) * t + jy;
        i === 0 ? zap.moveTo(x, y) : zap.lineTo(x, y);
      }
      zap.strokePath();
    };
    this.cameras.main.flash(120, 255, 255, 200);
    const ev = this.time.addEvent({ delay: 38, repeat: 11, callback: draw });
    this.time.delayedCall(520, () => { ev.destroy(); zap.destroy(); });
  }

  private doExplosion(cx: number, cy: number) {
    const cols = [0x1a3bcc, 0xffcc00, 0xdd2222, 0x22aa33, 0xffffff, 0xaaaaaa, 0x2255ee];
    for (let i = 0; i < 30; i++) {
      const g = this.add.graphics().setDepth(25);
      g.fillStyle(cols[i % cols.length]);
      const sz = Phaser.Math.Between(6, 30);
      i % 3 === 0
        ? g.fillEllipse(0, 0, sz, sz)
        : g.fillRect(-sz / 2, -sz / 2, sz, sz * (0.5 + Math.random() * 0.7));
      g.x = cx + Phaser.Math.Between(-150, 150);
      g.y = cy + Phaser.Math.Between(-110, 110);
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(160, 550);
      this.tweens.add({
        targets: g,
        x: g.x + Math.cos(angle) * speed,
        y: g.y + Math.sin(angle) * speed + 200,
        angle: Phaser.Math.Between(-540, 540), alpha: 0,
        duration: 900 + Math.random() * 700, ease: "Power2.easeIn",
        onComplete: () => g.destroy(),
      });
    }
    for (let i = 0; i < 12; i++) {
      const smoke = this.add.circle(
        cx + Phaser.Math.Between(-90, 90),
        cy + Phaser.Math.Between(-60, 70),
        Phaser.Math.Between(16, 52),
        i % 3 === 0 ? 0x555555 : 0x999999, 0.55,
      ).setDepth(26);
      this.tweens.add({
        targets: smoke, y: smoke.y - 160, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 900 + Math.random() * 600, ease: "Power1",
        onComplete: () => smoke.destroy(),
      });
    }
    const ring = this.add.circle(cx, cy, 10, 0xffffff, 0.9).setDepth(27);
    this.tweens.add({
      targets: ring, scaleX: 22, scaleY: 22, alpha: 0,
      duration: 600, ease: "Power2.easeOut",
      onComplete: () => ring.destroy(),
    });
  }
}
