import { Vector2 } from "@babylonjs/core"
import { Observable } from "@babylonjs/core/Misc/observable"
import { SpriteCache } from "../../elements/spriteCache/spriteCache"
import { AttachBugBehavior, AddEnemy } from "../enemies/enemies"
import { ResolveAsAsyncThen } from "../gameActions/gameActions"

export const OnLevelSpawned: Observable<null> = new Observable<null>()
export const OnLevelCompleted: Observable<null> = new Observable<null>()

export const SpawnNormalLevel = (baseDelay: number = 1.2) => {
    ResolveAsAsyncThen(()=>{
        let y = 0
        for(let x = -4; x < 0; x++){
            const bug = SpriteCache.BigBug.clone("bug")       
            bug.playAnimation("default")  
            const endPos = new Vector2(x + 0.5, 7.5 - y)
            bug.position.x = -8 - y     
            bug.position.y = -5 + x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 6 + baseDelay)
        }
        for(let x = -4; x < 0; x++){
            const bug = SpriteCache.SmallBugMoth.clone("bug")
            bug.playAnimation("default")  
            const endPos = new Vector2(x + 0.5, 5.5 - y)
            bug.position.x = -8 - y     
            bug.position.y = -5 + x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 2 + baseDelay)
        }              
        y = 1
        for(let x = -4; x < 0; x++){
            const bug = SpriteCache.SmallBugBee.clone("bug")       
            bug.playAnimation("default")  
            const endPos = new Vector2(x + 0.5, 7.5 - y)
            bug.position.x = -8 - y     
            bug.position.y = -5 + x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 6 + baseDelay)
        }
        for(let x = -4; x < 0; x++){
            const bug = SpriteCache.SmallBugMoth.clone("bug")
            bug.playAnimation("default")  
            const endPos = new Vector2(x + 0.5, 5.5 - y)
            bug.position.x = -8 - y     
            bug.position.y = -5 + x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 2 + baseDelay)
        }            
        y = 0
        for(let x = 4; x > 0; x--){
            const bug = SpriteCache.BigBug.clone("bug")         
            bug.playAnimation("default")  
            const endPos = new Vector2(x - 0.5, 7.5 - y)
            bug.position.x = 8 + y    
            bug.position.y = -5 - x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 4 + baseDelay)
        }
        for(let x = 4; x > 0; x--){
            const bug = SpriteCache.SmallBugMoth.clone("bug")         
            bug.playAnimation("default")  
            const endPos = new Vector2(x - 0.5, 5.5 - y)
            bug.position.x =  8 + y     
            bug.position.y = -5 - x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 0 + baseDelay)
        }
        y = 1
        for(let x = 4; x > 0; x--){
            const bug = SpriteCache.SmallBugBee.clone("bug")         
            bug.playAnimation("default")  
            const endPos = new Vector2(x - 0.5, 7.5 - y)
            bug.position.x = 8 + y    
            bug.position.y = -5 - x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 4 + baseDelay)
        }
        for(let x = 4; x > 0; x--){
            const bug = SpriteCache.SmallBugMoth.clone("bug")         
            bug.playAnimation("default")  
            const endPos = new Vector2(x - 0.5, 5.5 - y)
            bug.position.x =  8 + y     
            bug.position.y = -5 - x              
            AddEnemy(bug)
            AttachBugBehavior(bug, endPos, new Vector2( bug.position.x, bug.position.y), 0 + baseDelay)
        } 
    },()=>{
        OnLevelSpawned.notifyObservers(null)
    })    
}

export const SpawnBonusLevel = () => {

}

