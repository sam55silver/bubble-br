import { GameClient } from "./client";
import { CharacterManager } from "./players/manager";
import { createScene } from "./scene/scene";
import { showConnectingMsg, showConnectionPanel, showErrorMsg } from "./ui";

async function startGame() {
    client.joinRoom("1");

    app.ticker.add((time: any) => {
        client.update(time);
    });

    document.getElementById("pixi-container")!.appendChild(app.canvas);
}

function MainMenu() {
    let connectBtn = document.getElementById("main-menu-button");
    connectBtn?.addEventListener("click", () => {});
}

async function main() {
    showConnectingMsg();

    let client: GameClient | null = null;

    try {
        const [app, assets] = await createScene();
        const characterManger = new CharacterManager(app, assets);
        client = new GameClient(characterManger);
    } catch (err) {
        showErrorMsg();
        return;
    }

    showConnectionPanel();

    let usernameInput = document.getElementById("username-input") as HTMLInputElement;
    let roomIdInput = document.getElementById("server-input") as HTMLInputElement;
    let connectBtn = document.getElementById("connect-button") as HTMLElement;

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
