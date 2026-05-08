import Phaser from "phaser";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#1a0a3a",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
    },
  },
  scene: [CharacterSelectScene, GameScene],
});
