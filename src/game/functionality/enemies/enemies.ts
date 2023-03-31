import { Vector2, Scalar, Curve3, Vector3 } from "@babylonjs/core"
import { AudioCache, AudioManager } from "../../elements/audio/audio"
import { SpriteCache } from "../../elements/spriteCache/spriteCache"
import { VoxelSprite } from "../../elements/voxelSprites"
import { Game, GameCache, GameStates } from "../../game"
import { GoToNextLevel, WaitForSecondsThen } from "../gameActions/gameActions"
import { AreRectanglesOverlapping } from "../hitTests/hitTests"
import { PlayerShips } from "../player/player"

export enum BugModes{
    FlyIn,
    Idle,
    WaitingStart,
    Waiting,
    Pause,
    Attack,
    LoopUp,
    LoopDown,
    BeamUpStart,
    BeamUp,
    Capture,
    AttachToShip
}

export enum AttackModes{
    SwingIn, 
    Dropping,
    Reset
}

globalThis.Cheats = {...globalThis.Cheats, KillAllEnemies: ()=>{
    for(let i = Enemies.length - 1; i >= 0; i--){
        RemoveEnemy(Enemies[i])
    }
}}

globalThis.Cheats = {...globalThis.Cheats, EnemiesLength: ()=>{
    return Enemies.length
}}

export const Enemies: VoxelSprite[] = [] 
export const AddEnemy = (enemy: VoxelSprite) => {
    Enemies.push(enemy)
}


export const KillEnemey = (enemy: VoxelSprite) => {
    RemoveEnemy(enemy)
    const death = SpriteCache.BugDeath.clone("BugDeath")
    death.position = enemy.position
    death.onAnimationDoneObs.addOnce(()=>{
        death.dispose()
    })
    death.playAnimation("default")
    AudioManager.PlayOneShotThen(AudioCache.EnemyDeath, undefined, 2)
}

export const RemoveEnemy = (enemy: VoxelSprite, disposeSprite: boolean = true) => {
    const index = Enemies.indexOf(enemy)
    if(index !== -1){
        const _e = Enemies.splice(index, 1)[0]
        if(_e.metadata?.beamSprite){
            RemoveEnemyBullet(_e.metadata.beamSprite)
        }
        _e.dispose()
    }
    if(Enemies.length === 0){
        if( GameCache.MainPlayer.root.isDisposed() === false){
            WaitForSecondsThen(1.2, ()=>{
                GoToNextLevel()
            })   
        }else{
            if(GameCache.CurrentLives > 0){
                WaitForSecondsThen(2.4, ()=>{
                    GoToNextLevel()
                })            
            }
        }              
    }
}

export const EnemyBullets: VoxelSprite[] = [] 
export const AddEnemyBullet = (bullet: VoxelSprite) => {
    EnemyBullets.push(bullet)
}  

export const RemoveEnemyBullet = (bullet: VoxelSprite, disposeSprite: boolean = true) => {
    const index = EnemyBullets.indexOf(bullet)
    if(index !== -1){
        const _e = EnemyBullets.splice(index, 1)[0]
        if(disposeSprite){
            _e.dispose()
        }
    }
}

let bugUnpauseState = []
export const PauseAllBugs = ()=>{
    Game.Scene.onBeforeRenderObservable.addOnce(()=>{
        bugUnpauseState = []
        for(let i = 0; i < Enemies.length; i++){
            const bug = Enemies[i]
            bugUnpauseState.push(bug.metadata.getMode())
            bug.metadata.setMode(BugModes.Pause)
        }
    })
}
export const UnpauseAllBugs = ()=>{
    for(let i = 0; i < Enemies.length; i++){
        const bug = Enemies[i]
        bug.metadata.setMode(bugUnpauseState[i])
    }
}

export const BugStopWaiting = ()=>{
    for(let i = 0; i < Enemies.length; i++){
        const bug = Enemies[i]
        bug.metadata.stopWaiting()
    }
}

export const BugsStartWaiting = ()=>{
    for(let i = 0; i < Enemies.length; i++){
        const bug = Enemies[i]
        bug.metadata.startWaiting()
    }
}


export const BugResetShootingMetadata = (bug: VoxelSprite)=>{
    if(bug.metadata.canShoot){
        bug.metadata.isShooting = false
        bug.metadata.salvosTaken = 0
        bug.metadata.lastSalvoCheck = 0
        bug.metadata.lastShotAt = 0
        bug.metadata.shotTakenPerSalvo = 0
    }
}

export const BugCheckShootingChance = (bug: VoxelSprite)=>{
    if(bug.metadata.baseShootingChance === undefined){
        return false
    }else{
        return Math.random() <= bug.metadata.baseShootingChance * GameCache.Difficulty
    }
}

export const BugShootingRoutine = (bug: VoxelSprite, forceCheck: boolean = false)=>{
    if(bug.metadata.canShoot && bug.position.y > -4){   
        if(!bug.metadata.isShooting){
            if(bug.metadata.salvosTaken == bug.metadata.maxSalvosPerRun){
                return
            }
            //Shot Check
            let shoot = false
            if(forceCheck){
                shoot = BugCheckShootingChance(bug)
            }else{
                bug.metadata.lastSalvoCheck += Game.Delta
                if(bug.metadata.lastSalvoCheck >= (bug.metadata.salvoCheckInterval / GameCache.Difficulty)){
                    bug.metadata.lastSalvoCheck = 0
                    shoot = BugCheckShootingChance(bug)
                }
            }
            if(shoot){
                bug.metadata.isShooting = true
                bug.metadata.salvosTaken++
                bug.metadata.lastShotAt = bug.metadata.delayBetweenShots / GameCache.Difficulty
                bug.metadata.shotTakenPerSalvo = 0
            }
        }else{
            //Continue Salvo
            if( bug.metadata.shotTakenPerSalvo < bug.metadata.shotsPerSalvo){
                bug.metadata.lastShotAt += Game.Delta
                if(bug.metadata.lastShotAt >= bug.metadata.delayBetweenShots / GameCache.Difficulty){
                    bug.metadata.lastShotAt = 0
                    bug.metadata.shotTakenPerSalvo++
                    SpawnEnemyBullet(bug)
                }
            }else{
                bug.metadata.isShooting = false
            }                
        } 
    }
}

const SpawnEnemyBullet = (bug: VoxelSprite) => {
    const target = GameCache.MainPlayer.root.getAbsolutePosition().add(GameCache.MainPlayer.root.right.clone().scale((Math.random() * 2 - 1) * (2 / GameCache.Difficulty)))
    const direction = target.subtract(bug.position).normalize()
    const startPos = bug.position.clone().add(direction.clone().scale(0.6))
    const bullet = SpriteCache.EnemyBullet.clone('EnemyBullet')
    bullet.position = startPos
    bullet.metadata.direction = direction  
    bullet.rotation.z = Math.atan2(direction.y, direction.x) + Math.PI * 0.5 
    bullet.addOnUpdate(()=>{
        EnemyBulletUpdate(bullet)
    }) 
    AddEnemyBullet(bullet)
}

const EnemyBulletSpeed = 10
const EnemyBulletUpdate = (bullet: VoxelSprite) => {
    bullet.position.addInPlace(bullet.metadata.direction.clone().scale(((EnemyBulletSpeed + (GameCache.Difficulty - 1)) * Game.Delta)))
    if(bullet.position.y <= -10){
        RemoveEnemyBullet(bullet, true)   
        return
    }
}

export const AttachBugBehavior = (bug: VoxelSprite, endPos: Vector2, startPos: Vector2, delay: number = 0) => {
    let time = 0
    let mode = BugModes.FlyIn
    const centerPos = new Vector2(0, 10)
    const flightSpeed = 6    
    const flyInTime = 6
    const timeIdleTillAttackCheck = 4
    const threshold = 0.1
    let timeIdle = 0
    
    let attackTime = 0
    const attackStartSpeed = 1
    const attackStartPos = endPos.clone()
    let attackRunMode = AttackModes.SwingIn
    let attackRunFlip = 0
    let attackVariation = 0
    const freqVariation = Math.random() * 2 - 1

    const flyToPosition = (position: Vector2, toModeOnDone: BugModes = BugModes.Idle, additionalOnDone?: ()=> void)=>{
        const direction = (new Vector2(bug.position.x - (position.x), bug.position.y - position.y)).normalize()
        bug.position.x -= (direction.x * Game.Delta * flightSpeed)
        bug.position.y -= (direction.y * Game.Delta * flightSpeed)          
        const angle = Math.atan2(direction.x, -direction.y)
        bug.rotation.z = angle

        if(Vector2.Distance(
            new Vector2(bug.position.x, bug.position.y),
            position
        ) <= 0.1){
            bug.position.x = position.x
            bug.position.y = position.y            
            mode = toModeOnDone
            if(additionalOnDone){
                additionalOnDone()
            }
        }     
    }

    const smoothToZeroRotation = ()=>{
        if(Math.abs(bug.rotation.z) > 0.01){                
            bug.rotation.z *= 1 - (12 * Game.Delta)
        }else{
            bug.rotation.z = 0
        }
    }

    const idleFloat = (idlePosition)=>{
            bug.position.x = idlePosition.x
            bug.position.y = idlePosition.y
            smoothToZeroRotation()
    }

    bug.metadata.getMode = (): BugModes =>{
       return mode
    }

    bug.metadata.setMode = ( _mode : BugModes) =>{
        mode = _mode
     }

    bug.metadata.getFlightSpeed = (): number =>{
       return flightSpeed
    }

    bug.metadata.stopWaiting = ()=>{
        mode = BugModes.Idle
        timeIdle = Math.random() * timeIdleTillAttackCheck
    }

    bug.metadata.startWaiting = ()=>{
        mode = BugModes.WaitingStart
        if(bug.metadata?.beamSprite){
            Game.Scene.onBeforeRenderObservable.addOnce(()=>{
                RemoveEnemyBullet(bug.metadata.beamSprite)                
                bug.metadata.beamSprite = null
            })
        }
    }

    const Behavior = ()=>{

        if(Game.GameState == GameStates.BetweenLevels){
            return
        }

        if(mode != BugModes.Pause && !bug.root.isDisposed()){
            time += Game.Delta
            const offsetDirection  = (new Vector2(
                ((endPos.x - centerPos.x) / (8 - (centerPos.y - endPos.y))), (endPos.y - centerPos.y) * 0.5
            )).normalize().scale(
                Math.sin(time) * 0.5 + 0.5
            ).multiplyByFloats(6, 0.8)

            const idlePosition = new Vector2(endPos.x + offsetDirection.x, endPos.y  + offsetDirection.y)
            
            if(mode == BugModes.Idle){            
                timeIdle += Game.Delta
                idleFloat(idlePosition)
                if(timeIdle >= timeIdleTillAttackCheck){
                    if(Math.random() < threshold){
                        mode = BugModes.Attack
                        attackRunMode = AttackModes.SwingIn
                        attackRunFlip = 0
                        attackTime = 0                  
                    }
                }
            }else if(mode == BugModes.WaitingStart){
                flyToPosition(idlePosition, BugModes.Waiting)   
            }else if(mode == BugModes.Waiting){
                smoothToZeroRotation()
                idleFloat(idlePosition)
            }else if(mode == BugModes.Attack){
                attackTime += Game.Delta
                if(attackRunMode == AttackModes.SwingIn){

                    if(attackRunFlip == 0){
                        AudioManager.PlayOneShotThen(AudioCache.EnemyDropping)
                        attackRunFlip = (Math.random() >= 0.5) ? -1 : 1
                        attackStartPos.set(bug.position.x, bug.position.y)
                    }

                    if(attackTime <= attackStartSpeed){         
                        const _delta = attackTime/attackStartSpeed                
                        const id = _delta*(BugFlightSplines.AttackStart[0].length-2)
                        const idx = Math.floor(id)
                        const fract = id - idx
                        const a = BugFlightSplines.AttackStart[0][idx].scale(8).multiplyByFloats(attackRunFlip, 1, 1)
                        const b = BugFlightSplines.AttackStart[0][idx+1].scale(8).multiplyByFloats(attackRunFlip, 1, 1)
                        bug.position.x = Scalar.Lerp(a.x, b.x, fract) + attackStartPos.x
                        bug.position.y = Scalar.Lerp(a.y, b.y, fract) + attackStartPos.y
                        const direction = a.subtract(b).normalize()
                        const angle = Math.atan2(direction.x, -direction.y)
                        bug.rotation.z = angle                   
                    }else{
                        attackRunMode = AttackModes.Dropping
                        attackTime = 0
                        if(bug.metadata.kind == "bigBug" && attackVariation != -1 && !bug.metadata.capturedPlayer){
                            attackVariation = (Math.random() <= ((bug.metadata.health == 1)?0.2:0.12))?1:0
                            if(attackVariation){
                                bug.metadata.attackPostionCache = new Vector2((Math.random() * 2 - 1) * 6, -3.25)
                            }
                        }else{
                            attackVariation = -1
                        }                    
                    }

                    BugShootingRoutine(bug)   
                    return

                }else if(attackRunMode == AttackModes.Dropping){
                   
                    const yD = 1-((endPos.y - bug.position.y) / 8)
                    const xSwing = (Math.sin((yD * yD) * (6 + freqVariation) * attackRunFlip)) * 8
                    const direction = (new Vector2(bug.position.x - xSwing, 1)).normalize()
                    bug.position.x -= (direction.x * Game.Delta * flightSpeed)
                    bug.position.y -= (direction.y * Game.Delta * flightSpeed) 
                    const angle = Math.atan2(direction.x, -direction.y)
                    bug.rotation.z = angle 

                    if(bug.metadata.kind == "bigBug" && attackVariation > 0){
                        if(bug.position.y <= 1){
                            mode = BugModes.BeamUpStart
                            return
                        }
                    }

                    if(bug.position.y <= -10){
                        //ActualReset
                        attackRunMode = AttackModes.Reset
                        attackTime = 0
                        timeIdle = 0
                        attackVariation = 0
                        attackRunFlip = 0
                        bug.position.y = 11 + Math.random()
                        bug.position.x = (Math.random() * 2 - 1) * 8
                        if(bug.metadata.capturedPlayer){
                            bug.metadata.capturedPlayer.position = bug.position.clone().add(bug.root.up)
                        }
                        BugResetShootingMetadata(bug)
                        return
                    }  

                    BugShootingRoutine(bug)     
                    return               
                    
                }else if(attackRunMode == AttackModes.Reset){
                    flyToPosition(new Vector2(endPos.x + offsetDirection.x, endPos.y  + offsetDirection.y), BugModes.Idle, ()=>{
                        BugResetShootingMetadata(bug)
                    })           
                }
            }else if(mode == BugModes.FlyIn){
                if(time >= delay){
                    const dTime = time - delay
                    if(dTime <= flyInTime){
                        const _delta = dTime/flyInTime                
                        const id = _delta*(BugFlightSplines.SideIn[0].length-2)
                        const idx = Math.floor(id)
                        const fract = id - idx
                        const invert = (startPos.x > 0)? -1 : 1
                        const a = BugFlightSplines.SideIn[0][idx].scale(16).multiplyByFloats(invert, 1, 1)
                        const b = BugFlightSplines.SideIn[0][idx+1].scale(16).multiplyByFloats(invert, 1, 1)
                        bug.position.x = Scalar.Lerp(a.x, b.x, fract) + startPos.x
                        bug.position.y = Scalar.Lerp(a.y, b.y, fract) + startPos.y
                        const direction = a.subtract(b).normalize()
                        const angle = Math.atan2(direction.x, -direction.y)
                        bug.rotation.z = angle
                    }else{                    
                        flyToPosition(idlePosition, BugModes.Idle, ()=>{
                            BugResetShootingMetadata(bug)
                        })
                    }

                    BugShootingRoutine(bug)
                }
            }else if(mode == BugModes.BeamUpStart){
                flyToPosition(bug.metadata.attackPostionCache, BugModes.BeamUp)    
                smoothToZeroRotation()        
            }else if(mode == BugModes.BeamUp){   
                smoothToZeroRotation()
                if(bug.metadata.beamSprite == null && bug.rotation.z == 0){
                    attackTime = 0    
                    const beam = SpriteCache.BugTractorBeam.clone("BugTractorBeam")
                    bug.metadata.beamSprite = beam
                    beam.metadata.onCapture = (player: VoxelSprite)=>{
                        player.metadata.isCaptured = true
                        player.metadata.isRecovered = false
                        player.metadata.capturedBy = bug
                        player.metadata.captureAnimationDone = false
                        player.changeFrame("red")
                        RemoveEnemyBullet(bug.metadata.beamSprite, false)                        
                        mode = BugModes.Capture
                        bug.metadata.capturedPlayer = player
                        Game.OnPlayerCaptured.notifyObservers(player)
                    }
                    beam.root.parent = bug.root
                    beam.root.position.y = -1.25
                    beam.root.position.x = 0
                    beam.playAnimation("default", 0)
                    AddEnemyBullet(beam)
                }else if(bug.metadata.beamSprite != null){
                    attackTime += Game.Delta
                    if(attackTime >= bug.metadata.beamupTime){
                        attackTime = 0
                        attackRunFlip = 0
                        attackVariation = -1
                        mode = BugModes.Attack
                        attackRunMode = AttackModes.SwingIn
                        RemoveEnemyBullet(bug.metadata.beamSprite, true)
                        bug.metadata.beamSprite = null
                    }
                } 
            }else if(mode == BugModes.Capture){ 
                const capPoint = new Vector2(bug.position.x, bug.position.y - 4)
                const d = Vector2.Distance(
                    new Vector2(bug.metadata.capturedPlayer.position.x, bug.metadata.capturedPlayer.position.y),
                    capPoint
                ) 
                const dir = capPoint.clone().subtract(bug.metadata.capturedPlayer.position).normalize().scale(1 * Game.Delta)
                
                bug.metadata.capturedPlayer.rotation.z  = d * Math.PI * 3
                bug.metadata.capturedPlayer.position.x += dir.x
                bug.metadata.capturedPlayer.position.y += dir.y
                if(d < 0.01){                
                    bug.metadata.capturedPlayer.position.x = capPoint.x
                    bug.metadata.capturedPlayer.position.y = capPoint.y
                    bug.metadata.capturedPlayer.rotation.z = 0
                    mode = BugModes.AttachToShip
                }
            }else if(mode == BugModes.AttachToShip){   
                const capPoint = new Vector2(bug.position.x, bug.position.y - 0.9)
                const d = Vector2.Distance(
                    new Vector2(bug.metadata.capturedPlayer.position.x, bug.metadata.capturedPlayer.position.y),
                    capPoint
                ) 
                bug.metadata.capturedPlayer.position.y += 1 * Game.Delta
                
                if(d < 0.01){
                    bug.metadata.capturedPlayer.position.x = capPoint.x
                    bug.metadata.capturedPlayer.position.y = capPoint.y
                    bug.metadata.beamSprite.dispose()
                    bug.metadata.beamSprite = null
                    Enemies.forEach((e)=>{
                        if(e.metadata?.startWaiting){
                            e.metadata.startWaiting()
                        }
                    })
                }
            }
        }
    }
    bug.addOnUpdate(()=>{Behavior()})
}

class BugFlightSplines{
    static SideIn = [
        Curve3.CreateCatmullRomSpline(
            [
            new Vector3(0, 0, 0),
            new Vector3(0.6, 0.35, 0),
            new Vector3(0.75, 0.5, 0),
            new Vector3(0.75, 0.75, 0),
            new Vector3(0.5, 0.75, 0),
            new Vector3(0.5, 0.35, 0),
            new Vector3(0.75, 0.35, 0),
            new Vector3(0.75, 0.75, 0)
            ],
            300
        ).getPoints()
    ]

    static AttackStart = [
        Curve3.CreateCatmullRomSpline(
            [
            new Vector3(0, 0, 0),      
            new Vector3(0.05, 0.05, 0),
            new Vector3(0.1, 0.05, 0),
            new Vector3(0.15, 0.0, 0),
            new Vector3(0.15, -0.1, 0),
            ],
            300
        ).getPoints()
    ]
}