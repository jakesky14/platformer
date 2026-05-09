import Phaser from "phaser";

type CharDef = { key: string; name: string; cap: number; shirt: number; pants: number; skin: number };

const PAGE1: CharDef[] = [
  { key: "mario",    name: "Mario",    cap: 0xdd2200, shirt: 0xdd2200, pants: 0x1133cc, skin: 0xffcc88 },
  { key: "luigi",    name: "Luigi",    cap: 0x228822, shirt: 0x228822, pants: 0x1133cc, skin: 0xffcc88 },
  { key: "peach",    name: "Peach",    cap: 0xff88bb, shirt: 0xffddee, pants: 0xff88bb, skin: 0xffcc88 },
  { key: "yoshi",    name: "Yoshi",    cap: 0xff4444, shirt: 0x44cc44, pants: 0x44cc44, skin: 0xffffff },
  { key: "toad",     name: "Toad",     cap: 0xff4444, shirt: 0xffffff, pants: 0x4444ff, skin: 0xffeecc },
];

const PAGE2: CharDef[] = [
  { key: "toadette",  name: "Toadette",   cap: 0xff88cc, shirt: 0xffffff, pants: 0xff44aa, skin: 0xffeecc },
  { key: "bowser",    name: "Bowser",     cap: 0x2a7a2a, shirt: 0xddaa00, pants: 0xddaa00, skin: 0xccaa44 },
  { key: "bowserjr",  name: "Bowser Jr.", cap: 0x2a7a2a, shirt: 0x2a7a2a, pants: 0xddaa00, skin: 0xddcc44 },
  { key: "wario",     name: "Wario",      cap: 0xeecc00, shirt: 0xeecc00, pants: 0x882288, skin: 0xffcc88 },
  { key: "waluigi",   name: "Waluigi",    cap: 0x772288, shirt: 0x3311aa, pants: 0x222244, skin: 0xffcc88 },
];

const PAGE3: CharDef[] = [
  { key: "smg4",     name: "SMG4",     cap: 0x2244cc, shirt: 0x2244cc, pants: 0x112299, skin: 0xffcc88 },
  { key: "smg3",     name: "SMG3",     cap: 0x8822cc, shirt: 0x8822cc, pants: 0x551199, skin: 0xffcc88 },
  { key: "meggy",    name: "Meggy",    cap: 0xcc2200, shirt: 0xffffff, pants: 0x333344, skin: 0xffccaa },
  { key: "bob",      name: "Bob",      cap: 0x222222, shirt: 0x333333, pants: 0x111111, skin: 0x99bb77 },
  { key: "boopkins", name: "Boopkins", cap: 0x3399cc, shirt: 0x55bb55, pants: 0x55bb55, skin: 0x88ee88 },
];

const PAGE4: CharDef[] = [
  { key: "tari",      name: "Tari",        cap: 0x4488ff, shirt: 0x4488ff, pants: 0xccbb88, skin: 0xffcc88 },
  { key: "saiko",     name: "Saiko",       cap: 0xff88cc, shirt: 0xcc9966, pants: 0xcc2233, skin: 0xffddaa },
  { key: "melony",    name: "Melony",      cap: 0x33bb55, shirt: 0x222222, pants: 0x222222, skin: 0xeeccaa },
  { key: "mrpuzzles", name: "Mr. Puzzles", cap: 0x888888, shirt: 0xffffff, pants: 0x111111, skin: 0xbbbbbb },
  { key: "mrwpnz",    name: "Mr. WPNZ",    cap: 0x1a1a2a, shirt: 0x1a1a2a, pants: 0x222233, skin: 0x334455 },
];

const PAGES = [PAGE1, PAGE2, PAGE3, PAGE4];
const PAGE_LABELS = ["Classic", "Classic II", "SMG4 Universe", "SMG4 Universe II"];


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
    if (ch.key === "toad")      return this.makeToadArt(cardW);
    if (ch.key === "yoshi")     return this.makeYoshiArt(cardW);
    if (ch.key === "peach")     return this.makePeachArt(cardW);
    if (ch.key === "toadette")  return this.makeToadetteArt(cardW);
    if (ch.key === "bowser")    return this.makeBowserArt(cardW);
    if (ch.key === "bowserjr")  return this.makeBowserJrArt(cardW);
    if (ch.key === "wario")     return this.makeWarioArt(cardW);
    if (ch.key === "waluigi")   return this.makeWaluigiArt(cardW);
    if (ch.key === "smg4")      return this.makeSmg4Art(cardW);
    if (ch.key === "smg3")      return this.makeSmg3Art(cardW);
    if (ch.key === "meggy")     return this.makeMeggyArt(cardW);
    if (ch.key === "bob")       return this.makeBobArt(cardW);
    if (ch.key === "boopkins")  return this.makeBoopkinsArt(cardW);
    if (ch.key === "tari")      return this.makeTariArt(cardW);
    if (ch.key === "saiko")     return this.makeSaikoArt(cardW);
    if (ch.key === "melony")    return this.makeMelonyArt(cardW);
    if (ch.key === "mrpuzzles") return this.makeMrPuzzlesArt(cardW);
    if (ch.key === "mrwpnz")    return this.makeMrWpnzArt(cardW);
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
    // Dark nostril dots on green snout area
    g.fillStyle(0x222222); g.fillCircle(-1.5*s, -9*s, 1*s); g.fillCircle(1.5*s, -9*s, 1*s);
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

  private makeToadetteArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Pink pigtail pom-poms (drawn before cap so they frame it)
    g.fillStyle(0xff88cc);
    g.fillCircle(-15*s, -12*s, 6*s);
    g.fillCircle( 15*s, -12*s, 6*s);

    // Large pink mushroom cap
    g.fillStyle(0xff88cc);
    g.fillCircle(0, -17*s, 15*s);
    // White spots on cap
    g.fillStyle(0xffffff);
    g.fillCircle(-8*s, -20*s, 4.5*s);
    g.fillCircle( 7*s, -22*s, 3.5*s);
    g.fillCircle( 1*s, -13*s, 2.5*s);

    // Face (cream)
    g.fillStyle(0xffeecc); g.fillRect(-8*s, -8*s, 16*s, 10*s);
    // Pink cheeks
    g.fillStyle(0xff99bb);
    g.fillCircle(-6*s, -3*s, 2.5*s); g.fillCircle(6*s, -3*s, 2.5*s);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-6*s, -6*s, 3*s, 3*s); g.fillRect(3*s, -6*s, 3*s, 3*s);
    // Pink nose
    g.fillStyle(0xff88bb); g.fillCircle(0, -2*s, 1.5*s);

    // White body
    g.fillStyle(0xffffff); g.fillRect(-11*s, 2*s, 22*s, 9*s);
    // Pink vest trim
    g.fillStyle(0xff88cc);
    g.fillRect(-11*s, 2*s, 4*s, 9*s); g.fillRect(7*s, 2*s, 4*s, 9*s);
    g.fillRect(-7*s, 2*s, 14*s, 2*s);

    // Pink skirt
    g.fillStyle(0xff44aa); g.fillRect(-13*s, 11*s, 26*s, 10*s);

    // Brown boots
    g.fillStyle(0x6b3a1e); g.fillRect(-11*s, 21*s, 9*s, 6*s); g.fillRect(2*s, 21*s, 9*s, 6*s);

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
    const s = cardW >= 200 ? 4.0 : 3.5;

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

  private makeBowserJrArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // 3 red hair spikes (directly above head)
    g.fillStyle(0xcc1100);
    g.fillTriangle(-8*s, -13*s, -5*s, -20*s, -2*s, -13*s);
    g.fillTriangle(-1*s, -14*s,  2*s, -21*s,  5*s, -14*s);
    g.fillTriangle( 5*s, -13*s,  8*s, -20*s, 11*s, -13*s);

    // Green scaly head (bottom of head meets top of body at y=2*s)
    g.fillStyle(0x2a7a2a); g.fillRoundedRect(-12*s, -13*s, 22*s, 15*s, 3);
    // Scale dots
    g.fillStyle(0x1a5a1a);
    g.fillCircle(-6*s, -9*s, 1.5*s); g.fillCircle(0, -9*s, 1.5*s); g.fillCircle(5*s, -9*s, 1.5*s);

    // Eyes: white + yellow + black pupil (angry)
    g.fillStyle(0xffffff); g.fillRect(-11*s, -12*s, 4*s, 4*s); g.fillRect(5*s, -12*s, 4*s, 4*s);
    g.fillStyle(0xddcc00); g.fillRect(-10*s, -11*s, 3*s, 3*s); g.fillRect(6*s, -11*s, 3*s, 3*s);
    g.fillStyle(0x000000); g.fillRect(-9*s,  -10*s, 2*s, 2*s); g.fillRect(7*s,  -10*s, 2*s, 2*s);
    // Angry brow lines
    g.fillStyle(0x000000);
    g.fillRect(-11*s, -13*s, 5*s, 2*s); g.fillRect(5*s, -13*s, 5*s, 2*s);

    // Cream jaw + fangs at chin
    g.fillStyle(0xccaa44); g.fillRect(-10*s, -3*s, 18*s, 4*s);
    g.fillStyle(0xffffff);
    g.fillRect(-9*s, -5*s, 2.5*s, 4*s); g.fillRect(-4*s, -5*s, 2.5*s, 4*s);
    g.fillRect( 2*s, -5*s, 2.5*s, 4*s); g.fillRect( 7*s, -5*s, 2.5*s, 4*s);

    // Green body
    g.fillStyle(0x2a7a2a); g.fillRect(-11*s, 2*s, 20*s, 12*s);

    // White bib on body
    g.fillStyle(0xffffff); g.fillRoundedRect(-9*s, 4*s, 16*s, 12*s, 3);
    // Bib mouth — big red lips + three white teeth (no eyes)
    g.fillStyle(0xcc1100); g.fillRect(-8*s, 8*s, 15*s, 6*s);
    g.fillStyle(0xffffff);
    g.fillRect(-7*s, 8*s, 3.5*s, 3.5*s);
    g.fillRect(-2*s, 8*s, 3.5*s, 3.5*s);
    g.fillRect( 3*s, 8*s, 3.5*s, 3.5*s);

    // Yellow shell peek (left/back)
    g.fillStyle(0xddaa00); g.fillRect(-16*s, 2*s, 7*s, 12*s);
    g.fillStyle(0xffeeaa);
    g.fillRect(-15*s, 3*s, 3*s, 3*s); g.fillRect(-15*s, 7*s, 3*s, 3*s); g.fillRect(-15*s, 11*s, 3*s, 3*s);

    // Short green legs
    g.fillStyle(0x2a7a2a); g.fillRect(-10*s, 14*s, 8*s, 8*s); g.fillRect(2*s, 14*s, 8*s, 8*s);
    // White claws
    g.fillStyle(0xffffff);
    g.fillRect(-10*s, 20*s, 2.5*s, 3*s); g.fillRect(-6*s, 20*s, 2.5*s, 3*s);
    g.fillRect(  2*s, 20*s, 2.5*s, 3*s); g.fillRect(  6*s, 20*s, 2.5*s, 3*s);

    return g;
  }

  private makeWarioArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Yellow W-cap
    g.fillStyle(0xeecc00); g.fillRect(-14*s, -20*s, 28*s, 8*s); g.fillRect(-17*s, -14*s, 34*s, 4*s);
    // Purple W badge
    g.fillStyle(0x772288); g.fillRect(-5*s, -19*s, 10*s, 6*s);
    g.fillStyle(0xeecc00); // W letter cutout
    g.fillRect(-4*s, -18*s, 2*s, 3*s); g.fillRect(2*s, -18*s, 2*s, 3*s);
    g.fillRect(-1.5*s, -16*s, 3*s, 2*s);

    // Wide fat face (larger than Mario's)
    g.fillStyle(0xffcc88); g.fillRect(-14*s, -12*s, 28*s, 14*s);
    // Big round orange nose
    g.fillStyle(0xff8844); g.fillCircle(0, -5*s, 5*s);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-10*s, -10*s, 4*s, 4*s); g.fillRect(6*s, -10*s, 4*s, 4*s);
    // Thick dark mustache
    g.fillStyle(0x222222);
    g.fillRect(-13*s, -1*s, 11*s, 4*s); g.fillRect(2*s, -1*s, 11*s, 4*s);
    // Angry brows
    g.fillRect(-12*s, -13*s, 8*s, 3*s); g.fillRect(4*s, -13*s, 8*s, 3*s);

    // Yellow shirt (wide)
    g.fillStyle(0xeecc00); g.fillRect(-14*s, 2*s, 28*s, 8*s);

    // Purple overalls (very wide)
    g.fillStyle(0x882288);
    g.fillRect(-18*s, 8*s, 36*s, 12*s);
    g.fillRect(-16*s, 2*s, 7*s, 9*s); g.fillRect(9*s, 2*s, 7*s, 9*s);
    // Overall buttons
    g.fillStyle(0xffdd00); g.fillRect(-14*s, 3*s, 3*s, 3*s); g.fillRect(11*s, 3*s, 3*s, 3*s);

    // Round white gloves
    g.fillStyle(0xeeeeee); g.fillCircle(-21*s, 6*s, 6*s); g.fillCircle(21*s, 6*s, 6*s);

    // Short dark green boots
    g.fillStyle(0x224422); g.fillRect(-18*s, 20*s, 15*s, 7*s); g.fillRect(3*s, 20*s, 15*s, 7*s);

    return g;
  }

  private makeWaluigiArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Purple cap with Γ badge
    g.fillStyle(0x772288); g.fillRect(-14*s, -20*s, 28*s, 8*s); g.fillRect(-17*s, -14*s, 34*s, 4*s);
    // Γ badge (inverted L / upside-down L)
    g.fillStyle(0xffffff); g.fillRect(-4*s, -19*s, 8*s, 6*s);
    g.fillStyle(0x772288);
    g.fillRect(-3*s, -18*s, 6*s, 2*s); // top bar
    g.fillRect(-3*s, -16*s, 3*s, 4*s); // left vertical

    // Tall thin face
    g.fillStyle(0xffcc88); g.fillRect(-9*s, -12*s, 18*s, 15*s);
    // Long pointy nose (triangle shape)
    g.fillStyle(0xffaa66); g.fillTriangle(-3*s, -6*s, 3*s, -6*s, 0, 0);
    // Eyes
    g.fillStyle(0x000000); g.fillRect(-7*s, -10*s, 3*s, 3*s); g.fillRect(4*s, -10*s, 3*s, 3*s);
    // Thin upward mustache
    g.fillStyle(0x222222);
    g.fillRect(-8*s, -3*s, 6*s, 2*s); g.fillRect(2*s, -3*s, 6*s, 2*s);
    g.fillRect(-9*s, -5*s, 3*s, 3*s); g.fillRect(6*s, -5*s, 3*s, 3*s);

    // Blue shirt
    g.fillStyle(0x3311aa); g.fillRect(-11*s, 3*s, 22*s, 7*s);

    // Dark purple overalls
    g.fillStyle(0x442266);
    g.fillRect(-15*s, 8*s, 30*s, 12*s);
    g.fillRect(-13*s, 3*s, 6*s, 8*s); g.fillRect(7*s, 3*s, 6*s, 8*s);
    // Buttons
    g.fillStyle(0x9944cc); g.fillRect(-11*s, 4*s, 3*s, 3*s); g.fillRect(8*s, 4*s, 3*s, 3*s);

    // White gloves
    g.fillStyle(0xeeeeee); g.fillCircle(-18*s, 7*s, 4.5*s); g.fillCircle(18*s, 7*s, 4.5*s);

    // Long orange shoes (extend past body width)
    g.fillStyle(0xdd6600); g.fillRect(-18*s, 20*s, 16*s, 6*s); g.fillRect(2*s, 20*s, 20*s, 6*s);

    return g;
  }

  private makeTariArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Ahoge drawn first — hair covers its base so only the curl tip sticks up
    g.fillStyle(0x4488ff);
    g.fillRect(-5*s, -27*s, 3*s, 7*s);
    g.fillCircle(-5*s, -28*s, 3.5*s);

    // Blue layered hair (covers ahoge base)
    g.fillStyle(0x3366dd);
    g.fillRect(-14*s, -23*s, 28*s, 7*s);
    g.fillRect(-16*s, -18*s, 7*s, 18*s);
    g.fillRect( 9*s, -18*s, 7*s, 18*s);

    // Face
    g.fillStyle(0xffcc88); g.fillRect(-9*s, -20*s, 18*s, 15*s);

    // Purple eyes
    g.fillStyle(0x7744bb); g.fillRect(-7*s, -15*s, 4*s, 4*s); g.fillRect(3*s, -15*s, 4*s, 4*s);
    g.fillStyle(0x000000); g.fillRect(-6*s, -15*s, 2*s, 2*s); g.fillRect(4*s, -15*s, 2*s, 2*s);

    // Rosy cheeks
    g.fillStyle(0xffaaaa);
    g.fillCircle(-7*s, -10*s, 2.5*s); g.fillCircle(7*s, -10*s, 2.5*s);

    // Blue hoodie
    g.fillStyle(0x4488ff); g.fillRect(-13*s, -5*s, 26*s, 14*s);
    // White collar
    g.fillStyle(0xffffff); g.fillRect(-4*s, -5*s, 8*s, 5*s);
    // Dark cuff trim
    g.fillStyle(0x2255aa); g.fillRect(-13*s, 6*s, 4*s, 3*s); g.fillRect(9*s, 6*s, 4*s, 3*s);

    // Khaki cargo pants
    g.fillStyle(0xccbb88); g.fillRect(-13*s, 9*s, 26*s, 13*s);
    g.fillStyle(0xbbaa77); g.fillRect(-12*s, 12*s, 6*s, 5*s); g.fillRect(6*s, 12*s, 6*s, 5*s);

    // Teal sandals
    g.fillStyle(0x44aacc); g.fillRect(-13*s, 22*s, 11*s, 5*s); g.fillRect(2*s, 22*s, 11*s, 5*s);
    g.fillStyle(0x2288aa); g.fillRect(-11*s, 20*s, 7*s, 3*s); g.fillRect(4*s, 20*s, 7*s, 3*s);

    return g;
  }

  private makeSaikoArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Pink twintails (side sections hang down)
    g.fillStyle(0xff88cc);
    g.fillRect(-14*s, -24*s, 28*s, 6*s);   // top hair
    g.fillRect(-17*s, -20*s, 7*s, 22*s);    // left twintail
    g.fillRect( 10*s, -20*s, 7*s, 22*s);    // right twintail
    // Blonde tips at bottom of twintails
    g.fillStyle(0xffdd55);
    g.fillRect(-17*s, -1*s, 7*s, 3*s); g.fillRect(10*s, -1*s, 7*s, 3*s);
    // Red bows
    g.fillStyle(0xcc2233);
    g.fillRect(-18*s, -21*s, 5*s, 3*s); g.fillRect(-16*s, -23*s, 2*s, 6*s);
    g.fillRect( 13*s, -21*s, 5*s, 3*s); g.fillRect( 14*s, -23*s, 2*s, 6*s);

    // Face (tan skin)
    g.fillStyle(0xffddaa); g.fillRect(-9*s, -20*s, 18*s, 14*s);

    // Purple eyes
    g.fillStyle(0x7744bb); g.fillRect(-7*s, -16*s, 4*s, 5*s); g.fillRect(3*s, -16*s, 4*s, 5*s);
    g.fillStyle(0xffffff); g.fillRect(-6*s, -16*s, 2*s, 2*s); g.fillRect(4*s, -16*s, 2*s, 2*s);

    // Slight smile
    g.fillStyle(0xcc8866); g.fillRect(-3*s, -9*s, 6*s, 2*s);

    // Tan bomber jacket
    g.fillStyle(0xcc9966); g.fillRect(-13*s, -6*s, 26*s, 13*s);
    // V-collar (skin gap)
    g.fillStyle(0xffddaa); g.fillRect(-3*s, -6*s, 6*s, 5*s);
    // Zipper
    g.fillStyle(0xaaaaaa); g.fillRect(-1*s, -6*s, 2*s, 11*s);
    // Pocket detail
    g.fillStyle(0xbb8855); g.fillRect(-12*s, -4*s, 5*s, 4*s); g.fillRect(7*s, -4*s, 5*s, 4*s);

    // Red mini skirt
    g.fillStyle(0xcc2233); g.fillRect(-13*s, 7*s, 26*s, 10*s);

    // Black knee-high socks with white cuff
    g.fillStyle(0x111111); g.fillRect(-12*s, 17*s, 10*s, 9*s); g.fillRect(2*s, 17*s, 10*s, 9*s);
    g.fillStyle(0xffffff); g.fillRect(-12*s, 17*s, 10*s, 2*s); g.fillRect(2*s, 17*s, 10*s, 2*s);

    // Grey shoes
    g.fillStyle(0x888899); g.fillRect(-13*s, 26*s, 11*s, 5*s); g.fillRect(2*s, 26*s, 11*s, 5*s);

    return g;
  }

  private makeBoopkinsArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 2.8 : 2.5;

    // Blue mohawk spike
    g.fillStyle(0x3399cc);
    g.fillTriangle(-3*s, -24*s, 0, -31*s, 3*s, -24*s);

    // Round green body
    g.fillStyle(0x55bb55); g.fillCircle(0, -6*s, 18*s);
    // Light green belly
    g.fillStyle(0x88ee88); g.fillCircle(0, -2*s, 11*s);

    // Huge white eyes (defining feature)
    g.fillStyle(0xffffff);
    g.fillCircle(-9*s, -14*s, 7*s);
    g.fillCircle( 9*s, -14*s, 7*s);
    // Black pupils
    g.fillStyle(0x000000);
    g.fillCircle(-9*s, -14*s, 4*s);
    g.fillCircle( 9*s, -14*s, 4*s);
    // Eye shine
    g.fillStyle(0xffffff);
    g.fillCircle(-7*s, -16*s, 1.5*s); g.fillCircle(11*s, -16*s, 1.5*s);

    // Wide open red mouth
    g.fillStyle(0xcc1111); g.fillRoundedRect(-9*s, -5*s, 18*s, 8*s, 3);
    // Teeth
    g.fillStyle(0xffffff);
    g.fillRect(-8*s, -5*s, 4*s, 3*s); g.fillRect(-2*s, -5*s, 4*s, 3*s); g.fillRect(4*s, -5*s, 4*s, 3*s);

    // Stubby fin arms at sides
    g.fillStyle(0x44aa44);
    g.fillTriangle(-21*s, -8*s, -16*s, -17*s, -16*s, 0);
    g.fillTriangle( 21*s, -8*s,  16*s, -17*s,  16*s, 0);

    // Small dark shoes at bottom
    g.fillStyle(0x333333);
    g.fillRect(-10*s, 11*s, 8*s, 5*s); g.fillRect(2*s, 11*s, 8*s, 5*s);

    return g;
  }

  private makeMelonyArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Long green hair drawn first — body covers center; sides flow down past dress
    g.fillStyle(0x33bb55);
    g.fillRect(-14*s, -25*s, 28*s, 8*s);    // top hair
    g.fillRect(-17*s, -21*s, 8*s, 36*s);    // left flowing hair
    g.fillRect(  9*s, -21*s, 8*s, 36*s);    // right flowing hair

    // Face (pale skin)
    g.fillStyle(0xeeccaa); g.fillRect(-9*s, -23*s, 18*s, 17*s);

    // Red eyes
    g.fillStyle(0xcc2222); g.fillRect(-7*s, -19*s, 4*s, 4*s); g.fillRect(3*s, -19*s, 4*s, 4*s);
    g.fillStyle(0xffffff); g.fillRect(-7*s, -19*s, 2*s, 2*s); g.fillRect(3*s, -19*s, 2*s, 2*s);

    // Dark whisker face markings
    g.fillStyle(0x442222);
    g.fillRect(-9*s, -14*s, 4*s, 1.5*s); g.fillRect(-9*s, -12*s, 4*s, 1.5*s);
    g.fillRect( 5*s, -14*s, 4*s, 1.5*s); g.fillRect( 5*s, -12*s, 4*s, 1.5*s);

    // Black hoodie dress body
    g.fillStyle(0x222222); g.fillRect(-13*s, -6*s, 26*s, 27*s);
    // White collar/hood opening
    g.fillStyle(0xffffff); g.fillRect(-4*s, -6*s, 8*s, 4*s);

    // Watermelon design mid-dress
    // Green rind stripe (thin, top of red section)
    g.fillStyle(0x44dd44); g.fillRect(-11*s, 1*s, 22*s, 3*s);
    // Red flesh section
    g.fillStyle(0xdd2233); g.fillRect(-11*s, 4*s, 22*s, 11*s);
    // Black seed drops
    g.fillStyle(0x000000);
    g.fillCircle(-5*s, 8*s, 2*s); g.fillCircle( 0, 8*s, 2*s); g.fillCircle(5*s, 8*s, 2*s);
    g.fillCircle(-2.5*s, 13*s, 2*s); g.fillCircle(2.5*s, 13*s, 2*s);

    // Green hem trim at bottom of dress
    g.fillStyle(0x44bb44); g.fillRect(-13*s, 21*s, 26*s, 3*s);

    // Dark boots
    g.fillStyle(0x333333); g.fillRect(-13*s, 24*s, 11*s, 8*s); g.fillRect(2*s, 24*s, 11*s, 8*s);
    g.fillStyle(0x555555); g.fillRect(-12*s, 25*s, 5*s, 3*s); g.fillRect(3*s, 25*s, 5*s, 3*s);

    return g;
  }

  private makeMrPuzzlesArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Antenna (thin rod + ball)
    g.fillStyle(0x666666); g.fillRect(-1*s, -33*s, 2*s, 8*s);
    g.fillStyle(0xffdd00); g.fillCircle(0, -34*s, 2.5*s);

    // TV box head (grey)
    g.fillStyle(0x888888); g.fillRoundedRect(-14*s, -27*s, 28*s, 20*s, 2);
    // Screen (darker inset)
    g.fillStyle(0x222222); g.fillRect(-11*s, -25*s, 22*s, 15*s);
    // Eyes on upper screen
    g.fillStyle(0xaabbcc);
    g.fillCircle(-5*s, -22*s, 3*s); g.fillCircle(5*s, -22*s, 3*s);
    g.fillStyle(0x000000);
    g.fillCircle(-5*s, -22*s, 1.5*s); g.fillCircle(5*s, -22*s, 1.5*s);
    // Color block mouth at bottom of screen (no second mouth bar)
    g.fillStyle(0xff4444); g.fillRect(-11*s, -15*s, 5.5*s, 5*s);
    g.fillStyle(0x44dd44); g.fillRect(-5.5*s, -15*s, 5.5*s, 5*s);
    g.fillStyle(0xffdd00); g.fillRect(0,      -15*s, 5.5*s, 5*s);
    g.fillStyle(0x4488ff); g.fillRect( 5.5*s, -15*s, 5.5*s, 5*s);

    // Black suit body
    g.fillStyle(0x111111); g.fillRect(-13*s, -7*s, 26*s, 20*s);
    // White shirt + bow tie
    g.fillStyle(0xffffff); g.fillRect(-5*s, -7*s, 10*s, 10*s);
    g.fillStyle(0x111111);
    g.fillTriangle(-4*s, -7*s, 0, -4*s, -4*s, -1*s); // left bow
    g.fillTriangle( 4*s, -7*s, 0, -4*s,  4*s, -1*s); // right bow
    g.fillCircle(0, -4*s, 1.5*s); // bow center

    // Long thin arms
    g.fillStyle(0x111111);
    g.fillRect(-22*s, -5*s, 10*s, 3*s); g.fillRect(12*s, -5*s, 10*s, 3*s);
    // Large hands
    g.fillStyle(0x333333);
    g.fillRect(-25*s, -8*s, 6*s, 9*s); g.fillRect(19*s, -8*s, 6*s, 9*s);

    // Black pants
    g.fillStyle(0x111111); g.fillRect(-11*s, 13*s, 22*s, 9*s);
    // Black shoes
    g.fillStyle(0x000000); g.fillRect(-12*s, 22*s, 10*s, 5*s); g.fillRect(2*s, 22*s, 10*s, 5*s);

    return g;
  }

  private makeMrWpnzArt(cardW: number): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    const s = cardW >= 200 ? 3.2 : 2.8;

    // Dark helmet body
    g.fillStyle(0x1a1a2a); g.fillRoundedRect(-13*s, -22*s, 26*s, 16*s, 3);
    // Helmet visor brow
    g.fillStyle(0x111122); g.fillRect(-13*s, -22*s, 26*s, 4*s);

    // Large binocular goggles sit ON TOP of helmet (sticking up)
    g.fillStyle(0x334455); g.fillRect(-9*s, -34*s, 7*s, 14*s); g.fillRect(2*s, -34*s, 7*s, 14*s);
    g.fillStyle(0x223344); g.fillCircle(-5.5*s, -30*s, 4.5*s); g.fillCircle(5.5*s, -30*s, 4.5*s);
    // Goggle lens shine
    g.fillStyle(0x4488cc); g.fillCircle(-7*s, -32*s, 2*s); g.fillCircle(4*s, -32*s, 2*s);
    g.fillStyle(0x88bbee); g.fillCircle(-8*s, -33*s, 1*s); g.fillCircle(3*s, -33*s, 1*s);
    // Bridge between goggles
    g.fillStyle(0x333344); g.fillRect(-1*s, -31*s, 2*s, 3*s);

    // Yellow glowing eyes on face (below goggles)
    g.fillStyle(0xffdd00); g.fillCircle(-5*s, -16*s, 3.5*s); g.fillCircle(5*s, -16*s, 3.5*s);
    g.fillStyle(0xffff88); g.fillCircle(-6*s, -17*s, 1.5*s); g.fillCircle(4*s, -17*s, 1.5*s);
    g.fillStyle(0x000000); g.fillCircle(-5*s, -16*s, 1.5*s); g.fillCircle(5*s, -16*s, 1.5*s);

    // Dark jacket with lapels
    g.fillStyle(0x1a1a2a); g.fillRect(-14*s, -8*s, 28*s, 22*s);
    // Lapels (lighter)
    g.fillStyle(0x333344);
    g.fillTriangle(-14*s, -8*s, -4*s, -8*s, -8*s, 2*s); // left lapel
    g.fillTriangle( 14*s, -8*s,  4*s, -8*s,  8*s, 2*s); // right lapel
    // Collar
    g.fillStyle(0x444455); g.fillRect(-4*s, -8*s, 8*s, 5*s);

    // Massive mechanical weapon arms (left)
    g.fillStyle(0x334455);
    g.fillRect(-28*s, -6*s, 15*s, 8*s); // arm block
    g.fillRect(-32*s, -10*s, 8*s, 16*s); // weapon barrel
    g.fillStyle(0x556677);
    g.fillRect(-31*s, -8*s, 3*s, 3*s); g.fillRect(-31*s, -3*s, 3*s, 3*s); // detail bolts
    // Right weapon arm
    g.fillStyle(0x334455);
    g.fillRect(13*s, -6*s, 15*s, 8*s);
    g.fillRect(24*s, -10*s, 8*s, 16*s);
    g.fillStyle(0x556677);
    g.fillRect(28*s, -8*s, 3*s, 3*s); g.fillRect(28*s, -3*s, 3*s, 3*s);

    // Dark pants
    g.fillStyle(0x222233); g.fillRect(-12*s, 14*s, 24*s, 9*s);
    // Dark boots
    g.fillStyle(0x111122); g.fillRect(-13*s, 23*s, 11*s, 5*s); g.fillRect(2*s, 23*s, 11*s, 5*s);

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
