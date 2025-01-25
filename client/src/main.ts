import { createScene } from "./scene/scene";

(async () => {
    const app = await createScene();

    document.getElementById("pixi-container")!.appendChild(app.view);

    app.ticker.add((time) => {
        const player = app.stage.getChildByName("player");
        if (player) {
            player.rotation += 0.02 * time.deltaTime;
        }
    });
})();
