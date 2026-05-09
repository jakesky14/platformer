import Phaser from "phaser";

const CW = 1280, CH = 720;

export class CutsceneScene extends Phaser.Scene {
  constructor() { super("CutsceneScene"); }

  create() {
    this.cameras.main.fadeIn(700, 0, 0, 0);

    // ── Build showgrounds scene — hidden until dialogue ends ──────────────
    const sgSky   = this.makeSky();
    const sgFence = this.makeFence();
    const sgTent  = this.makeTent();
    const sgCrowd = this.makeCrowd();
    const sgArm   = this.makeArm();
    const sgTV    = this.makeBigTV();
    [sgSky, sgFence, sgTent, ...sgCrowd].forEach(o => o.setVisible(false));
    // arm and tv are hidden inside their constructors

    // ── Build dialogue scene — visible immediately ─────────────────────────
    const dlgBg    = this.makeDialogueBg();
    const dlgPlate = this.makeSpaghetti();
    const dlgSMG4  = this.makeSMG4();
    const dlgMario = this.makeMario();

    // Skip button
    const doSkip = () => this.endCutscene();
    this.add.text(CW - 14, CH - 14, "SKIP  ▶", {
      fontSize: "14px", color: "#ffffff60",
    }).setOrigin(1, 1).setDepth(200)
      .setInteractive({ cursor: "pointer" })
      .on("pointerdown", doSkip);
    this.input.keyboard!.once("keydown", doSkip);

    // ── Run dialogue, then showgrounds ────────────────────────────────────
    this.runDialogue(dlgMario, () => {
      [dlgBg, dlgPlate, dlgSMG4, dlgMario].forEach(o => o.setVisible(false));
      [sgSky, sgFence, sgTent, ...sgCrowd].forEach(o => o.setVisible(true));
      this.runShowgrounds(sgTent, sgFence, sgCrowd, sgArm, sgTV);
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

    // t=3100 — ZAP  (arm at 0.25×scale: hand glow at container+(4×0.25, 170×0.25))
    this.time.delayedCall(3100, () => {
      this.doZap(CW - 160 + 1, 300 + 43, 640, 295);
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
        this.time.delayedCall(1600, () => this.endCutscene());
      });
    });
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
    // Sleeve — extends far upward (off-screen at 0.25 scale)
    g.fillStyle(0xaaaaaa); g.fillRect(-15, -300, 30, 300);
    g.fillStyle(0x999999); g.fillRect(-17, -12, 34, 10);  // elbow band
    // Forearm
    g.fillStyle(0xbbbbbb); g.fillRect(-13, -2, 26, 120);
    g.fillStyle(0x999999); g.fillRect(-15, 116, 30, 12);  // wrist band
    // Palm + fingers
    g.fillStyle(0x888888); g.fillEllipse(4, 158, 72, 52);
    for (let f = -2; f <= 2; f++) {
      g.fillStyle(0x999999);
      g.fillRect(f * 13 - 5, 138, 10, 36 - Math.abs(f) * 4);
    }
    // Electricity glow
    g.fillStyle(0xffffaa, 0.35); g.fillCircle(4, 170, 30);
    g.fillStyle(0xffff66, 0.80); g.fillCircle(4, 170, 18);
    g.fillStyle(0xffffff, 0.55); g.fillCircle(4, 170, 9);

    // scale(0.25) = quarter size as requested
    const cont = this.add.container(CW + 350, 300, [g]).setDepth(18).setScale(0.25);
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
