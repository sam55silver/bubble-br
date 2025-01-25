import { Application, Assets, Sprite } from "pixi.js";
import { WebRTCClient } from "./client";
import { CharacterManager } from "./room";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  const characterManager = new CharacterManager();

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  const client = new WebRTCClient(app, characterManager, texture);
  client.joinRoom(1);

  const char = characterManager.createCharacter(
    client.socket.id,
    texture,
    true,
  );

  app.stage.addChild(char);

  // Listen for animate update
  app.ticker.add((time) => {
    // Update all characters
    characterManager.update(time);

    // Send local character state to other players
    const localState = characterManager.getLocalCharacterState();
    if (localState) {
      client.sendGameData({
        type: "character_update",
        state: localState,
      });
    }
  });
})();
