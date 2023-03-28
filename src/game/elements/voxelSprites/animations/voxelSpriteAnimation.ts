import { Observer, Scene } from "@babylonjs/core"
import { VoxelSprite } from "../voxelSprite"

export enum VoxelAnimationLoopMode{
    None,
    Loop,
    PingPong
}

export interface IVoxelSpriteAnimationProps{
    name: string
    duration: number
    mode: VoxelAnimationLoopMode
    frames: IVoxelSpriteAnimationFrame[]
}

interface IVoxelSpriteAnimationFrame{
    name: string
    duration: number
}

export class VoxelSpriteAnimation{
    private _time: number = 0
    public get time(): number{
        return this._time
    }
    private _lastUpdate: number = 0
    private _currentFrame: number = 0
    private _updateObs: Observer<Scene>
    constructor(
        public name: string,
        public duration: number,
        public mode: VoxelAnimationLoopMode,
        public frames: IVoxelSpriteAnimationFrame[],
        private _sprite: VoxelSprite
    ){}

    private _delta(update: boolean = false): number{
        const now = performance.now()
        const delta = (now - this._lastUpdate)
        if(update){
            this._lastUpdate = now
        }
        return delta * 0.001
    }

    public start(startTime: number = 0){
        this._time = startTime
        this._lastUpdate = performance.now()
        this._updateObs = this._sprite.scene.onBeforeRenderObservable.add(()=>{
            this._update()
        })
    }

    public stop(){
        this._time = 0
        this._currentFrame = 0
        this._sprite.scene.onBeforeRenderObservable.remove(this._updateObs)
    }

    private _update(){
        const delta = this._delta(true)
        this._time += delta
        if(this._time > this.duration){
            this._time = 0
            this._currentFrame = 0
            if(this.mode == VoxelAnimationLoopMode.None){
                return this.stop()
            }
            this._sprite.onAnimationDoneObs.notifyObservers(null)
        }        
        for(let i = this._currentFrame; i < this.frames.length; i++){
            const frameTime = this.frames[i].duration * this.duration
            if(frameTime >= this._time){
                this._currentFrame = i
                break
            }
        } 

        this._sprite.changeFrame(this.frames[this._currentFrame].name)       
    }

    public clone(sprite: VoxelSprite){ 
        return new VoxelSpriteAnimation(
            this.name, 
            this.duration, 
            this.mode, 
            [
            ...this.frames
            ], 
            sprite
        )
    }
}