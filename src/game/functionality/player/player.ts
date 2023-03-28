import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector"
import { Observable } from "@babylonjs/core/Misc/observable"
import { AudioCache, AudioManager } from "../../elements/audio/audio"
import { Controls } from "../../elements/controls/controls"
import { SpriteCache } from "../../elements/spriteCache/spriteCache"
import { VoxelSprite } from "../../elements/voxelSprites/voxelSprite"
import { Game, GameCache, GameStates } from "../../game"
import { BugModes, BugsStartWaiting, BugStopWaiting, Enemies, EnemyBullets, KillEnemey, PauseAllBugs, RemoveEnemy, UnpauseAllBugs } from "../enemies/enemies"
import { WaitForSecondsThen } from "../gameActions/gameActions"
import { AreRectanglesOverlapping } from "../hitTests/hitTests"
import { ScoreUpdate } from "../scoring/scoring"

const playerInput = new Vector2( 0, 0 )
const playerSpeed = 6

let playerLastShot = 0
const playerRateOfFire = 0.32
const playerStartingY = -7

export const OnPlayerSpawned: Observable<VoxelSprite> = new Observable<VoxelSprite>()
export const OnPlayerCapturedAnimationDone: Observable<VoxelSprite> = new  Observable<VoxelSprite>()
export const OnPlayerShipRecoveryDone: Observable<VoxelSprite> = new Observable<VoxelSprite>()

OnPlayerCapturedAnimationDone.add((player)=>{
    if(player.metadata.isMainShip){
        if(GameCache.CurrentLives > 0){
            SpawnNewPlayer(true)
        }
        player.metadata.isMainShip = false
    }
    WaitForSecondsThen(0.8, ()=>{
        Game.GameState = GameStates.Playing
        BugStopWaiting()
    }) 
})

const PlayerShips: VoxelSprite[] = []

export const SpawnNewPlayer = (deductLife: boolean)=>{
    const player = SpriteCache.Player.clone('Player') 
    player.position.y = playerStartingY
    player.addOnUpdate(()=>{PlayerControlUpdate(player)})
    OnPlayerSpawned.notifyObservers(player)
    GameCache.MainPlayer = player
    PlayerShips.push(player)
    if(deductLife){
        GameCache.CurrentLives--
    }
}

export const RemovePlayer = (player: VoxelSprite)=>{
    player.dispose()
    const index = PlayerShips.indexOf(player)
    if(index > -1){
        PlayerShips.splice(index, 1)
    }
}

export const MainPlayerDeath = (player: VoxelSprite)=>{
    Game.GameState = GameStates.PlayerDead
    BugsStartWaiting()
    RemovePlayer(player)
    SpawnPlayerDeathExplosion(player.position)
    DestroyAllAttachedShips(player) 
    if(GameCache.CurrentLives > 0){
        WaitForSecondsThen(1.2, ()=>{
            SpawnNewPlayer(true)
            WaitForSecondsThen(1.2, ()=>{
                BugStopWaiting()
                Game.GameState = GameStates.Playing                
            })
        })
    }else{
        //Game Over!
    }
}

const SpriteSmoothToPosition = (sprite, position, speed)=>{
    if(Vector2.Distance(
        new Vector2(sprite.position.x, sprite.position.y),
        position
    ) <= 0.01){
        sprite.position.x = position.x
        sprite.position.y = position.y
    }else{
        const direction = (new Vector2(sprite.position.x - position.x, sprite.position.y - position.y)).normalize()
        sprite.position.x -= (direction.x * Game.Delta * speed)
        sprite.position.y -= (direction.y * Game.Delta * speed)
    }    
}

const CheckPlayerEnemeyBulletOverlap = (player: VoxelSprite, playerOverlap)=>{
    for(let i = 0; i < EnemyBullets.length; i++){
        const bullet = EnemyBullets[i]
        const abs = bullet.root.getAbsolutePosition()
        if(AreRectanglesOverlapping(playerOverlap, 
            {
                position: {x:abs.x, y:abs.y},
                size: {x:bullet.metadata.colliderSize.x, y:bullet.metadata.colliderSize.y},
            })
        ){  
            if(bullet.metadata.kind == "tractorBeam"){
                Game.GameState = GameStates.PlayerCaptured                
                if(player.metadata.isMainShip){
                    DestroyAllAttachedShips(player)
                }else{
                    player.root.setParent(null)
                    DestroyAttachedPastNumber(GameCache.MainPlayer, player.metadata.attachedLocation)
                }    
                bullet.metadata.onCapture(player)            
                return false
            }
        }
    }
}

const CheckForShooting = (player: VoxelSprite)=>{
    if(Controls.Map.Space){
        if(playerLastShot == 0){
            let l = player.metadata.attachedShips.left.length
            let r = player.metadata.attachedShips.right.length
            SpawnBullet(player, l, r)
            AudioManager.PlayOneShotThen(AudioCache.PlayerShoot, undefined, 1)
        }
        playerLastShot += Game.Delta
    }else{
        if(playerLastShot != 0){
            playerLastShot += Game.Delta         
        }
    }
    if(playerLastShot >= playerRateOfFire){
        playerLastShot = 0
    }   
}

const SpawnPlayerDeathExplosion = (position: Vector3)=>{        
    const playerDeath = SpriteCache.PlayerDeath.clone("PlayerDeath")
    playerDeath.position = position
    playerDeath.onAnimationDoneObs.addOnce(()=>{
        playerDeath.dispose()
    })
    playerDeath.playAnimation("default")       
}

const DestroyAllAttachedShips = (player: VoxelSprite)=>{
    console.log( "Destroy All Attached Ships", player.metadata.attachedShips)
    for(let i = 0; i < player.metadata.attachedShips.left.length; i++){
        player.metadata.attachedShips.left[i].root.setParent(null)
        setTimeout(()=>{
            SpawnPlayerDeathExplosion(player.metadata.attachedShips.left[i].position)
            RemovePlayer(player.metadata.attachedShips.left[i])
            if(i == player.metadata.attachedShips.left.length - 1){
                player.metadata.attachedShips.left = []
            }            
        }, 200 * i)        
    }
    for(let i = 0; i < player.metadata.attachedShips.right.length; i++){
        player.metadata.attachedShips.right[i].root.setParent(null)
        setTimeout(()=>{
            SpawnPlayerDeathExplosion(player.metadata.attachedShips.right[i].position)
            RemovePlayer(player.metadata.attachedShips.right[i])
            if(i == player.metadata.attachedShips.right.length - 1){
                player.metadata.attachedShips.right = []
            }            
        }, 200 * i)
    }
}

const DestroyAttachedPastNumber = (player: VoxelSprite, destroyPast: number)=>{  
    let destroy
    if(destroyPast < 0){
        console.log( "Destroy All Attached Ships to the Left of "+ destroyPast, player.metadata.attachedShips)
        destroy = player.metadata.attachedShips.left.splice(Math.abs(destroyPast), player.metadata.attachedShips.left.length)
        player.metadata.attachedShips.left.splice(Math.abs(destroyPast) - 1, 1)
    }else{
        console.log( "Destroy All Attached Ships to the Right of "+ destroyPast, player.metadata.attachedShips)
        destroy = player.metadata.attachedShips.right.splice(destroyPast, player.metadata.attachedShips.right.length)
        player.metadata.attachedShips.right.splice(destroyPast - 1, 1)
    }
    for(let i = 0; i < destroy.length; i++){
        destroy[i].root.setParent(null)
        setTimeout(()=>{
            SpawnPlayerDeathExplosion(destroy[i].position)
            destroy[i].dispose()
        }, 200 * i)
    }
}

export const PlayerControlUpdate = ( player: VoxelSprite )=>{
    if(!player.root.isDisposed()){
        const playerAbs = player.root.getAbsolutePosition()
        const playerOverlap = {
            position:{x: playerAbs.x, y: playerAbs.y},
            size: {x:0.05, y:0.1}
        }
        if(!player.metadata.isCaptured && player.metadata.isMainShip){
            if(Game.GameState == GameStates.PlayerCaptured){
                return
            }
            if(Game.GameState == GameStates.BetweenLevels){
                SpriteSmoothToPosition(player, new Vector3(0, playerStartingY, 0), 6)
                return
            }
            if(Game.GameState == GameStates.Playing){
                playerInput.set( 0, 0 )
                if(Controls.Map.ArrowLeft){
                    playerInput.x--
                }
                if(Controls.Map.ArrowRight){
                    playerInput.x++
                }
                if(Controls.Map.ArrowUp){
                    playerInput.y++
                }
                if(Controls.Map.ArrowDown){
                    playerInput.y--
                }

                if(playerInput.length()>1){
                    const normal = playerInput.normalize()
                    playerInput.x = normal.x
                    playerInput.y = normal.y
                }

                if( player.position.x <= 6 &&  player.position.x >= -6){
                    player.position.x += playerInput.x * playerSpeed * Game.Delta
                    if( player.position.x > 6){
                        player.position.x = 6 
                    }
                    if( player.position.x < -6){
                        player.position.x = -6 
                    }
                }

                if(player.position.y >= -8 && player.position.y <= -5){
                    player.position.y += playerInput.y * playerSpeed * Game.Delta
                    if(player.position.y > -5){
                        player.position.y = -5
                    }
                    if(player.position.y < -8){
                        player.position.y = -8
                    }
                } 

                CheckForShooting(player)
          
                for(let i = 0; i < Enemies.length; i++){
                    const enemy = Enemies[i]
                    const abs = enemy.root.getAbsolutePosition()
                    if(AreRectanglesOverlapping(playerOverlap, 
                    {
                        position: {x:abs.x, y:abs.y},
                        size: {x:enemy.metadata.colliderSize.x, y:enemy.metadata.colliderSize.y},
                    }
                    )){
                        MainPlayerDeath(player)
                        KillEnemey(enemy)                           
                    }
                }
                CheckPlayerEnemeyBulletOverlap(player, playerOverlap)
                
            }else if(Game.GameState == GameStates.PlayerRecover){
                SpriteSmoothToPosition(player, new Vector2(0, playerStartingY), 6)
            }
        }else if(player.metadata.isCaptured){           
            //Is Captured
            const bug = player.metadata.capturedBy
            if(!bug.root.isDisposed()){
                const bugsMode = bug.metadata.getMode()
                if(bugsMode == BugModes.WaitingStart){
                    const down = bug.root.up.clone().scale(-0.8)
                    player.position.x = bug.position.x + down.x
                    player.position.y = bug.position.y + down.y
                }else if(bugsMode == BugModes.Waiting || bugsMode == BugModes.Idle){
                    const up = bug.root.up.clone()
                    up.x += bug.position.x
                    up.y += bug.position.y
                    SpriteSmoothToPosition(player, up, bug.metadata.getFlightSpeed())
                    if(!player.metadata.captureAnimationDone){
                        if(player.position.x == up.x && player.position.y == up.y){
                            player.metadata.captureAnimationDone = true
                            OnPlayerCapturedAnimationDone.notifyObservers(player)
                        }
                    }                
                }else if(bugsMode == BugModes.Attack || bugsMode == BugModes.LoopDown || bugsMode == BugModes.LoopUp){
                    const up = Vector3.Up()
                    up.x += bug.position.x
                    up.y += bug.position.y
                    SpriteSmoothToPosition(player, up, bug.metadata.getFlightSpeed())
                }
            }else{                
                PauseAllBugs()
                Game.GameState = GameStates.PlayerRecover     
                console.log(Game.GameState)        
                player.metadata.isRecovered = true
                player.metadata.isCaptured = false
                player.metadata.capturedBy = null
                player.metadata.recoverSpin = 0
                player.metadata.targetLocation = 0
                player.metadata.attachedLocation = 0
                OnPlayerShipRecoveryDone.addOnce(()=>{
                    WaitForSecondsThen(0.5, ()=>{
                        UnpauseAllBugs()
                    })
                })
            }
        }else if(player.metadata.isRecovered){
            const mainPlayer = GameCache.MainPlayer
            if(player.metadata.attachedLocation != 0){
                //Do attached Stuff!
                CheckPlayerEnemeyBulletOverlap(player, playerOverlap)
                
            }else if(player.metadata.targetLocation == 0){
                if(player.metadata.recoverSpin < Math.PI*3){
                    player.metadata.recoverSpin += Math.PI * 6 * Game.Delta
                    player.rotation.z = player.metadata.recoverSpin
                }else{
                    player.rotation.z = 0
                    player.changeFrame("base")
                    const lPos = (mainPlayer.root.getAbsolutePosition()).clone().add(new Vector3(-0.8 * (mainPlayer.metadata.attachedShips.left.length + 1), 0, 0))
                    const rPos = (mainPlayer.root.getAbsolutePosition()).clone().add(new Vector3(0.8 * (mainPlayer.metadata.attachedShips.right.length + 1), 0, 0))
                    console.log(lPos, rPos)
                    console.log(Vector3.Distance(player.position, lPos), Vector3.Distance(player.position, rPos))
                    if(Vector3.Distance(player.position, lPos) < Vector3.Distance(player.position, rPos)){
                        player.metadata.targetLocation =  mainPlayer.metadata.attachedShips.left.length - 1
                        mainPlayer.metadata.attachedShips.left.push(player)
                    }else{
                        player.metadata.targetLocation =  mainPlayer.metadata.attachedShips.right.length + 1
                        mainPlayer.metadata.attachedShips.right.push(player)
                    }   
                }
            }else if(player.metadata.targetLocation != 0 && player.metadata.attachedLocation == 0){
                //Get closest Attach Location
                const attachPos = mainPlayer.root.getAbsolutePosition().addInPlaceFromFloats(0.8 * player.metadata.targetLocation, 0, 0)
                SpriteSmoothToPosition(player, attachPos, 6)
                if(Vector3.Distance(player.position, attachPos) < 0.1){
                    player.metadata.attachedLocation = player.metadata.targetLocation
                    player.root.parent = mainPlayer.root
                    player.root.setAbsolutePosition(attachPos)
                    Game.GameState = GameStates.Playing
                    OnPlayerShipRecoveryDone.notifyObservers(player)                                   
                }                
            }
        }
    }
}

const SpawnBullet = (player: VoxelSprite, leftExtra: number, rightExtra: number) => {
    const main = SpriteCache.PlayerBullet.clone('PlayerBullet')
    if(GameCache.CurrentScore > 0){
        ScoreUpdate(-1)
    }
    const pos = player.root.getAbsolutePosition()
    main.position.x = pos.x
    main.position.y = pos.y + 0.6
    main.addOnUpdate(()=>{
        PlayerBulletUpdate(main)
    })

    for(let i = 1; i <= leftExtra; i++){
        const bullet = SpriteCache.PlayerBullet.clone('PlayerBullet')
        bullet.position = main.position.clone().addInPlaceFromFloats(-i * 0.8, 0, 0)
        bullet.addOnUpdate(()=>{
            PlayerBulletUpdate(bullet)
        })
    }
    for(let i = 1; i <= rightExtra; i++){
        const bullet = SpriteCache.PlayerBullet.clone('PlayerBullet')
        bullet.position = main.position.clone().addInPlaceFromFloats(i * 0.8, 0, 0)
        bullet.addOnUpdate(()=>{
            PlayerBulletUpdate(bullet)
        })
    }
   
}

const playerBulletSpeed = 12
const PlayerBulletUpdate = (bullet: VoxelSprite) => {    
    bullet.position.y += playerBulletSpeed * Game.Delta
    if(bullet.position.y >= 10){
        bullet.dispose()
        return
    }
    const bulletOverlap = {
        position:{x: bullet.position.x, y: bullet.position.y},
        size: {x:0.05, y:0.1}
    }
    if(Game.GameState != GameStates.Playing){return}
    for(let i = 0; i < Enemies.length; i++){
        const enemy = Enemies[i]
        if(AreRectanglesOverlapping(bulletOverlap, 
        {
            position: {x:enemy.position.x, y:enemy.position.y},
            size: {x:enemy.metadata.colliderSize.x, y:enemy.metadata.colliderSize.y},
        }
        )){
            if(Enemies[i].metadata.health != 0){            
                bullet.dispose()
                let enemy: VoxelSprite = Enemies[i]
                enemy.metadata.health--            
                enemy.flashTintColor(new Vector3(1, -0.5, 0.5), 0.08, 2, ()=>{
                    if(enemy.metadata.health == 0){ 
                        KillEnemey(enemy)
                        ScoreUpdate(enemy.metadata.scoreValue ?? 0)
                    }else{
                        if(enemy.metadata.kind == "bigBug"){
                            if(enemy.metadata.health == 1){
                                enemy.playAnimation('defaultB', enemy.getCurrentAnimationTime())
                            }                    
                        }
                    }
                })
            }
        }
    }

    for(let i=0; i < PlayerShips.length; i++){
        const ship = PlayerShips[i]   
        if(ship.metadata.isMainShip || ship.metadata.targetLocation != 0){continue} 
        const shipAbs = ship.root.getAbsolutePosition()
        console.log(ship)
        if(AreRectanglesOverlapping(bulletOverlap, 
            {
                position: {x:shipAbs.x, y:shipAbs.y},
                size: {x:ship.metadata.colliderSize.x, y:ship.metadata.colliderSize.y},
            })
        ){
            SpawnPlayerDeathExplosion(shipAbs)
            RemovePlayer(ship)
        }
    }
}