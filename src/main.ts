import Phaser from "phaser";
import { CutsceneScene } from "./scenes/CutsceneScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scene: [CutsceneScene, CharacterSelectScene, GameScene],
});
