import { Application, Assets, Container, Sprite } from "pixi.js";

export const manifest = {
    bundles: [
        {
            name: "sceneAssets",
            assets: {
                // Animals
                chicken: "/assets/characters/Animals/Chicken/Chicken.png",
                cow: "/assets/characters/Animals/Cow/Cow.png",
                pig: "/assets/characters/Animals/Pig/Pig.png",
                sheep: "/assets/characters/Animals/Sheep/Sheep.png",
                bunnyTexture: "/assets/characters/bunny.png",

                // Enemies
                skeleton: "/assets/characters/Enemies/Skeleton.png",
                slimeGreen: "/assets/characters/Enemies/Slime_Green.png",
                slime: "/assets/characters/Enemies/Slime.png",

                // Player
                player: "/assets/characters/Player/Player.png",
                playerActions: "/assets/characters/Player/Player_Actions.png",

                // Outdoor
                bridge: "/assets/Outdoor/Bridge_Wood.png",
                chest: "/assets/Outdoor/Chest.png",
                fences: "/assets/Outdoor/Fences.png",
                house: "/assets/Outdoor/House.png",
                treeSmall: "/assets/Outdoor/Oak_Tree_Small.png",
                tree: "/assets/Outdoor/Oak_Tree.png",
                outdoorDecor: "/assets/Outdoor/Outdoor_Decor_Free.png",

                // Tiles
                beachTile: "/assets/Tiles/Beach_Tile.png",
                cliffTile: "/assets/Tiles/Cliff_Tile.png",
                farmTile: "/assets/Tiles/FarmLand_Tile.png",
                grassTile: "/assets/Tiles/Grass_Middle.png",
                pathMiddle: "/assets/Tiles/Path_Middle.png",
                pathTile: "/assets/Tiles/Path_Tile.png",
                waterMiddle: "/assets/Tiles/Water_Middle.png",
                waterTile: "/assets/Tiles/Water_Tile.png",
            },
        },
        // Add more bundles here...
    ],
};

export async function createScene(): Promise<Application> {
    // Create the PixiJS Application
    const app = new Application();
    await app.init({ background: "#1099bb", resizeTo: window });

    // 1) Initialize Pixi Assets with manifest
    await Assets.init({ manifest });

    // 2) Load the bundle named "sceneAssets"
    //    This returns a Record<string, Texture> keyed by your alias
    const assets = await Assets.loadBundle("sceneAssets");

    // Create a container for the entire scene
    const scene = new Container();

    // Create sub-layers (optional layering system)
    const layers = {
        background: new Container(),
        terrain: new Container(),
        decoration: new Container(),
        buildings: new Container(),
        characters: new Container(),
        enemies: new Container(),
    };

    // Example 1: Add a grass tile in the background
    //    The alias "grassTile" corresponds to the key in your manifest
    const grass = new Sprite(assets.grassTile);
    grass.position.set(50, 50);
    grass.scale.set(2, 2);
    layers.background.addChild(grass);

    // Example 2: Add a tree decoration
    const tree = new Sprite(assets.tree);
    tree.position.set(100, 100);
    layers.decoration.addChild(tree);

    // Example 3: Add a house
    const house = new Sprite(assets.house);
    house.position.set(300, 200);
    layers.buildings.addChild(house);

    // Add all layers to the main scene container
    Object.values(layers).forEach((layer) => scene.addChild(layer));

    // Finally, add the scene container to the stage
    app.stage.addChild(scene);

    return app;
}
