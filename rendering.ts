class TileData {
    costToTravel: number = Infinity;
    toEnd: number = 0;
    value: number = 0;
    state: number = 0;
    position: Position;
    sprite: Sprite;
    cameFrom:TileData = undefined
    constructor (pos:Position) {
        this.position = pos
    }
}
//inicializace velikostí
const LevelDimensions: Size = { width: 4, height: 4 };
const ChunkSize: Size = { width: 5, height: 5 };
const TileSize: Size = { width: 12, height: 12 };
const RenderDistance: Size = { width: Math.ceil((userconfig.ARCADE_SCREEN_WIDTH + 0.5 * TileSize.width) / TileSize.width), height: Math.ceil((userconfig.ARCADE_SCREEN_HEIGHT + 0.5 * TileSize.height) / TileSize.height) }
//inicializace vchodu a východu do dungeonu
const EntryPointPosition: Position = { x: Math.floor(Math.random() * (LevelDimensions.width - 1) + 1), y: Math.floor(Math.random() * (LevelDimensions.height - 1) + 1) }
const ExitPointPosition: Position = { x: 0, y: 0 }
exitAndEntry()
//inicializace Hráče
let level:number = 1
const TestingPlayer: Creature = {absolutePosition:{ x: EntryPointPosition.x * ChunkSize.width + 2, y: EntryPointPosition.y * ChunkSize.height + 2 }, secondaryPosition:{ x: EntryPointPosition.x * ChunkSize.width + 2, y: EntryPointPosition.y * ChunkSize.height + 2 }, type: EntityTypes.player, health: 100, maxhealth: 100, defense: 100, attack:10, path:[]}
const TestingPlayerSprite = sprites.create(assets.image`player-right`, SpriteKind.Player)
TestingPlayerSprite.z = 10
const startingPoint: Position = { y: TestingPlayer.absolutePosition.y - Math.ceil(RenderDistance.height / 2), x: TestingPlayer.absolutePosition.x - Math.ceil(RenderDistance.width / 2) }
TestingPlayerSprite.x = (TestingPlayer.absolutePosition.x - startingPoint.x + 0.5) * TileSize.width
TestingPlayerSprite.y = (TestingPlayer.absolutePosition.y - startingPoint.y + 0.5) * TileSize.height
const playerHealth = textsprite.create(TestingPlayer.health.toString(), 0, 1)
playerHealth.setIcon(assets.image`lives`)
playerHealth.setOutline(1, 15)
playerHealth.x = 20
playerHealth.y = 15
playerHealth.z = 100
const playerAttack = textsprite.create(TestingPlayer.attack.toString(), 0, 1)
playerAttack.setIcon(assets.image`attack`)
playerAttack.setOutline(1, 15)
playerAttack.x = 75
playerAttack.y = 15
playerAttack.z = 100
const playerDefense = textsprite.create(TestingPlayer.defense.toString(), 0, 1)
playerDefense.setIcon(assets.image`defense`)
playerDefense.setOutline(1, 15)
playerDefense.x = 105
playerDefense.y = 15
playerDefense.z = 100
const dungeonLevel = textsprite.create(level.toString(), 0, 1)
dungeonLevel.setIcon(assets.image`level`)
dungeonLevel.setOutline(1, 15)
dungeonLevel.x = 145
dungeonLevel.y = 15
dungeonLevel.z = 100

//inicializace gridů pro zobrazování políček
const displayGrid: TileData[][] = [];
const entityGrid: TileData[][] = [];
let globalSeed: number = Math.random() * 2 ** 32;
const renderFrame = (gridData: ChunkData[][]): void => {
    clearDisplayGrid(entityGrid)
    //Definuje absolutní pozici počítečního bodu pro vykreslení
    startingPoint.y = TestingPlayer.absolutePosition.y - Math.ceil(RenderDistance.height / 2)
    startingPoint.x = TestingPlayer.absolutePosition.x - Math.ceil(RenderDistance.width / 2)
    //vygeneruje mapu pokud hráč dorazil do cíle
    if (TestingPlayer.absolutePosition.x === ExitPointPosition.x * ChunkSize.width + 2 && TestingPlayer.absolutePosition.y === ExitPointPosition.y * ChunkSize.height + 2) {
        music.play(music.melodyPlayable(music.beamUp), music.PlaybackMode.InBackground)
        level++;
        EntryPointPosition.x = Math.floor(Math.random() * (LevelDimensions.width - 1))
        EntryPointPosition.y = Math.floor(Math.random() * (LevelDimensions.height - 1))
        exitAndEntry()
        TestingPlayer.absolutePosition.x = EntryPointPosition.x * ChunkSize.width + 2
        TestingPlayer.absolutePosition.y = EntryPointPosition.y * ChunkSize.height + 2
        startingPoint.y = TestingPlayer.absolutePosition.y - Math.ceil(RenderDistance.height / 2)
        startingPoint.x = TestingPlayer.absolutePosition.x - Math.ceil(RenderDistance.width / 2)
        TestingPlayerSprite.x = (TestingPlayer.absolutePosition.x - startingPoint.x + 0.5) * TileSize.width
        TestingPlayerSprite.y = (TestingPlayer.absolutePosition.y - startingPoint.y + 0.5) * TileSize.height
        Enemies = []
        globalSeed = Math.random() * 2 ** 32
        resetChunkGrid(ChunkGrid, tileSet, LevelDimensions);
        generatePath(ChunkGrid)
        modifyDungeonBorder(ChunkGrid, voidTypeChunk, LevelDimensions);
        generateDungeonLevelRooms(ChunkGrid, LevelDimensions);
        dungeonLevel.setText(level.toString())
    }
    //zajišťuje aby kamera "nevyšla" mimo mapu (ve skutečnosti se kamera nepohubuje, jenom se mění textury)
    if (startingPoint.x <= 0) {
        TestingPlayerSprite.x = (TestingPlayer.absolutePosition.x + 0.5) * TileSize.width
        startingPoint.x = 0

    }
    if (startingPoint.y <= 0) {
        TestingPlayerSprite.y = (TestingPlayer.absolutePosition.y + 0.5) * TileSize.height
        startingPoint.y = 0

    }
    if (TestingPlayer.absolutePosition.x + Math.floor(RenderDistance.width / 2) >= LevelDimensions.width * ChunkSize.width) {
        startingPoint.x = (LevelDimensions.width * ChunkSize.width) - RenderDistance.width
        TestingPlayerSprite.x = (TestingPlayer.absolutePosition.x + 0.5 - startingPoint.x) * TileSize.width
    }
    if (TestingPlayer.absolutePosition.y + Math.floor(RenderDistance.height / 2) >= LevelDimensions.height * ChunkSize.height) {
        startingPoint.y = (LevelDimensions.height * ChunkSize.height) - RenderDistance.height
        TestingPlayerSprite.y = (TestingPlayer.absolutePosition.y + 0.5 - startingPoint.y) * TileSize.height
    }
    //vykreslení políček
    TestingPlayer.secondaryPosition = {x: TestingPlayer.absolutePosition.x - startingPoint.x, y: TestingPlayer.absolutePosition.y - startingPoint.y}
    for (let i = 0; i < RenderDistance.height; i++) {
        for (let j = 0; j < RenderDistance.width; j++) {
            const chunkPos = absoluteToChunks({ x: startingPoint.x + j, y: startingPoint.y + i })
            const TilePos = absoluteToTiles({ x: startingPoint.x + j, y: startingPoint.y + i })
            for (let m = 0; m < gridData[chunkPos.y][chunkPos.x].Entities.length; m++) {
                if (gridData[chunkPos.y][chunkPos.x].Entities[m].inChunkPosition.x === TilePos.x && gridData[chunkPos.y][chunkPos.x].Entities[m].inChunkPosition.y === TilePos.y) {
                    lookupTileData(gridData[chunkPos.y][chunkPos.x].Entities[m].type, entityGrid[i][j])
                }
            }
            const tileData = gridData[chunkPos.y][chunkPos.x].chunkTypeOptions[0].imgData[TilePos.y][TilePos.x];
            lookupTileData(tileData, displayGrid[i][j]);
        }
    }
    //detekce sebrání předmětu
    const playerChunk = absoluteToChunks(TestingPlayer.absolutePosition)
    const playerTile = absoluteToTiles(TestingPlayer.absolutePosition)
    if (entityGrid[TestingPlayer.secondaryPosition.y][TestingPlayer.secondaryPosition.x].sprite.kind() === SpriteKind.Item) {
        for (let i = 0; i < gridData[playerChunk.y][playerChunk.x].Entities.length; i++) {
            if (gridData[playerChunk.y][playerChunk.x].Entities[i].inChunkPosition.x === playerTile.x && gridData[playerChunk.y][playerChunk.x].Entities[i].inChunkPosition.y === playerTile.y) {
                music.play(music.melodyPlayable(music.baDing), music.PlaybackMode.InBackground)
                pickUp(TestingPlayer, gridData[playerChunk.y][playerChunk.x].Entities[i].type)
                gridData[playerChunk.y][playerChunk.x].Entities.splice(i, 1)
            }
        }
    }
    //resetuje nepřáteled
    for (let i = Enemies.length-1; i >= 0; i--) {
        const enemyPos = Enemies[i].absolutePosition
        if (Enemies[i].health <= 0) {
            Enemies.splice(i, 1)
        } else {
            if (enemyPos.x >= startingPoint.x && enemyPos.x < startingPoint.x + RenderDistance.width && enemyPos.y >= startingPoint.y && enemyPos.y < startingPoint.y + RenderDistance.height) { 
                entityGrid[enemyPos.y - startingPoint.y][enemyPos.x - startingPoint.x].sprite.setKind(SpriteKind.Enemy)
            }
        }
    }
    //pohyb nepřátel
    for (let i = 0; i < Enemies.length; i++) {
        const enemyPos = Enemies[i].absolutePosition
        if (enemyPos.x >= startingPoint.x && enemyPos.x < startingPoint.x + RenderDistance.width && enemyPos.y >= startingPoint.y && enemyPos.y < startingPoint.y + RenderDistance.height) {
            //detekce kolizí
            if (entityGrid[Enemies[i].secondaryPosition.y - startingPoint.y][Enemies[i].secondaryPosition.x - startingPoint.x].sprite.kind() !== SpriteKind.Enemy && !(Enemies[i].secondaryPosition.x === TestingPlayer.absolutePosition.x && Enemies[i].secondaryPosition.y === TestingPlayer.absolutePosition.y)) {
                entityGrid[enemyPos.y - startingPoint.y][enemyPos.x - startingPoint.x].sprite.setKind(SpriteKind.Tile)
                enemyPos.x = Enemies[i].secondaryPosition.x
                enemyPos.y = Enemies[i].secondaryPosition.y
            }
            //útok na hráče
            if (Enemies[i].secondaryPosition.x === TestingPlayer.absolutePosition.x && Enemies[i].secondaryPosition.y === TestingPlayer.absolutePosition.y) {
                TestingPlayer.health -= Attack(TestingPlayer.defense, Enemies[i].attack)
                if (TestingPlayer.health <= 0) {
                    game.gameOver(false)
                }
            }
            //vykreslení nepřátel
            lookupTileData(Enemies[i].type, entityGrid[enemyPos.y - startingPoint.y][enemyPos.x - startingPoint.x])
            //hledání cesty, buď pokud cesta skončila, nebo je nepřítel blízko hráže
            if (getDistanceToEnd(enemyPos, TestingPlayer.absolutePosition) < ChunkSize.width || Enemies[i].path.length === 0) {
                Enemies[i].path = findPath(displayGrid[enemyPos.y-startingPoint.y][enemyPos.x - startingPoint.x], displayGrid[TestingPlayer.secondaryPosition.y][TestingPlayer.secondaryPosition.x], displayGrid)
                if (Enemies[i].path.length > 0) {
                    Enemies[i].secondaryPosition.x = Enemies[i].path[Enemies[i].path.length - 1].x
                    Enemies[i].secondaryPosition.y = Enemies[i].path[Enemies[i].path.length - 1].y
                }
            }
            //posunutí nepřítele na dál po cestě
            if (Enemies[i].path.length > 0) {
                Enemies[i].secondaryPosition.x = Enemies[i].path[Enemies[i].path.length - 1].x
                Enemies[i].secondaryPosition.y = Enemies[i].path[Enemies[i].path.length - 1].y
                Enemies[i].path.splice(Enemies[i].path.length - 1, 1)
            }
        }
    }
    //vykreslení vlastností hráče
    playerHealth.setText(TestingPlayer.health.toString() + "/" + TestingPlayer.maxhealth.toString())
    playerAttack.setText(TestingPlayer.attack.toString())
    playerDefense.setText(TestingPlayer.defense.toString())
}
const initializeDisplayGrid = (grid: TileData[][]) => {
    for (let i = 0; i < RenderDistance.height; i++) {
        grid.push([])
        for (let j = 0; j < RenderDistance.width; j++) {
            grid[i][j] = new TileData({ y: i, x: j })
            grid[i][j].sprite = sprites.create(assets.image`void-tile`, SpriteKind.Tile)
            grid[i][j].sprite.setPosition((j * TileSize.width + 0.5 * TileSize.width), (i * TileSize.height + 0.5 * TileSize.height));
        }
    }
}  
const clearDisplayGrid = (grid: TileData[][]) => {
    for (let i = 0; i < RenderDistance.height; i++) {
        for (let j = 0; j < RenderDistance.width; j++) {
            grid[i][j].sprite.setImage(assets.image`void-tile`)
            entityGrid[i][j].sprite.setKind(SpriteKind.Tile)
        }
    }
}
const lookupTileData = (ID: number, tile:TileData) => {
    switch (ID) {
        case 15:
            tile.sprite.setImage(assets.image`wall`)
            tile.sprite.setKind(SpriteKind.Wall)
            break;
        case 14: 
            tile.sprite.setImage(assets.image`floor`)
            tile.sprite.setKind(SpriteKind.Floor)
            break;
        case 13: 
            tile.sprite.setImage(assets.image`entry-point-tile`)
            tile.sprite.setKind(SpriteKind.EntryPoint)
            break;
        case 12:
            tile.sprite.setImage(assets.image`exit-point-tile`)
            tile.sprite.setKind(SpriteKind.ExitPoint)
            break;
        case 0:
            tile.sprite.setImage(assets.image`regen-potion`)
            tile.sprite.setKind(SpriteKind.Item)
            break;
        case 1:
            tile.sprite.setImage(assets.image`healthBoost-potion`)
            tile.sprite.setKind(SpriteKind.Item)
            break;
        case 2:
            tile.sprite.setImage(assets.image`attackBoost`)
            tile.sprite.setKind(SpriteKind.Item)
            break;
        case 3:
            tile.sprite.setImage(assets.image`defenseBoost`)
            tile.sprite.setKind(SpriteKind.Item)
            break;
        case 6:
            tile.sprite.setImage(assets.image`entity`)
            tile.sprite.setKind(SpriteKind.Enemy)
            break;
        default:
            tile.sprite.setImage(assets.image`closed`)
            tile.sprite.setKind(SpriteKind.Tile)
            break;
    }
}
const Attack = (def: number, atk: number) => {
    let damage:number = atk - def
    if (damage < 0) {
        damage = 0
    }
    return damage
}
const pickUp = (player:Creature, itemType:number) => {
    switch (itemType) {
        case 0:
            player.health = player.maxhealth
            break;
        case 1:
            player.maxhealth = Math.ceil(player.maxhealth*1.2)
        break;
        case 2:
            player.attack = Math.ceil(player.attack*1.2)
            break;
        case 3:
            player.defense = Math.ceil(player.defense*1.2)
            break;
        default:
            break;
    }
}