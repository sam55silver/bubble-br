import { Application, Assets } from "pixi.js";
import { WebRTCClient } from "./client";
import { CharacterManager } from "./manager";
import { getTurnServers } from "./turnServer";

(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#1099bb", resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  const playerTexture = await Assets.load("/assets/bunny.png");

  const characterManager = new CharacterManager(app, playerTexture);

  const iceServers = await getTurnServers();

  const client = new WebRTCClient(iceServers, characterManager);
  client.joinRoom(1);

  characterManager.createCharacter(client.socket.id, true);

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
