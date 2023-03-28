import { Observable } from "@babylonjs/core/Misc/observable"
import { GameCache } from "../../game"

export const OnScoreUpdate: Observable<[number, number]> = new Observable<[number, number]>()
export const ScoreUpdate = ( addAmount: number )=>{
    GameCache.CurrentScore += addAmount
    if(GameCache.CurrentScore > GameCache.HighScore){
        GameCache.HighScore = GameCache.CurrentScore
        window.localStorage.setItem("BabalagaHighScore", `${GameCache.HighScore}`)        
    }
    CheckForExtraLife(GameCache.CurrentScore)
    OnScoreUpdate.notifyObservers([GameCache.CurrentScore, GameCache.HighScore])
}


export const OnExtraLifeAdded: Observable<null> = new Observable<null>()
const CheckForExtraLife = (score: number)=>{
    console.log(GameCache.ExtraLifeTracking.nextAwardAt, GameCache.ExtraLifeTracking.lastAwardedAt, GameCache.ExtraLifeTracking.awardIncrement)
    if(score >= GameCache.ExtraLifeTracking.nextAwardAt && GameCache.ExtraLifeTracking.lastAwardedAt != GameCache.ExtraLifeTracking.nextAwardAt){
        GameCache.ExtraLifeTracking.lastAwardedAt = GameCache.ExtraLifeTracking.nextAwardAt 
        GameCache.ExtraLifeTracking.nextAwardAt += GameCache.ExtraLifeTracking.awardIncrement        
        GameCache.ExtraLifeTracking.awardIncrement += GameCache.ExtraLifeTracking.baseIncrement
        GameCache.CurrentLives++

        OnExtraLifeAdded.notifyObservers(null)
    }    
}