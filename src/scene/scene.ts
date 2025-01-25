import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { Tile } from "./tile";
import { manifest } from "./manifest";

export async function createScene(): Promise<Application> {
    // 1) Create and initialize Pixi Application
    const app = await createPixiApplication({
        backgroundColor: "#1099bb",
        resizeTo: window,
    });

    // 2) load and retrieve needed assets
    const assets = await loadSceneAssets(manifest);

    // 3) Create main scene container + sub-layers
    const scene = new Container();
    const layers = createSceneLayers();

    // 4) Load and add the tiled map
    const scale = Math.max(
        window.innerWidth / assets.tiledMap.width,
        window.innerHeight / assets.tiledMap.height,
    );
    const map = createSingleTile(assets.tiledMap, 0, 0, scale);
    layers.background.addChild(map);

    // Add assets example
    // const tree = createSingleTile(assets.tree, 128, 128, 1);
    // layers.decoration.addChild(tree);

    Object.values(layers).forEach((layer) => scene.addChild(layer));
    app.stage.addChild(scene);

    return app;
}

/**
 * Creates a new Pixi Application and initializes it.
 */
async function createPixiApplication(options: {
    backgroundColor: string;
    resizeTo: Window | HTMLElement;
}): Promise<Application> {
    const app = new Application();
    await app.init({
        background: options.backgroundColor,
        resizeTo: options.resizeTo,
    });
    return app;
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
function createSingleTile(texture: Texture, x: number, y: number, scale = 1): Tile {
    return new Tile(texture, x, y, scale);
}
