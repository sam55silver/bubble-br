import { GameClient } from "./client";
import { CharacterManager } from "./players/manager";
import { createScene } from "./scene/scene";

(async () => {
    const [app, assets] = await createScene();
    document.getElementById("pixi-container")!.appendChild(app.view);

    const playerTexture = assets.player;

    const characterManger = new CharacterManager(app, playerTexture);
    const client = new GameClient(characterManger);
    client.joinRoom("1");

    app.ticker.add((time: any) => {
        client.update(time);
    });
})();
