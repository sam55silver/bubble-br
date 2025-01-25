import { Application, Assets, Container, Texture } from "pixi.js";
import { manifest } from "./manifest";
import { Tile } from "./tile";

export async function createScene(): Promise<Application> {
    // 1) Create and initialize Pixi Application
    const app = await createPixiApplication({
        backgroundColor: "#1099bb",
        resizeTo: window,
    });

    const rotate90 = Math.PI / 2;
    const rotate45 = Math.PI / 4;
    const rotateMinus90 = -Math.PI / 2;
    const rotateMinus45 = -Math.PI / 4;

    // 2) load and retrieve needed assets
    const assets = await loadSceneAssets(manifest);

    const scene = new Container();
    const layers = createSceneLayers();

    const scale = Math.max(
        window.innerWidth / assets.tiledMap.width,
        window.innerHeight / assets.tiledMap.height,
    );

    const map = createSingleTile(
        assets.tiledMap,
        window.innerWidth / 2, // Center X
        window.innerHeight / 2, // Center Y
        scale,
    );

    layers.background.addChild(map);

    const windowBounds = {
        left: 0,
        right: window.innerWidth,
        top: 0,
        bottom: window.innerHeight,
    };

    // to disallow the player from moving outside the map
    const mapBounds = {
        left: map.x - (map.width * scale) / 2,
        right: map.x + (map.width * scale) / 2,
        top: map.y - (map.height * scale) / 2,
        bottom: map.y + (map.height * scale) / 2,
    };

    const crossBow = createSingleTile(
        assets.crossBowRed,
        map.x + 250, // Center of map
        map.y + 250 + 60, // 60 pixels below center
        1,
        rotate90,
    );
    layers.characters.addChild(crossBow);

    const player = createSingleTile(
        assets.player,
        map.x + 250, // Center of map
        map.y + 250, // Center of map
        1,
    );
    layers.characters.addChild(player);

    // const crossBowBolt = createSingleTile(
    //     assets.crossBowBoltLight,
    //     player.x, 
    //     player.y + 135, // Same Y as player
    //     1,
    //     rotate90
    // );
    // layers.characters.addChild(crossBowBolt);

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
function createSingleTile(texture: Texture, x: number, y: number, scale = 1, rotation = 0): Tile {
    return new Tile(texture, x, y, scale, rotation);
}
