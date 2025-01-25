import { GameClient } from "./client";
import { CharacterManager } from "./players/manager";
import { createScene } from "./scene/scene";

(async () => {
    const [app, assets] = await createScene();
    document.getElementById("pixi-container")!.appendChild(app.view);

    const characterManger = new CharacterManager(app, assets);
    const client = new GameClient(characterManger);
    client.joinRoom("1");

    app.ticker.add((time: any) => {
        client.update(time);
    });
})();
