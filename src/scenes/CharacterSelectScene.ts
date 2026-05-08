import Phaser from "phaser";

type CharDef = { key: string; name: string; cap: number; shirt: number; pants: number; skin: number };

const PAGE1: CharDef[] = [
  { key: "mario",   name: "Mario",   cap: 0xdd2200, shirt: 0xdd2200, pants: 0x1133cc, skin: 0xffcc88 },
  { key: "luigi",   name: "Luigi",   cap: 0x228822, shirt: 0x228822, pants: 0x1133cc, skin: 0xffcc88 },
  { key: "toad",    name: "Toad",    cap: 0xff4444, shirt: 0xffffff, pants: 0x4444ff, skin: 0xffeecc },
  { key: "yoshi",   name: "Yoshi",   cap: 0xff4444, shirt: 0x44cc44, pants: 0x44cc44, skin: 0xffffff },
  { key: "peach",   name: "Peach",   cap: 0xff88bb, shirt: 0xffddee, pants: 0xff88bb, skin: 0xffcc88 },
  { key: "bowser",  name: "Bowser",  cap: 0x2a7a2a, shirt: 0xddaa00, pants: 0xddaa00, skin: 0xccaa44 },
];

const PAGE2: CharDef[] = [
  { key: "smg4",    name: "SMG4",    cap: 0x2244cc, shirt: 0x2244cc, pants: 0x112299, skin: 0xffcc88 },
  { key: "smg3",    name: "SMG3",    cap: 0x8822cc, shirt: 0x8822cc, pants: 0x551199, skin: 0xffcc88 },
  { key: "shroomy", name: "Shroomy", cap: 0x22aa44, shirt: 0xeeffee, pants: 0x116633, skin: 0xffeecc },
  { key: "bob",     name: "Bob",     cap: 0x222222, shirt: 0x333333, pants: 0x111111, skin: 0x99bb77 },
  { key: "meggy",   name: "Meggy",   cap: 0xcc2200, shirt: 0xffffff, pants: 0x333344, skin: 0xffccaa },
];

const PAGES = [PAGE1, PAGE2];
const PAGE_LABELS = ["Classic", "SMG4 Universe"];

const W      = 1280;
const H      = 720;
const CARD_H = 280;

export class CharacterSelectScene extends Phaser.Scene {
  private page       = 0;
  private selected   = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private cursors!:  Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private starting   = false;
  private inputReady = false;

  private cardLayer!:     Phaser.GameObjects.Container;
  private leftArrowBtn!:  Phaser.GameObjects.Text;
  private rightArrowBtn!: Phaser.GameObjects.Text;
  private pageDots!:      Phaser.GameObjects.Text;
  private pageLabel!:     Phaser.GameObjects.Text;

  constructor() { super("CharacterSelectScene"); }

  create() {
    this.starting   = false;
    this.inputReady = false;
    this.page       = 0;
    this.selected   = 0;
    this.cards      = [];

    // Grace period — prevents lingering key presses from GameScene firing immediately
    this.time.delayedCall(150, () => { this.inputReady = true; });

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a3a, 0x1a0a3a, 0x3a1a6a, 0x3a1a6a, 1);
    bg.fillRect(0, 0, W, H);

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H * 0.7);
      const r = Math.random() * 1.5 + 0.5;
      this.add.circle(x, y, r, 0xffffff, 0.6 + Math.random() * 0.4);
    }

    this.add.text(W / 2, 60, "SELECT YOUR CHARACTER", {
      fontSize: "36px", fontStyle: "bold",
      color: "#ffdd00", stroke: "#000000", strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(W / 2, 105, "← → browse   Enter / Click to play   ◄ ► change page", {
      fontSize: "15px", color: "#aaaaff",
    }).setOrigin(0.5);

    // Page section label
    this.pageLabel = this.add.text(W / 2, 138, "", {
      fontSize: "18px", fontStyle: "bold", color: "#ffaa44",
      stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // Container cleared on each page flip
    this.cardLayer = this.add.container(0, 0);

    // ◄ / ► page arrows
    this.leftArrowBtn = this.add.text(24, H / 2, "◄", {
      fontSize: "54px", color: "#ffdd00",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(0, 0.5).setInteractive({ cursor: "pointer" }).setDepth(10);
    this.leftArrowBtn.on("pointerdown", () => this.flipPage(-1));
    this.leftArrowBtn.on("pointerover", () => this.leftArrowBtn.setAlpha(0.65));
    this.leftArrowBtn.on("pointerout",  () => this.leftArrowBtn.setAlpha(1.0));

    this.rightArrowBtn = this.add.text(W - 24, H / 2, "►", {
      fontSize: "54px", color: "#ffdd00",
      stroke: "#000", strokeThickness: 4,
    }).setOrigin(1, 0.5).setInteractive({ cursor: "pointer" }).setDepth(10);
    this.rightArrowBtn.on("pointerdown", () => this.flipPage(1));
    this.rightArrowBtn.on("pointerover", () => this.rightArrowBtn.setAlpha(0.65));
    this.rightArrowBtn.on("pointerout",  () => this.rightArrowBtn.setAlpha(1.0));

    // Dot indicator
    this.pageDots = this.add.text(W / 2, H - 36, "", {
      fontSize: "22px", color: "#aaaaff",
      stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.buildCards();
  }

  update() {
    if (this.starting || !this.inputReady) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      if (this.selected > 0) {
        this.selected--;
        this.refreshHighlight();
      } else if (this.page > 0) {
        this.flipPage(-1);
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      const pageLen = PAGES[this.page].length;
      if (this.selected < pageLen - 1) {
        this.selected++;
        this.refreshHighlight();
      } else if (this.page < PAGES.length - 1) {
        this.flipPage(1);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame();
    }
  }

  // ── Layout helpers ────────────────────────────────────────────────────────────

  private cardDims(numCards: number) {
    return numCards > 4
      ? { cardW: 176, gap: 22 }
      : { cardW: 200, gap: 40 };
  }

  // ── Card building ─────────────────────────────────────────────────────────────

  private buildCards() {
    this.cardLayer.removeAll(true);
    this.cards = [];

    const chars = PAGES[this.page];
    const { cardW, gap } = this.cardDims(chars.length);
    const totalW = chars.length * cardW + (chars.length - 1) * gap;
    const startX = (W - totalW) / 2;

    chars.forEach((ch, i) => {
      const x = startX + i * (cardW + gap) + cardW / 2;
      const y = H / 2 + 30;
      const container = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(0x2a1a4a, 1);
      bg.fillRoundedRect(-cardW / 2, -CARD_H / 2, cardW, CARD_H, 12);
      container.add(bg);

      const art = this.makeCharArt(ch, cardW);
      art.setPosition(0, -28);
      container.add(art);

      const label = this.add.text(0, CARD_H / 2 - 34, ch.name, {
        fontSize: "20px", fontStyle: "bold",
        color: "#ffffff", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5);
      container.add(label);

      const hit = this.add.zone(0, 0, cardW, CARD_H).setInteractive({ cursor: "pointer" });
      hit.on("pointerdown", () => { this.selected = i; this.startGame(); });
      hit.on("pointerover", () => {
        if (this.selected !== i) { this.selected = i; this.refreshHighlight(); }
      });
      container.add(hit);

      this.cardLayer.add(container);
      this.cards.push(container);
    });

    // Update nav UI
    this.leftArrowBtn.setVisible(this.page > 0);
    this.rightArrowBtn.setVisible(this.page < PAGES.length - 1);
    this.pageLabel.setText(PAGE_LABELS[this.page]);
    this.pageDots.setText(PAGES.map((_, i) => i === this.page ? "●" : "○").join("   "));

    this.refreshHighlight();
  }

  private flipPage(dir: number) {
    const next = this.page + dir;
    if (next < 0 || next >= PAGES.length) return;
    this.page     = next;
    this.selected = dir > 0 ? 0 : PAGES[this.page].length - 1;
    this.buildCards();
  }

  private makeCharArt(ch: CharDef, cardW: number): Phaser.GameObjects.Graphics {
    if (ch.key === "mario"   || ch.key === "luigi")   return this.makeMarioArt(ch, cardW);
    if (ch.key === "toad")    return this.makeToadArt(cardW);
    if (ch.key === "yoshi")   return this.makeYoshiArt(cardW);
    if (ch.key === "peach")   return this.makePeachArt(cardW);
    if (ch.key === "smg4")    return this.makeSmg4Art(cardW);
    if (ch.key === "smg3")    return this.makeSmg3Art(cardW);
    if (ch.key === "shroomy") return this.makeShroomyArt(cardW);
    if (ch.key === "bob")     return this.makeBobArt(cardW);
    if (ch.key === "bowser")  return this.makeBowserArt(cardW);
    if (ch.key === "meggy")   return this.makeMeggyArt(cardW);
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    g.fillStyle(ch.shirt); g.fillRect(-18*s, -20*s, 36*s, 22*s);
    g.fillStyle(ch.pants); g.fillRect(-18*s,   2*s, 36*s, 20*s);
    g.fillStyle(ch.skin);  g.fillRect(-10*s, -20*s, 20*s, 14*s);
    g.fillStyle(ch.cap);   g.fillRect(-14*s, -20*s, 28*s,  8*s);
    g.fillStyle(0x000000); g.fillRect(-6*s, -14*s, 4*s, 4*s); g.fillRect(2*s, -14*s, 4*s, 4*s);
    return g;
  }

  private makeMarioArt(ch: CharDef, cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    const isLuigi = ch.key === "luigi";
    const capCol = isLuigi ? 0x228822 : 0xdd2200;
    // Cap crown + brim
    g.fillStyle(capCol);
    g.fillRect(-14*s, -20*s, 28*s, 8*s);
    g.fillRect(-17*s, -14*s, 34*s, 4*s);
    // Face
    g.fillStyle(0xffcc88); g.fillRect(-11*s, -12*s, 22*s, 13*s);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-8*s, -8*s, 4*s, 4*s); g.fillRect(4*s, -8*s, 4*s, 4*s);
    // Mustache (two blocks)
    g.fillStyle(0x333333); g.fillRect(-11*s, -2*s, 9*s, 3*s); g.fillRect(2*s, -2*s, 9*s, 3*s);
    // Shirt
    g.fillStyle(capCol); g.fillRect(-11*s, 1*s, 22*s, 7*s);
    // Overall straps
    g.fillStyle(0x1133cc);
    g.fillRect(-15*s, 1*s, 6*s, 10*s);
    g.fillRect(  9*s, 1*s, 6*s, 10*s);
    g.fillRect(-18*s, 8*s, 36*s, 8*s);
    // Buttons
    g.fillStyle(0xffdd00); g.fillRect(-14*s, 2*s, 3*s, 3*s); g.fillRect(11*s, 2*s, 3*s, 3*s);
    // Boots
    g.fillStyle(0x6b3a1e); g.fillRect(-18*s, 16*s, 14*s, 6*s); g.fillRect(4*s, 16*s, 14*s, 6*s);
    return g;
  }

  private makeToadArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    // Large white mushroom cap
    g.fillStyle(0xffffff);
    g.fillCircle(0, -14*s, 17*s);
    // Red spots
    g.fillStyle(0xee2222);
    g.fillCircle(-9*s, -17*s, 5*s);
    g.fillCircle( 8*s, -19*s, 4*s);
    g.fillCircle( 1*s, -10*s, 3*s);
    // Face
    g.fillStyle(0xffeecc); g.fillRect(-8*s, -8*s, 16*s, 9*s);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-6*s, -6*s, 3*s, 3*s); g.fillRect(3*s, -6*s, 3*s, 3*s);
    // White outer body + blue vest
    g.fillStyle(0xeeeeee); g.fillRect(-14*s, 1*s, 7*s, 9*s); g.fillRect(7*s, 1*s, 7*s, 9*s);
    g.fillStyle(0x4444ff); g.fillRect(-7*s, 1*s, 14*s, 9*s);
    g.fillStyle(0xffdd44); g.fillRect(-7*s, 1*s, 14*s, 2*s);
    // Boots
    g.fillStyle(0x6b3a1e); g.fillRect(-12*s, 10*s, 11*s, 6*s); g.fillRect(1*s, 10*s, 11*s, 6*s);
    return g;
  }

  private makeYoshiArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    // Red saddle drawn FIRST — body covers the inner portion; left edge protrudes from lower back
    g.fillStyle(0xdd2222); g.fillCircle(-17*s, 4*s, 9*s);
    // Green body
    g.fillStyle(0x33bb33);
    g.fillCircle(0, -12*s, 14*s);
    g.fillRect(-14*s, 0, 28*s, 16*s);
    // White belly
    g.fillStyle(0xffffff); g.fillCircle(0, 6*s, 9*s);
    // Eye whites
    g.fillStyle(0xffffff);
    g.fillCircle(-8*s, -14*s, 5*s);
    g.fillCircle( 8*s, -14*s, 5*s);
    // Pupils
    g.fillStyle(0x000000);
    g.fillCircle(-7*s, -14*s, 2.5*s);
    g.fillCircle( 9*s, -14*s, 2.5*s);
    // Orange boots
    g.fillStyle(0xdd5511); g.fillRect(-16*s, 16*s, 14*s, 8*s); g.fillRect(2*s, 16*s, 14*s, 8*s);
    // Yellow soles
    g.fillStyle(0xffcc22); g.fillRect(-16*s, 21*s, 14*s, 3*s); g.fillRect(2*s, 21*s, 14*s, 3*s);
    return g;
  }

  private makePeachArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    // Crown
    g.fillStyle(0xffcc00);
    g.fillRect(-7*s, -23*s, 14*s, 4*s);
    g.fillRect(-9*s, -21*s, 3*s, 5*s);
    g.fillRect(-2*s, -24*s, 4*s, 6*s);
    g.fillRect( 6*s, -21*s, 3*s, 5*s);
    g.fillStyle(0x4488ff); g.fillRect(-1*s, -23*s, 3*s, 3*s);
    // Blonde hair
    g.fillStyle(0xffdd55); g.fillRect(-12*s, -19*s, 24*s, 8*s);
    g.fillRect(-15*s, -14*s, 6*s, 7*s); g.fillRect(9*s, -14*s, 6*s, 7*s);
    // Face
    g.fillStyle(0xffcc88); g.fillRect(-9*s, -15*s, 18*s, 12*s);
    // Eyes
    g.fillStyle(0x4488ff); g.fillRect(-7*s, -12*s, 3*s, 3*s); g.fillRect(4*s, -12*s, 3*s, 3*s);
    // Lips
    g.fillStyle(0xdd4466); g.fillRect(-4*s, -6*s, 8*s, 2*s);
    // Bodice
    g.fillStyle(0xff88bb); g.fillRect(-13*s, -3*s, 26*s, 7*s);
    g.fillStyle(0x4488ff); g.fillRect(-3*s, -2*s, 6*s, 5*s);
    g.fillStyle(0xffffff); g.fillRect(-13*s, 2*s, 26*s, 2*s);
    // Wide skirt
    g.fillStyle(0xff88bb); g.fillRect(-18*s, 4*s, 36*s, 18*s);
    return g;
  }

  private makeSmg4Art(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    // Blue cap
    g.fillStyle(0x2244cc); g.fillRect(-14*s, -20*s, 28*s, 8*s); g.fillRect(-17*s, -14*s, 34*s, 4*s);
    // S badge
    g.fillStyle(0xffffff); g.fillRect(-4*s, -19*s, 8*s, 6*s);
    g.fillStyle(0x4488ee);
    g.fillRect(-4*s,-19*s,8*s,2*s); g.fillRect(-4*s,-16*s,8*s,2*s); g.fillRect(-4*s,-13*s,8*s,2*s);
    g.fillRect(-4*s,-19*s,2*s,3*s); g.fillRect(2*s,-16*s,2*s,3*s);
    // Dark hair
    g.fillStyle(0x222200); g.fillRect(-12*s, -12*s, 24*s, 4*s);
    // Face
    g.fillStyle(0xffcc88); g.fillRect(-10*s, -10*s, 20*s, 13*s);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-8*s, -7*s, 3*s, 3*s); g.fillRect(5*s, -7*s, 3*s, 3*s);
    // Mustache
    g.fillStyle(0x333333); g.fillRect(-10*s, -1*s, 6*s, 2*s); g.fillRect(4*s, -1*s, 6*s, 2*s);
    // White overalls
    g.fillStyle(0xffffff); g.fillRect(-18*s, 3*s, 36*s, 14*s);
    // Blue shirt in gap
    g.fillStyle(0x2244cc); g.fillRect(-6*s, 3*s, 12*s, 6*s);
    // Straps + buttons
    g.fillStyle(0xdddddd); g.fillRect(-15*s, 3*s, 6*s, 8*s); g.fillRect(9*s, 3*s, 6*s, 8*s);
    g.fillStyle(0xffdd00); g.fillRect(-14*s, 4*s, 3*s, 3*s); g.fillRect(11*s, 4*s, 3*s, 3*s);
    // Boots
    g.fillStyle(0x6b3a1e); g.fillRect(-18*s, 17*s, 14*s, 6*s); g.fillRect(4*s, 17*s, 14*s, 6*s);
    return g;
  }

  private makeSmg3Art(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;
    // Purple cap
    g.fillStyle(0x8822cc); g.fillRect(-14*s, -20*s, 28*s, 8*s); g.fillRect(-17*s, -14*s, 34*s, 4*s);
    // Skull badge
    g.fillStyle(0xffffff); g.fillRect(-4*s, -19*s, 8*s, 6*s);
    g.fillStyle(0x8822cc);
    g.fillRect(-3*s,-18*s,2*s,2*s); g.fillRect(1*s,-18*s,2*s,2*s); g.fillRect(-4*s,-14*s,8*s,1*s);
    // Dark hair
    g.fillStyle(0x111100); g.fillRect(-12*s, -12*s, 24*s, 4*s);
    // Face
    g.fillStyle(0xffcc88); g.fillRect(-10*s, -10*s, 20*s, 13*s);
    // Red glowing eyes
    g.fillStyle(0xff2200); g.fillRect(-8*s, -7*s, 4*s, 3*s); g.fillRect(4*s, -7*s, 4*s, 3*s);
    g.fillStyle(0xff8866); g.fillRect(-7*s, -7*s, 2*s, 2*s); g.fillRect(5*s, -7*s, 2*s, 2*s);
    // Goatee
    g.fillStyle(0x222222); g.fillRect(-3*s, -1*s, 6*s, 3*s);
    // Purple outfit
    g.fillStyle(0x8822cc); g.fillRect(-14*s, 3*s, 28*s, 8*s);
    g.fillStyle(0x551199); g.fillRect(-18*s, 8*s, 36*s, 9*s);
    // Chest skull
    g.fillStyle(0xffffff); g.fillRect(-4*s, 4*s, 8*s, 6*s);
    g.fillStyle(0x8822cc);
    g.fillRect(-3*s, 5*s, 2*s, 2*s); g.fillRect(1*s, 5*s, 2*s, 2*s); g.fillRect(-4*s, 9*s, 8*s, 1*s);
    // Black boots
    g.fillStyle(0x111111); g.fillRect(-18*s, 17*s, 14*s, 6*s); g.fillRect(4*s, 17*s, 14*s, 6*s);
    return g;
  }

  private makeShroomyArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 2.8 : 2.5;

    // Green Robin Hood hat (pointed triangle)
    g.fillStyle(0x3d6b2e);
    g.fillTriangle(-6*s, -28*s,  0, -35*s,  6*s, -28*s);
    // Orange hat brim
    g.fillStyle(0xdd8822);
    g.fillRect(-9*s, -29*s, 18*s, 2.5*s);

    // Red mushroom cap (dominant — wide rounded rect)
    g.fillStyle(0xcc2020);
    g.fillRoundedRect(-18*s, -28*s, 36*s, 19*s, 7);

    // White spots on cap
    g.fillStyle(0xffffff);
    g.fillCircle(-10*s, -22*s, 3.5*s);
    g.fillCircle(  6*s, -25*s, 2.5*s);
    g.fillCircle( 14*s, -20*s,   2*s);

    // Eyes on cap face
    g.fillStyle(0x111111);
    g.fillCircle(-4*s, -16*s, 1.6*s);
    g.fillCircle( 4*s, -16*s, 1.6*s);

    // Toothy grin (white bar + gap)
    g.fillStyle(0xdddddd);
    g.fillRect(-4.5*s, -14*s, 9*s, 3*s);
    g.fillStyle(0x111111);
    g.fillRect(-0.5*s, -14*s, 1*s, 3*s);

    // Beige stem body
    g.fillStyle(0xc49060);
    g.fillRoundedRect(-4*s, -9*s, 8*s, 13*s, 2);

    // Orange scout sash
    g.fillStyle(0xdd7722);
    g.fillRect(-8*s, -6*s, 16*s, 4*s);

    // Sash badge dots
    const badges: number[] = [0xff4444, 0x4466ff, 0x44cc44, 0xeeee22];
    badges.forEach((col, i) => {
      g.fillStyle(col);
      g.fillCircle((-5 + i * 3.4) * s, -4*s, 1.4*s);
    });

    // Thin stick legs
    g.fillStyle(0xc49060);
    g.fillRect(-4*s, 4*s, 2*s, 9*s);
    g.fillRect( 2*s, 4*s, 2*s, 9*s);

    // Brown boots
    g.fillStyle(0x6b3a1e);
    g.fillRect(-6*s, 10*s, 6*s, 4*s);
    g.fillRect(    0, 10*s, 6*s, 4*s);

    return g;
  }

  private makeBobArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 2.8 : 2.5;

    // Dark brown hood (large oval + pointed peak)
    g.fillStyle(0x1a0e06);
    g.fillCircle(0, -18*s, 14*s);
    g.fillTriangle(-5*s, -28*s,  0, -35*s,  5*s, -28*s);

    // Glowing green eyes
    g.fillStyle(0x22ee22);
    g.fillRect(-8*s, -22*s, 5*s, 5*s);
    g.fillRect( 3*s, -22*s, 5*s, 5*s);
    g.fillStyle(0x88ff88);
    g.fillRect(-7*s, -21*s, 2*s, 2*s);
    g.fillRect( 4*s, -21*s, 2*s, 2*s);

    // Red scarf with yellow diamond pattern
    g.fillStyle(0xcc3311);
    g.fillRect(-10*s, -10*s, 20*s, 5*s);
    g.fillStyle(0xffaa22);
    for (let i = 0; i < 4; i++) {
      g.fillRect((-8 + i*5)*s, -9*s, 2.5*s, 2*s);
      g.fillRect((-5.5 + i*5)*s, -7*s, 2.5*s, 2*s);
    }

    // Brown cloak (trapezoid = two triangles)
    g.fillStyle(0x5c3d1e);
    g.fillTriangle(-12*s, -7*s,  12*s, -7*s,  18*s, 14*s);
    g.fillTriangle(-12*s, -7*s, -18*s, 14*s,  18*s, 14*s);
    g.fillRect(-18*s, 12*s, 36*s, 3*s);

    // X stitches on cloak
    g.lineStyle(1.5, 0x8a6040);
    g.lineBetween(-5*s, -2*s, -1*s,  4*s);
    g.lineBetween(-1*s, -2*s, -5*s,  4*s);
    g.lineBetween( 2*s, -2*s,  6*s,  4*s);
    g.lineBetween( 6*s, -2*s,  2*s,  4*s);

    // Blade shapes at sides (grey)
    g.fillStyle(0xbbbbbb);
    g.fillTriangle(-18*s, -1*s, -23*s, -11*s, -15*s,  1*s);
    g.fillTriangle( 18*s, -1*s,  23*s, -11*s,  15*s,  1*s);
    // Blade edge highlight
    g.fillStyle(0xeeeeee);
    g.fillRect(-21.5*s, -9*s, 1*s, 6*s);
    g.fillRect( 20.5*s, -9*s, 1*s, 6*s);

    // Grey wrapped legs
    g.fillStyle(0xcccccc);
    g.fillRect(-14*s, 14*s, 8*s, 6*s);
    g.fillRect(  6*s, 14*s, 8*s, 6*s);
    // Wrap lines
    g.lineStyle(1, 0xaaaaaa);
    g.lineBetween(-14*s, 17*s, -6*s, 17*s);
    g.lineBetween(  6*s, 17*s, 14*s, 17*s);

    return g;
  }

  private makeBowserArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Red spiky hair (3 triangles)
    g.fillStyle(0xcc1100);
    g.fillTriangle(-9*s,-27*s, -6*s,-34*s, -3*s,-27*s);
    g.fillTriangle(-2*s,-28*s,  1*s,-35*s,  4*s,-28*s);
    g.fillTriangle( 4*s,-27*s,  7*s,-33*s, 10*s,-27*s);

    // Green scaly head
    g.fillStyle(0x2a7a2a); g.fillRoundedRect(-13*s,-27*s,26*s,14*s,3);
    // Scale dots
    g.fillStyle(0x1a5a1a);
    g.fillCircle(-7*s,-24*s,2*s); g.fillCircle(0,-24*s,2*s); g.fillCircle(7*s,-24*s,2*s);
    g.fillCircle(-4*s,-20*s,2*s); g.fillCircle(4*s,-20*s,2*s);
    // Eyes: white + red + black
    g.fillStyle(0xffffff); g.fillRect(-12*s,-26*s,5*s,5*s); g.fillRect(7*s,-26*s,5*s,5*s);
    g.fillStyle(0xff2200); g.fillRect(-11*s,-25*s,4*s,4*s); g.fillRect(8*s,-25*s,4*s,4*s);
    g.fillStyle(0x000000); g.fillRect(-10*s,-24*s,2*s,2*s); g.fillRect(9*s,-24*s,2*s,2*s);
    // Cream jaw
    g.fillStyle(0xccaa44); g.fillRect(-11*s,-16*s,22*s,5*s);
    // Upper fangs
    g.fillStyle(0xffffff);
    g.fillRect(-10*s,-18*s,3*s,4*s); g.fillRect(-5*s,-18*s,3*s,4*s);
    g.fillRect(  2*s,-18*s,3*s,4*s); g.fillRect( 7*s,-18*s,3*s,4*s);

    // Black spiked collar + studs
    g.fillStyle(0x222222); g.fillRect(-18*s,-11*s,36*s,6*s);
    g.fillStyle(0x999999);
    ([-14,-7,0,7,14] as number[]).forEach(x => g.fillRect(x*s,-10*s,3*s,4*s));

    // Yellow massive body
    g.fillStyle(0xddaa00); g.fillRect(-18*s,-5*s,36*s,17*s);
    // Cream belly stripes
    g.fillStyle(0xffcc88);
    g.fillRect(-9*s,-3*s,18*s,3*s); g.fillRect(-9*s,1*s,18*s,3*s); g.fillRect(-9*s,5*s,18*s,3*s);
    // Green shell peek (left side — back when facing right)
    g.fillStyle(0x2a7a2a); g.fillRect(-20*s,-5*s,11*s,17*s);
    g.fillStyle(0xffeeaa); // shell spines
    g.fillRect(-18*s,-4*s,4*s,4*s); g.fillRect(-18*s,1*s,4*s,4*s); g.fillRect(-18*s,7*s,4*s,4*s);

    // Yellow legs
    g.fillStyle(0xddaa00);
    g.fillRect(-18*s,12*s,14*s,10*s); g.fillRect(4*s,12*s,14*s,10*s);
    // White claws (3 per foot)
    g.fillStyle(0xffffff);
    ([-17,-12,-7] as number[]).forEach(x => g.fillRect(x*s,19*s,4*s,4*s));
    ([5,10,15] as number[]).forEach(x => g.fillRect(x*s,19*s,4*s,4*s));

    return g;
  }

  private makeMeggyArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Orange tentacle hair (wide at top, flows down sides)
    g.fillStyle(0xff8800);
    g.fillRect(-13*s,-24*s,26*s,8*s);
    g.fillRect(-17*s,-22*s,7*s,9*s); g.fillRect(10*s,-22*s,7*s,9*s);

    // Red cap
    g.fillStyle(0xcc2200); g.fillRect(-9*s,-27*s,18*s,6*s);

    // Black headphone band + ear cups
    g.fillStyle(0x111111);
    g.fillRect(-17*s,-25*s,34*s,4*s);
    g.fillRect(-17*s,-26*s,5*s,8*s); g.fillRect(12*s,-26*s,5*s,8*s);

    // Skin face
    g.fillStyle(0xffccaa); g.fillRect(-9*s,-19*s,18*s,11*s);

    // Eyes: white + orange + black
    g.fillStyle(0xffffff); g.fillRect(-8*s,-17*s,5*s,5*s); g.fillRect(3*s,-17*s,5*s,5*s);
    g.fillStyle(0xff6600); g.fillRect(-7*s,-16*s,3*s,4*s); g.fillRect(4*s,-16*s,3*s,4*s);
    g.fillStyle(0x000000); g.fillRect(-7*s,-15*s,2*s,2*s); g.fillRect(4*s,-15*s,2*s,2*s);

    // Smile
    g.fillStyle(0xcc7766); g.fillRect(-2*s,-10*s,4*s,2*s);

    // White t-shirt
    g.fillStyle(0xffffff); g.fillRect(-14*s,-8*s,28*s,12*s);
    // Shirt logo (dark square + red band)
    g.fillStyle(0x222222); g.fillRect(-7*s,-6*s,14*s,8*s);
    g.fillStyle(0xcc2200); g.fillRect(-6*s,-5*s,12*s,4*s);

    // Dark grey shorts
    g.fillStyle(0x333344); g.fillRect(-14*s,4*s,28*s,10*s);

    // Brown boots
    g.fillStyle(0x7b4a2e);
    g.fillRect(-14*s,14*s,12*s,9*s); g.fillRect(2*s,14*s,12*s,9*s);
    // Boot tops (darker)
    g.fillStyle(0x5a3520);
    g.fillRect(-14*s,14*s,12*s,3*s); g.fillRect(2*s,14*s,12*s,3*s);
    // Lace highlights
    g.fillStyle(0xffeecc);
    g.fillRect(-12*s,16*s,3*s,2*s); g.fillRect(-7*s,16*s,3*s,2*s);
    g.fillRect(  4*s,16*s,3*s,2*s); g.fillRect( 9*s,16*s,3*s,2*s);

    return g;
  }

  private refreshHighlight() {
    const { cardW } = this.cardDims(PAGES[this.page].length);

    this.cards.forEach((card, i) => {
      const isSelected = i === this.selected;
      const oldBorder = card.getByName("border") as Phaser.GameObjects.Graphics | null;
      if (oldBorder) oldBorder.destroy();

      const border = this.add.graphics();
      border.setName("border");

      if (isSelected) {
        border.lineStyle(4, 0xffdd00, 1);
        border.strokeRoundedRect(-cardW / 2, -CARD_H / 2, cardW, CARD_H, 12);
        card.setScale(1.06);
      } else {
        border.lineStyle(2, 0x554477, 1);
        border.strokeRoundedRect(-cardW / 2, -CARD_H / 2, cardW, CARD_H, 12);
        card.setScale(1.0);
      }
      card.addAt(border, 1);
    });
  }

  private startGame() {
    if (this.starting) return;
    this.starting = true;
    const key = PAGES[this.page][this.selected].key;
    this.scene.start("GameScene", { character: key });
  }
}
