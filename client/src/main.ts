import { GameClient } from "./client";
import { CharacterManager } from "./players/manager";
import { createScene } from "./scene/scene";
import { showConnectingMsg, showConnectionPanel, showCredits, showErrorMsg } from "./ui";

//document.getElementById("pixi-container")!.appendChild(app.canvas);

async function main() {
    showConnectingMsg();

    let client: GameClient | null = null;

    try {
        const [app, assets] = await createScene();

        const characterManger = new CharacterManager(app, assets);
        client = new GameClient(app, characterManger);
        app.ticker.add((time: any) => {
            (client as GameClient).update(time);
        });
    } catch (err) {
        console.error(err);
        showErrorMsg();
        return;
    }

    showConnectionPanel();

    let usernameInput = document.getElementById("username-input") as HTMLInputElement;
    let roomIdInput = document.getElementById("server-input") as HTMLInputElement;
    let connectBtn = document.getElementById("connect-button") as HTMLElement;
    let creditsBtn = document.getElementById("credits-button") as HTMLElement;
    let menuBtn = document.getElementById("menu-button") as HTMLElement;

    creditsBtn.addEventListener("click", () => {
        showCredits();
    });

    menuBtn.addEventListener("click", () => {
        showConnectionPanel();
    });

    connectBtn.addEventListener("click", () => {
        const username = usernameInput.value;
        const roomId = roomIdInput.value;
        if (!username || !roomId) {
            return;
        }
        showConnectingMsg();
        (client as GameClient).joinRoom(roomId, username);
    });
}

main();
