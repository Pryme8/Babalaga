import { MeshBuilder, PointerEventTypes } from "@babylonjs/core"
import { InputManager } from "@babylonjs/core/Inputs/scene.inputManager"
import { Vector3 } from "@babylonjs/core/Maths/math.vector"
import { Mesh } from "@babylonjs/core/Meshes/mesh"
import { Observable } from "@babylonjs/core/Misc/observable"
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture"
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock"
import { SpriteCache } from "../../elements/spriteCache/spriteCache"
import { VoxelSprite } from "../../elements/voxelSprites"
import { Game, GameCache } from "../../game"
import { DoForEachWithDelayThen, OnGoingToNextLevel, WaitUntilConditionThen } from "../gameActions/gameActions"
import { OnPlayerSpawned } from "../player/player"
import { OnExtraLifeAdded, OnScoreUpdate } from "../scoring/scoring"


export const LightBlueFontColor = 'rgb(0, 160, 255)'

export class UI{
    public static ScoreUI: AdvancedDynamicTexture
    public static ScoreUIMesh: Mesh
    public static HighScoreText: TextBlock
    public static HighScoreValue: TextBlock
    public static OneUpText: TextBlock
    public static CurrentScoreValue: TextBlock
    public static LifeSprites: VoxelSprite[] = []
    public static LevelSprites: VoxelSprite[] = []
    public static OnLevelSpritesReady: Observable<null> = new Observable<null>()
}

const ApplyBasicFont = (textBlock: TextBlock)=>{
    textBlock.fontSize = 24
    textBlock.fontFamily = 'GameFont'
}

export const SetupGeneralUI = ()=> {
    /*Current Score Stuff*/  
    UI.ScoreUIMesh = MeshBuilder.CreatePlane('score', {width: 13, height: 1}, Game.Scene)
    UI.ScoreUIMesh.renderingGroupId = 3
    UI.ScoreUIMesh.position = new Vector3(0, 9, 0)
    UI.ScoreUI = AdvancedDynamicTexture.CreateForMesh(UI.ScoreUIMesh, 1024, 1024/13, false)
    UI.CurrentScoreValue = new TextBlock('points', '00')
    UI.CurrentScoreValue.color = 'white'
    UI.CurrentScoreValue.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    UI.CurrentScoreValue.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_BOTTOM
    UI.CurrentScoreValue.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    UI.CurrentScoreValue.width = 0.3
    UI.CurrentScoreValue.left = 0.35
    ApplyBasicFont(UI.CurrentScoreValue)
    UI.ScoreUI.addControl(UI.CurrentScoreValue)  

    UI.HighScoreValue = new TextBlock('highScoreValue', `${GameCache.HighScore}`)
    UI.HighScoreValue.color = 'white'
    UI.HighScoreValue.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    UI.HighScoreValue.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_BOTTOM
    UI.HighScoreValue.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    UI.HighScoreValue.width = 0.5
    ApplyBasicFont(UI.HighScoreValue)
    UI.ScoreUI.addControl(UI.HighScoreValue)

    UI.HighScoreText = new TextBlock('highScoreText', 'HIGH SCORE')
    UI.HighScoreText.color = 'red'
    UI.HighScoreText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    UI.HighScoreText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP
    UI.HighScoreText.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    UI.HighScoreText.width = 0.5
    UI.HighScoreText.height = 0.6
    ApplyBasicFont(UI.HighScoreText)
    UI.ScoreUI.addControl(UI.HighScoreText)
}

export const SetupGamePlayingUI = ()=> {
    // //*Life Stuff*/
    const lifePosition = new Vector3(-6.5, -8.9, 0)
    const addLife = () => {
        const life = SpriteCache.Player.clone('life')
        console.log(life)
        life.position = lifePosition.clone()
        life.root.getChildMeshes().forEach(mesh => {
            mesh.renderingGroupId = 3
        })
        life.root.scaling.setAll(0.6)
        life.position.x += UI.LifeSprites.length * 0.8
        UI.LifeSprites.push(life)
    }
    const removeLife = () => {
        UI.LifeSprites.splice(UI.LifeSprites.length - 1, 1)[0]?.dispose()
    }
    for(let i = 0; i < GameCache.CurrentLives; i++){
        addLife()
    }
    OnPlayerSpawned.add(()=>{
        removeLife()
    })
    OnExtraLifeAdded.add(()=>{
        console.log("Extra Life Added")
        addLife()
    })
    //*End Life Stuff*/

    //*Level Stuff*/
    const levelPosition = new Vector3(6.5, -8.9, 0)
   
    const icons = ['50', '25', '10', '5', '1']
    const iconMap = [SpriteCache.LevelFifty, SpriteCache.LevelTwentyFive, SpriteCache.LevelTen, SpriteCache.LevelFive, SpriteCache.LevelOne]

    const getLevelIcons = (number: number): string[] => {        
        const result = []      
        for (let i = 0; i < icons.length; i++){
          const icon = icons[i]
          const value = parseInt(icon)      
          while (number >= value) {
            result.push(icon)
            number -= value
          }
        }      
        return result    }


    const updateLevel = () => {
        const currentLevel = GameCache.CurrentLevel   
        UI.LevelSprites.forEach(level => level.dispose())    
        const _icons = getLevelIcons(currentLevel)   
        DoForEachWithDelayThen(_icons, 0.12, 
            (icon, index) => {
                console.log(icons.indexOf(icon))
                const level = iconMap[icons.indexOf(icon)].clone('levelIcon:'+icon)
                level.root.getChildMeshes().forEach(mesh => {
                    mesh.renderingGroupId = 3            
                })
                level.position = levelPosition.clone()
                level.root.scaling.setAll(0.6)
                console.log(((icons.length-1) - index) * 0.5)
                level.position.x -= ((_icons.length-1) - index) * 0.5
                UI.LevelSprites.push(level)
            }, 
            ()=>{
                UI.OnLevelSpritesReady.notifyObservers(null)
            }
        )  
    }
    updateLevel()
    globalThis.Cheats = {...globalThis.Cheats, ManualLevelUIUpdate: (level)=>{
        GameCache.CurrentLevel = level
        updateLevel()
    }}
    OnGoingToNextLevel.add(()=>{
        updateLevel()
    })
    //TODO need Obs for when level changes to update this
 
    /*End Level Stuff*/

    const oneUpText = new TextBlock('oneUp', '1UP')
    oneUpText.color = 'red'
    oneUpText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER
    oneUpText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP
    oneUpText.horizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT
    oneUpText.width = 0.3
    oneUpText.left = 0.35
    oneUpText.height = 0.6
    ApplyBasicFont(oneUpText)
    UI.ScoreUI.addControl(oneUpText)

    let oneUpBlinkSpeed = 0.6
    let oneUpBlinkTimer = 0
    Game.Scene.onBeforeRenderObservable.add(()=>{
        oneUpBlinkTimer += Game.Delta
        if(oneUpBlinkTimer > oneUpBlinkSpeed){
            oneUpBlinkTimer = 0
            oneUpText.isVisible = !oneUpText.isVisible
        }    
    })

    OnScoreUpdate.add(([current, high])=>{
        UI.CurrentScoreValue.text = current.toString()
        UI.HighScoreValue.text = high.toString()
    })
    /*End Current Score Stuff*/
}

export const ShowScreenTextThen = (text: string, color:string, duration:number, then: ()=>void) => {
    const tempPlaneMesh = MeshBuilder.CreatePlane('tempPlane', {width: 13, height: 1}, Game.Scene)
    const tempUI = AdvancedDynamicTexture.CreateForMesh(tempPlaneMesh, 1024, 1024/13, false)
    const tempText = new TextBlock('tempText', text)
    tempText.color = color
    ApplyBasicFont(tempText)
    tempUI.addControl(tempText)
    let timer = 0
    const obs = Game.Scene.onBeforeRenderObservable.add(()=>{
        timer += Game.Delta
        if(timer >= duration){
            Game.Scene.onBeforeRenderObservable.remove(obs)
            tempUI.dispose()
            tempPlaneMesh.dispose()
            then()
        }
    })
}

export const ShowScreenTextUntilClickThen = (text: string, color:string, then: ()=> void) => {
    const tempPlaneMesh = MeshBuilder.CreatePlane('tempPlane', {width: 13, height: 1}, Game.Scene)
    const tempUI = AdvancedDynamicTexture.CreateForMesh(tempPlaneMesh, 1024, 1024/13, false)
    const tempText = new TextBlock('tempText', text)
    tempText.color = color
    ApplyBasicFont(tempText)
    tempUI.addControl(tempText)

    let click = false

    const obs = Game.Scene.onPointerObservable.add((pointerInfo)=>{
        if(pointerInfo.type == PointerEventTypes.POINTERDOWN){
            Game.Scene.onPointerObservable.remove(obs)
            click = true
        }
    })

    WaitUntilConditionThen(()=> click, ()=>{
        tempUI.dispose()
        tempPlaneMesh.dispose()
        then()
    })
}