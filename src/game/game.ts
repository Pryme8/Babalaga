import { Engine, Scene, Vector3, HemisphericLight, MeshBuilder, Mesh, FreeCamera, Color4, DefaultRenderingPipeline, Vector2, Observable, Texture } from "@babylonjs/core"
import { VoxelSpaceBackground } from "./elements/spaceBackground"
import { VoxelSprite } from "./elements/voxelSprites";
import { Controls } from "./elements/controls/controls";
import { SpriteCache } from "./elements/spriteCache/spriteCache";
import { SpawnNewPlayer } from "./functionality/player/player";
import { LightBlueFontColor, SetupGamePlayingUI, SetupGeneralUI, ShowScreenTextThen } from "./functionality/ui/ui";
import { CustomMaterial } from "@babylonjs/materials/custom/customMaterial";
import { OnLevelSpawned, SpawnNormalLevel } from "./functionality/levels/levels";
import { WaitForSecondsThen } from "./functionality/gameActions/gameActions";

export enum GameStates{
    Landing,
    Intro,
    Playing,
    Paused,
    BetweenLevels,
    PlayerCaptured,
    PlayerRecover,
    PlayerDead,
    BonusStage,
    BonusSummary,
    GameOver,
    Reset
}

export class GameCache{
    static HighScore: number = parseInt(window.localStorage.getItem("BabalagaHighScore") ?? '0', 10) ?? 0    
    static CurrentScore: number = 0
    static CurrentLevel: number = 1
    static CurrentLives: number = 3
    static ExtraLifeTracking = {
        lastAwardedAt: 0,
        nextAwardAt: 10000,
        awardIncrement: 10000,
        baseIncrement: 10000
    }
    static Reset(highScore: boolean = false){
        if(highScore){
            GameCache.HighScore = 0
            window.localStorage.setItem("BabalagaHighScore", `0`)
        }        
        GameCache.CurrentScore = 0
        GameCache.CurrentLives = 3
        GameCache.CurrentLevel = 0
        GameCache.ExtraLifeTracking = {
            lastAwardedAt: 0,
            nextAwardAt: 10000,
            awardIncrement: 10000,
            baseIncrement: 10000
        }
        GameCache.MainPlayer = null
    }
    static MainPlayer: VoxelSprite = null
}

export class Game{
    public static Instance: Game
    private _target: HTMLElement
    private _canvas: HTMLCanvasElement
    public get canvas(): HTMLCanvasElement {
        return this._canvas
    }
    private _engine: Engine
    public get engine(): Engine {
        return this._engine
    }
    private _scene: Scene
    public get scene(): Scene {
        return this._scene
    }
    public static get Scene(): Scene{
        return Game.Instance.scene
    }

    public static Delta: number = 0
    private _gameState: GameStates = GameStates.Playing
    public static get GameState(): GameStates{
        return Game.Instance._gameState
    }
    public static set GameState(state: GameStates){
        Game.Instance._gameState = state
    }    


    public static OnPlayerCaptured: Observable<VoxelSprite> = new  Observable<VoxelSprite>()

    constructor(){
        Game.Instance = this
        this._target = document.getElementById("game")
        this._canvas = this._createCanvas()
        this._initializeEngine()
        const spaceBackground = new VoxelSpaceBackground(this.scene)
        Game.Scene.onAfterRenderObservable.addOnce(()=>{
            Game.GameState = GameStates.Intro
        })
        
        // const tempPlayArea = MeshBuilder.CreatePlane('tempPlayArea', {width: 13, height: 17}, this.scene)
        // tempPlayArea.visibility  = 0.5

        const controls = new Controls(this.scene)
        SpriteCache.PrepCache(this.scene)

        SpriteCache.OnPrepDone.addOnce(()=>{    
            SetupGeneralUI()
            ShowScreenTextThen("Player 1", LightBlueFontColor, 2, ()=>{
                Game.GameState = GameStates.BetweenLevels
                SetupGamePlayingUI()
                SpawnNewPlayer(true)                             
                OnLevelSpawned.addOnce(()=>{
                    WaitForSecondsThen(0.8, ()=>{
                        Game.GameState = GameStates.Playing
                    })                    
                })                
                SpawnNormalLevel()
            })        
        })     

        this.scene.onBeforeRenderObservable.add(()=>{
            Game.Delta = this.engine.getDeltaTime() * 0.001
        })
    }

    private _createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas")
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.id = "gameCanvas"        
        this._target.appendChild(canvas)
        return canvas
    }

    private _initializeEngine(){
        const engine = new Engine(this.canvas, true)
        const scene = new Scene(engine)
        globalThis.scene = scene
       
        const camera = new FreeCamera("camera1", new Vector3(0, 0, -22), scene)
        camera.setTarget(Vector3.Zero())
        
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene)
        light.intensity = 0.7

        scene.clearColor = new Color4(0, 0, 0, 1)
        const defaultPipeline = new DefaultRenderingPipeline("default", true, scene, [camera])
        defaultPipeline.samples = 4
        defaultPipeline.chromaticAberrationEnabled = true
        defaultPipeline.chromaticAberration.aberrationAmount  = 60.30
        defaultPipeline.chromaticAberration.radialIntensity = 0.6
        defaultPipeline.chromaticAberration.direction = new Vector2(0.25, -0.25)
        defaultPipeline.depthOfFieldEnabled = true
        defaultPipeline.depthOfField.focalLength = 400
        defaultPipeline.depthOfField.fStop = 4.8
        defaultPipeline.depthOfField.focusDistance = 9000
        defaultPipeline.grainEnabled = true
        defaultPipeline.grain.animated = true
        defaultPipeline.grain.intensity = 15.5
        defaultPipeline.sharpenEnabled = true
        defaultPipeline.imageProcessingEnabled = true
        defaultPipeline.imageProcessing.contrast = 1.1
        defaultPipeline.imageProcessing.exposure = 1.5
        defaultPipeline.imageProcessing.toneMappingEnabled = true
        defaultPipeline.imageProcessing.vignetteEnabled = true

        const divFps = document.getElementById("fps")

        const overLayScene = new Scene(engine)
        overLayScene.autoClear = false
        const overLaySceneCamera = new FreeCamera("overLaySceneCamera", new Vector3(0, 0, -22), overLayScene)
        overLaySceneCamera.setTarget(Vector3.Zero())
        const overlayPlane = MeshBuilder.CreatePlane('overlayPlane', {width: 1000, height: 1000}, overLayScene)
        overlayPlane.visibility = 0.999
        const overlayMaterial = new CustomMaterial('overlayMaterial', overLayScene)
        overlayPlane.material = overlayMaterial
        overlayMaterial.diffuseTexture = new Texture('assets/gameFace.png', overLayScene)     
        overlayMaterial.diffuseTexture.wrapU = Texture.CLAMP_ADDRESSMODE
        overlayMaterial.diffuseTexture.wrapV = Texture.CLAMP_ADDRESSMODE 
        overlayMaterial.AddUniform('overlayScale', 'float', 25)
        overlayMaterial.AddUniform('offsetX', 'float', 0.5)
        overlayMaterial.AddUniform('offsetY', 'float', 0.425)
          
        overlayMaterial.Vertex_Definitions(`
            varying vec2 vUV;
            varying vec2 vXY;
        `)
        overlayMaterial.Vertex_After_WorldPosComputed(`
            vUV = (worldPos.xy/overlayScale) + vec2(offsetX, offsetY);
            vXY = worldPos.xy;
        `)
        overlayMaterial.Fragment_Definitions(`
            varying vec2 vUV;
            varying vec2 vXY;
        `)
        overlayMaterial.Fragment_Before_FragColor(`
            color = texture2D(diffuseSampler, vUV);
            if(vXY.x < -9.5){
                color.rgb -= distance(vXY.x, -9.5) * 0.5;
            }
            if(vXY.x > 9.5){
                color.rgb -= distance(vXY.x, 9.5) * 0.5;
            }
            if(vXY.y < -10.5){
                color.rgb -= distance(vXY.y, -10.5);
            }
            if(vXY.y > 10.5){
                color.rgb -= distance(vXY.x, 10.5);
            }
        `)       

        engine.runRenderLoop(() => {
            scene.render()            
            overLayScene.render()
            divFps.innerHTML = engine.getFps().toFixed() + " fps"
        })

        this._target.addEventListener('resize', ()=>{
            engine.resize()          
        })   
        window.addEventListener('resize', ()=>{
            engine.resize()
            
        })  
        
        this._engine = engine
        this._scene = scene
    }
}