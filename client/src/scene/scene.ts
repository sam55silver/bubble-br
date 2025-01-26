import { Assets, Container, Texture } from "pixi.js";
import { manifest } from "./manifest";
import { Tile } from "./tile";
import { GameApp } from "../common";

export async function createScene(): Promise<[GameApp, Record<string, Texture>]> {
    const assets = await loadSceneAssets(manifest);

    const gameView = new Container();
    const app = new GameApp(gameView);
    await app.initApp({
        backgroundColor: "#1099bb",
        resizeTo: window,
    });
    const scene = new Container();
    gameView.addChild(scene);

    const layers = createSceneLayers();

    const map = createSingleTile(
        assets.tiledMap,
        0, // Center X
        0, // Center Y
    );
    map.anchor.set(0, 0);

    layers.background.addChild(map);

    // const windowBounds = {
    //     left: 0,
    //     right: window.innerWidth,
    //     top: 0,
    //     bottom: window.innerHeight,
    // };

    // to disallow the player from moving outside the map
    // const mapBounds = {
    //     left: map.x - (map.width * scale) / 2,
    //     right: map.x + (map.width * scale) / 2,
    //     top: map.y - (map.height * scale) / 2,
    //     bottom: map.y + (map.height * scale) / 2,
    // };

    Object.values(layers).forEach((layer) => scene.addChild(layer));

    return [app, assets];
}

/**
 * Loads the scene assets from a manifest and returns them.
 */
async function loadSceneAssets(manifest: any): Promise<Record<string, Texture>> {
    await Assets.init({ manifest });
    return Assets.loadBundle("sceneAssets");
}

/**
 * Creates the various layers for the scene and returns them
 * in an object for easy referencing.
 */
function createSceneLayers() {
    return {
        background: new Container(),
        terrain: new Container(),
        decoration: new Container(),
        buildings: new Container(),
        characters: new Container(),
        enemies: new Container(),
    };
}

/**
 * Creates a single tile sprite at the specified coordinates and scale.
 */
function createSingleTile(texture: Texture, x: number, y: number, scale = 1, rotation = 0): Tile {
    return new Tile(texture, x, y, scale, rotation);
}
