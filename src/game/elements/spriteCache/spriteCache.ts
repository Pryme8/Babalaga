import { Observable, Scene, Vector2, Color3 } from "@babylonjs/core"
import { VoxelSprite, VoxelAnimationLoopMode } from "../voxelSprites"

export class SpriteCache{
    public static OnPrepDone: Observable<null> = new Observable<null>()
    public static Player: VoxelSprite
    public static PlayerDeath: VoxelSprite
    public static PlayerBullet: VoxelSprite
    public static BigBug: VoxelSprite
    public static BugDeath: VoxelSprite
    public static BugTractorBeam: VoxelSprite
    public static SmallBugBee: VoxelSprite
    public static SmallBugMoth: VoxelSprite

    public static EnemyBullet: VoxelSprite
    public static LevelOne: VoxelSprite
    public static LevelFive: VoxelSprite
    public static LevelTen: VoxelSprite
    public static LevelTwentyFive: VoxelSprite
    public static LevelFifty: VoxelSprite


    public static PrepCache(scene: Scene): void{        
        const spriteAtlas = new Image()

        spriteAtlas.onload = ()=>{
            const baseSize = 0.05
            const playerShip = new VoxelSprite('player', baseSize, scene)
            playerShip.addFrame("base", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })
            playerShip.addFrame("red", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, (18*1) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })
            playerShip.metadata.colliderSize = new Vector2(0.4, 0.4) 
            playerShip.metadata.isMainShip = true
            playerShip.metadata.isCaptured = false
            playerShip.metadata.isRecovered = false
            playerShip.metadata.attachedLocation = 0
            playerShip.metadata.targetLocation = 0
            playerShip.metadata.attachedShips = {left:[], right:[]}
            playerShip.metadata.recoverSpin = 0            
            playerShip.setEnabled(false)  

            SpriteCache.Player = playerShip
            const playerShipExplode = new VoxelSprite('playerShipExplode', baseSize, scene)
            playerShipExplode.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*8) + 1, 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 15)
            })
            playerShipExplode.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*10) - 1 , 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(15, 15)
            })
            playerShipExplode.addFrame("2", {
                atlas: spriteAtlas,
                start: new Vector2((18*12)-3 , 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 15)
            })
            playerShipExplode.addFrame("3", {
                atlas: spriteAtlas,
                start: new Vector2((18*14) - 5, 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(15, 15)
            })
            playerShipExplode.addFrame("4", {
                atlas: spriteAtlas,
                start: new Vector2(0, 0),
                size: new Vector2(0, 0),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(0, 0)
            })
            playerShipExplode.addAnimation({
                name: "default",
                duration: 2,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: (0.8/4)*1
                    },
                    {
                        name:"1",
                        duration: (0.8/4)*2
                    },
                    {
                        name:"2",
                        duration: (0.8/4)*3
                    },
                    {
                        name:"3",
                        duration: (0.8/4)*4
                    },
                    {
                        name:"4",
                        duration: 1
                    }
                ]
            })
            //playerShipExplode.playAnimation("default")
            SpriteCache.PlayerDeath = playerShipExplode
            SpriteCache.PlayerDeath.setEnabled(false)

            const playerBullet = new VoxelSprite('playerBullet', baseSize, scene)
            playerBullet.addFrame("base", {
                atlas: spriteAtlas,
                start: new Vector2((18*17) + 1, (18*6.5) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })

            SpriteCache.PlayerBullet = playerBullet      
            SpriteCache.PlayerBullet.setEnabled(false)

            const bigBug = new VoxelSprite('bigBug', baseSize, scene)
            bigBug.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, (18*2) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })
            bigBug.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*7) + 1, (18*2) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })
            bigBug.addFrame("0b", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, (18*3) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })
            bigBug.addFrame("1b", {
                atlas: spriteAtlas,
                start: new Vector2((18*7) + 1, (18*3) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })
            bigBug.addAnimation({
                name: "default",
                duration: 1,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: 0.5
                    },
                    {
                        name:"1",
                        duration: 1
                    }
                ]
            })   
            bigBug.addAnimation({
                name: "defaultB",
                duration: 1,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0b",
                        duration: 0.5
                    },
                    {
                        name:"1b",
                        duration: 1
                    }
                ]
            })         

            bigBug.metadata.kind = "bigBug"
            bigBug.metadata.health = 2  
            bigBug.metadata.beamupTime = 4  
            bigBug.metadata.colliderSize = new Vector2(0.4, 0.4)     
            bigBug.metadata.scoreValue = 500   
            
            bigBug.metadata.canShoot = true
            bigBug.metadata.baseShootingChance = 0.05
            bigBug.metadata.salvoCheckInterval = 1.0
            bigBug.metadata.lastSalvoCheck = 0
            bigBug.metadata.maxSalvosPerRun = 4
            bigBug.metadata.salvosTaken = 0 
            bigBug.metadata.shotsPerSalvo = 1
            bigBug.metadata.delayBetweenShots = 0
            bigBug.metadata.lastShotAt = 0
            bigBug.metadata.shotTakenPerSalvo = 0
            bigBug.metadata.isShooting = false
                
            SpriteCache.BigBug = bigBug
            SpriteCache.BigBug.setEnabled(false)

            const bugExplode = new VoxelSprite('bugExplode', baseSize, scene)
            bugExplode.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*16) + 1, 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 16)
            })
            bugExplode.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*18) -1 , 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 16)
            })
            bugExplode.addFrame("2", {
                atlas: spriteAtlas,
                start: new Vector2((18*20) - 3 , 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 16)
            })
            bugExplode.addFrame("3", {
                atlas: spriteAtlas,
                start: new Vector2((18*22) - 5, 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 16)
            })
            bugExplode.addFrame("4", {
                atlas: spriteAtlas,
                start: new Vector2((18*24) - 7, 1),
                size: new Vector2(32, 32),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(16, 16)
            })
            bugExplode.addFrame("5", {
                atlas: spriteAtlas,
                start: new Vector2(0, 0),
                size: new Vector2(0, 0),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(0, 0)
            })
            bugExplode.addAnimation({
                name: "default",
                duration: 0.6,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: (0.8/5)*1
                    },
                    {
                        name:"1",
                        duration: (0.8/5)*2
                    },
                    {
                        name:"2",
                        duration: (0.8/5)*3
                    },
                    {
                        name:"3",
                        duration: (0.8/5)*4
                    },
                    {
                        name:"4",
                        duration: (0.8/5)*5
                    },
                    {
                        name:"5",
                        duration: 1
                    }
                ]
            })      
            SpriteCache.BugDeath = bugExplode
            SpriteCache.BugDeath.setEnabled(false)      

            const bugTractorBeam = new VoxelSprite('bugTractorBeam', baseSize, scene)
            bugTractorBeam.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*16) + 1, (18*2)),
                size: new Vector2(48, 80),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(23, 7)
            }) 
            bugTractorBeam.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*16) + 51, (18*2)),
                size: new Vector2(48, 80),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(23, 7)
            }) 
            bugTractorBeam.addFrame("2", {
                atlas: spriteAtlas,
                start: new Vector2((18*16) + 101, (18*2)),
                size: new Vector2(48, 80),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(23, 7)
            }) 
            bugTractorBeam.metadata.kind = "tractorBeam"                   
            bugTractorBeam.metadata.colliderSize = new Vector2(1.2, 4.2)

            bugTractorBeam.addAnimation({
                name: "default",
                duration: 0.6,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: 1/3
                    },
                    {
                        name:"1",
                        duration: 2/3
                    },
                    {
                        name:"2",
                        duration: 1
                    }
                ]
            })
            bugTractorBeam.playAnimation("default") 
            bugTractorBeam.setEnabled(false)
            SpriteCache.BugTractorBeam = bugTractorBeam
    

            const smallBugMoth = new VoxelSprite('smallBugMoth', baseSize, scene)
            smallBugMoth.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, (18*4) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })
            smallBugMoth.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*7) + 1, (18*4) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })

            smallBugMoth.metadata.kind = "smallBug"

            smallBugMoth.metadata.health = 1                     
            smallBugMoth.metadata.colliderSize = new Vector2(0.35, 0.35)
            smallBugMoth.metadata.scoreValue = 100

            smallBugMoth.metadata.canShoot = true
            smallBugMoth.metadata.baseShootingChance = 0.1
            smallBugMoth.metadata.salvoCheckInterval = 1.2
            smallBugMoth.metadata.lastSalvoCheck = 0
            smallBugMoth.metadata.maxSalvosPerRun = 1
            smallBugMoth.metadata.salvosTaken = 0 
            smallBugMoth.metadata.shotsPerSalvo = 1
            smallBugMoth.metadata.delayBetweenShots = 0
            smallBugMoth.metadata.lastShotAt = 0
            smallBugMoth.metadata.shotTakenPerSalvo = 0
            smallBugMoth.metadata.isShooting = false

            smallBugMoth.addAnimation({
                name: "default",
                duration: 1,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: 0.5
                    },
                    {
                        name:"1",
                        duration: 1
                    }
                ]
            })
    
            SpriteCache.SmallBugMoth = smallBugMoth      
            SpriteCache.SmallBugMoth.setEnabled(false)    

            const smallBugBee = new VoxelSprite('smallBugBee', baseSize, scene)
            smallBugBee.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*6) + 1, (18*5) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })
            smallBugBee.addFrame("1", {
                atlas: spriteAtlas,
                start: new Vector2((18*7) + 1, (18*5) + 1),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(7, 7)
            })
            smallBugBee.metadata.kind = "smallBug"
            smallBugBee.metadata.health = 1 
            smallBugBee.metadata.colliderSize = new Vector2(0.35, 0.35)
            smallBugBee.metadata.scoreValue = 150

            smallBugBee.metadata.canShoot = true
            smallBugBee.metadata.baseShootingChance = 0.1
            smallBugBee.metadata.salvoCheckInterval = 0.8
            smallBugBee.metadata.lastSalvoCheck = 0
            smallBugBee.metadata.maxSalvosPerRun = 2
            smallBugBee.metadata.salvosTaken = 0 
            smallBugBee.metadata.shotsPerSalvo = 1
            smallBugBee.metadata.delayBetweenShots = 0
            smallBugBee.metadata.lastShotAt = 0
            smallBugBee.metadata.shotTakenPerSalvo = 0
            smallBugBee.metadata.isShooting = false

            smallBugBee.addAnimation({
                name: "default",
                duration: 1,
                mode: VoxelAnimationLoopMode.Loop,
                frames:[
                    {
                        name:"0",
                        duration: 0.5
                    },
                    {
                        name:"1",
                        duration: 1
                    }
                ]
            })
            SpriteCache.SmallBugBee = smallBugBee      
            SpriteCache.SmallBugBee.setEnabled(false)   

            const enemyBullet = new VoxelSprite('enemyBullet', baseSize, scene)
            enemyBullet.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*17) + 1, (18*8) + 10),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })     
            enemyBullet.setEnabled(false)
            enemyBullet.metadata.colliderSize = new Vector2(0.1, 0.1)
            SpriteCache.EnemyBullet = enemyBullet

            const levelOne = new VoxelSprite('levelOne', baseSize, scene)
            levelOne.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*17) + 1, (18*9) + 10),
                size: new Vector2(8, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(4, 7)
            })        
            levelOne.setEnabled(false)
            SpriteCache.LevelOne = levelOne 

            const levelFive = new VoxelSprite('levelFive', baseSize, scene)
            levelFive.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*17.5) + 2, (18*9) + 10),
                size: new Vector2(8, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(4, 7)
            })        
            levelFive.setEnabled(false)
            SpriteCache.LevelFive = levelFive

            const levelTen = new VoxelSprite('levelTen', baseSize, scene)
            levelTen.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*18) + 3, (18*9) + 10),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })        
            levelTen.setEnabled(false)
            SpriteCache.LevelTen = levelTen

            const levelTwentyFive = new VoxelSprite('levelTwentyFive', baseSize, scene)
            levelTwentyFive.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*19) + 3, (18*9) + 10),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })        
            levelTwentyFive.setEnabled(false)
            SpriteCache.LevelTwentyFive = levelTwentyFive

            const levelFifty = new VoxelSprite('levellevelFiftyTwentyFive', baseSize, scene)
            levelFifty.addFrame("0", {
                atlas: spriteAtlas,
                start: new Vector2((18*20) + 3, (18*9) + 10),
                size: new Vector2(16, 16),
                discard: Color3.Black(),
                tolerance: 2,
                center: new Vector2(8, 8)
            })        
            levelFifty.setEnabled(false)
            SpriteCache.LevelFifty = levelFifty

            SpriteCache.OnPrepDone.notifyObservers(null)
        }

        spriteAtlas.src = `./assets/spriteRef.png`
        spriteAtlas.crossOrigin = `Anonymous`
    }
}