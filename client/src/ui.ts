// just basics to get the buttons working
//
// window.addEventListener("DOMContentLoaded", () => {
//
//     document.getElementById("connect-button").addEventListener("click", function() {
//
//         // get values from input fields
//         let username = document.getElementById("username-input").value;
//         let server = document.getElementById("server-input").value;
//
//         console.log(server);
//         console.log(username);
//
//         // hide #connection-panel and show #connecting
//         document.getElementById("connection-panel").style.display = "none";
//         document.getElementById("connecting").style.display = "flex";
//
//
//     });
//
//     document.getElementById("main-menu-button").addEventListener("click", function() {
//
//         // hide #death-container and show #main-menu-container
//         document.getElementById("death-container").style.display = "none";
//         document.getElementById("main-menu-container").style.display = "flex";
//
//     });
// });
//

import { PlayerState } from "./types";

export function healthUpdater(hitpoints: number) {
    // target the HP div and update the contents
    const hitpointsElem = document.getElementById("hitpoints") as HTMLElement;
    hitpointsElem.innerHTML = `${hitpoints}`;
}

// to do:
// once connected, display:none on #main-menu-container and display:flex on #app
// on death, set #app to display:none and set #death-container to display:flex

export function showConnectingMsg() {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    errorMsg.style.display = "none";
    connectionMsg.style.display = "flex";
    connectionPanel.style.display = "none";
    tooFull.style.display = "none";
    dne.style.display = "none";
    playerPanel.style.display = "none";
}

export function showErrorMsg() {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    errorMsg.style.display = "flex";
    connectionMsg.style.display = "none";
    connectionPanel.style.display = "none";
    tooFull.style.display = "none";
    dne.style.display = "none";
    playerPanel.style.display = "none";
}

export function showConnectionPanel() {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    errorMsg.style.display = "none";
    connectionMsg.style.display = "none";
    connectionPanel.style.display = "flex";
    tooFull.style.display = "none";
    dne.style.display = "none";
    playerPanel.style.display = "none";
}

export function showTooFull() {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    errorMsg.style.display = "none";
    connectionMsg.style.display = "none";
    connectionPanel.style.display = "flex";
    tooFull.style.display = "flex";
    dne.style.display = "none";
    playerPanel.style.display = "none";
}

export function showDNE() {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    errorMsg.style.display = "none";
    connectionMsg.style.display = "none";
    connectionPanel.style.display = "flex";
    tooFull.style.display = "none";
    dne.style.display = "flex";
    playerPanel.style.display = "none";
}

export function showPlayerPanel(worldState: PlayerState[], roomSize: number) {
    const errorMsg = document.getElementById("error") as HTMLElement;
    const connectionMsg = document.getElementById("connecting") as HTMLElement;
    const connectionPanel = document.getElementById("connection-panel") as HTMLElement;
    const tooFull = document.getElementById("too-full") as HTMLElement;
    const dne = document.getElementById("dne") as HTMLElement;
    const playerPanel = document.getElementById("player-panel") as HTMLElement;

    const players = document.getElementById("players") as HTMLElement;
    const playerSize = document.getElementById("player-size") as HTMLElement;
    playerSize.textContent = `${worldState.length}/${roomSize}`;

    worldState.forEach((player: PlayerState) => {
        const p = document.createElement("p");
        p.textContent = player.username;
        players.appendChild(p);
    });

    errorMsg.style.display = "none";
    connectionMsg.style.display = "none";
    connectionPanel.style.display = "none";
    tooFull.style.display = "none";
    dne.style.display = "none";
    playerPanel.style.display = "flex";
}

