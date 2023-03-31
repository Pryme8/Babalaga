import { Observable } from "@babylonjs/core/Misc/observable"
import { Game, GameCache, GameStates } from "../../game"
import { OnLevelSpawned, SpawnNormalLevel } from "../levels/levels"
import { ScoreUpdate } from "../scoring/scoring"
import { LightBlueFontColor, ShowScreenTextThen } from "../ui/ui"

export const OnGoingToNextLevel: Observable<null> = new Observable<null>()

export const GoToNextLevel = () => {
    Game.GameState = GameStates.BetweenLevels
    ScoreUpdate(GameCache.CurrentLevel * 150)
    GameCache.CurrentLevel++    
    WaitForSecondsThen(1, ()=>{
        ShowScreenTextThen(`Level ${GameCache.CurrentLevel}`, LightBlueFontColor,  1.2, ()=>{
            OnLevelSpawned.addOnce(()=>{
                WaitForSecondsThen(0.8, ()=>{
                    Game.GameState = GameStates.Playing
                })                    
            })                
            SpawnNormalLevel()
        })
        OnGoingToNextLevel.notifyObservers(null)
    })
}

export const WaitForSecondsThen = (seconds: number, then: ()=>void) => {
    let timer = 0
    const obs = Game.Scene.onBeforeRenderObservable.add(()=>{
        timer += Game.Delta
        if(timer >= seconds){
            Game.Scene.onBeforeRenderObservable.remove(obs)
            then()
        }
    })
}

export const ResolveAsAsyncThen = (resolve: ()=>void, then: ()=>void) => {
    new Promise<null>((res)=>{
        resolve()
        res(null)
    }).then(()=>{
        then()
    })
}

export const DoForEachWithDelayThen = (array: any[], delay: number, func: (item: any, index: number)=>void, then: ()=>void) => {
    for(let i = 0; i < array.length; i++){
        setTimeout(()=>{
            func(array[i], i)
        }, delay * i * 1000)
    }
}

export const WaitUntilConditionThen = (condition: ()=>boolean, then: ()=>void) => {
    const obs = Game.Scene.onBeforeRenderObservable.add(()=>{
        if(condition()){
            Game.Scene.onBeforeRenderObservable.remove(obs)
            then()
        }
    })
}


