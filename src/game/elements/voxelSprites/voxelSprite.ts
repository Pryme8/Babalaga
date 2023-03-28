import { Vector2, Color3, TransformNode, Vector3, Mesh, Matrix, Observable, Scene, StandardMaterial, Color4, MeshBuilder, Observer } from "@babylonjs/core"
import { CustomMaterial } from "@babylonjs/materials"
import { IVoxelSpriteAnimationProps, VoxelSpriteAnimation } from "./animations/voxelSpriteAnimation"


interface IVoxelSpriteParseProps{
    atlas: HTMLImageElement
    start: Vector2
    size: Vector2
    discard: Color3
    tolerance: number
    center?: Vector2
    flipX?: boolean
}

export class VoxelSprite{
    public metadata: any = {}
    private _root: TransformNode
    get root(): TransformNode{
        return this._root
    }
    get position(): Vector3{
        return this.root.position
    }
    set position(value: Vector3){
        this.root.position = value
    }

    get rotation(): Vector3{
        return this.root.rotation
    }
    set rotation(value: Vector3){
        this.root.rotation = value
    }

    public setEnabled(value: boolean){
        this.root.setEnabled(value)
    }

    private _frames: Map<string, Mesh> = new Map<string, Mesh>()
    private _voxelIdxs: Map<string, number> = new Map<string, number>()
    private _matrices: Map<string, Matrix[]> = new Map<string, Matrix[]>()
    private _colors: Map<string, number[]> = new Map<string, number[]>()
    private _isFirstFrame: boolean = true
    private _currentFrame: string
    private _mat: CustomMaterial

    private _animations: Map<string, VoxelSpriteAnimation> = new Map<string, VoxelSpriteAnimation>()
    private _currentAnimation: string
    public onAnimationDoneObs: Observable<null> = new Observable<null>()

    constructor(public name: string, public baseSize: number, public scene: Scene){
        this._root = new TransformNode(this.name, this.scene)       
    }

    private _parseShape(props: IVoxelSpriteParseProps, target: string){
        const targetMesh = this._frames.get(target)
        if(props.size.x > 0 && props.size.y > 0){
  
            const tempCanvas = document.createElement("canvas")
            tempCanvas.width = props.size.x
            tempCanvas.height = props.size.y
            const ctx = tempCanvas.getContext('2d')
            ctx.drawImage(props.atlas, props.start.x, props.start.y, props.size.x, props.size.y, 0, 0, props.size.x, props.size.y)
            const data = ctx.getImageData(0, 0, props.size.x, props.size.y).data   

            const matrices: Matrix[] = []
            const colors = []

            for(let x = 0; x < props.size.x; x++){
                for(let y = 0; y < props.size.y; y++){
                    var index = (Math.floor(y) * props.size.x + Math.floor(x)) * 4
                    var r = data[index]
                    var g = data[index + 1]
                    var b = data[index + 2]

                    const minR = Math.max((props.discard.r*255) - props.tolerance, 0)
                    const minG = Math.max((props.discard.g*255) - props.tolerance, 0)
                    const minB = Math.max((props.discard.b*255) - props.tolerance, 0)
                    const maxR = Math.min((props.discard.r*255) + props.tolerance, 255)
                    const maxG = Math.min((props.discard.g*255) + props.tolerance, 255)
                    const maxB = Math.min((props.discard.b*255) + props.tolerance, 255)

                    if( (r >= minR && r <= maxR) &&
                        (g >= minG && g <= maxG) &&
                        (b >= minB && b <= maxB)){
                            //discard
                    }else{                    
                        const color = new Color4(r/255, g/255, b/255, 1)
                        const matrix = Matrix.Translation((x - (props.center.x ?? 0)) * this.baseSize * (props.flipX ? -1 : 1), (y - (props.center.y ?? 0)) * -this.baseSize, 0)
                        targetMesh.thinInstanceAdd(matrix) 
                        const voxelIdx = this._voxelIdxs.get(target)
                        targetMesh.thinInstanceSetAttributeAt("color", voxelIdx, [color.r, color.g, color.b, 1.0])                        
                        this._voxelIdxs.set(target, voxelIdx+1) 
                        matrices.push(matrix)
                        colors.push(color.r, color.g, color.b, 1.0)                  
                    } 
                }
            }
            
            this._matrices.set(target, matrices)
            this._colors.set(target, colors)

        }else{   
            targetMesh.dispose()
        }


        if(this._isFirstFrame){
            this._createMat()
            this._isFirstFrame = false
            this._currentFrame = target
        }else{
            targetMesh.setEnabled(false)
        }
        targetMesh.material = this._mat
    }

    private _createMat(){
        const mat = new CustomMaterial(this.name+".Mat", this.scene)
        mat.AddUniform("invertColors", "float", 0)
        mat.AddUniform("tintColor", "vec3", new Vector3(0, 0, 0))
        mat.Fragment_Custom_Diffuse(`
            if(invertColors > 0.5 ){
                baseColor.rgb = vec3(1.0) - baseColor.rgb;
            }
            baseColor.rgb += tintColor;
        `)
        mat.emissiveColor = new Color3(0.25, 0.25, 0.25) 
        this._mat = mat
    }

    public addFrame(name: string, props: IVoxelSpriteParseProps){
        if(this._frames.get(name)){
            return
        }
        const mesh = MeshBuilder.CreateBox(this.name+"."+name, {size: this.baseSize}, this.scene)
        mesh.parent = this._root
        mesh.thinInstanceRegisterAttribute("color", 4)
        this._frames.set(name, mesh)
        this._voxelIdxs.set(name, 0)
        this._parseShape(props, name)
    }

    public changeFrame(frameName: string){
        const frame = this._frames.get(frameName)
        if(this._currentFrame != frameName && frame){      
            this._frames.get(this._currentFrame).setEnabled(false)
            frame.setEnabled(true)
            this._currentFrame = frameName
        }
    }

    public addAnimation(props: IVoxelSpriteAnimationProps){
        if(!this._animations.get(props.name)){
            const animation = new VoxelSpriteAnimation(props.name, props.duration, props.mode, props.frames, this)
            this._animations.set(props.name, animation)
        }
    }

    public playAnimation(name: string, startTime: number = 0){
        const animation = this._animations.get(name)
        if(this._currentAnimation != name && animation){
            this._currentAnimation = name
            animation.start(startTime)
        }
    }
    public getCurrentAnimationTime(): number{
        return this._animations.get(this._currentAnimation).time
    }
    public stopAnimation(gotoFrame?: string){
        const animation = this._animations.get(this._currentAnimation)
        if(animation){
            animation.stop()
            this._currentAnimation = null
            if(gotoFrame !== undefined){
                this.changeFrame(gotoFrame)
            }
        }
    }

    public clone(name: string): VoxelSprite{
        const sprite = new VoxelSprite(name, this.baseSize, this.scene)
        const frames = Array.from(this._frames, ([name, value]) => ({ name, value }))
        sprite._createMat()
        frames.forEach((frame, index)=>{
            if(index == 0){
                sprite._currentFrame = frame.name
            }
            sprite._frames.set(frame.name, frame.value.clone(frame.name, sprite.root, true, false))
            if(this._frames.get(frame.name).isDisposed()){
                sprite._frames.get(frame.name).dispose()
            }else{
                const oldFrameMats = this._matrices.get(frame.name)  
                const oldFrameColors = this._colors.get(frame.name) 
                const newFrame = sprite._frames.get(frame.name)
                newFrame.material = sprite._mat
                newFrame.thinInstanceAdd(oldFrameMats)
                newFrame.thinInstanceSetAttributeAt("color", 0, oldFrameColors)
            }
        })
        const voxelIdxs = Array.from(this._voxelIdxs, ([name, value]) => ({ name, value }))
        voxelIdxs.forEach(idx =>{
            sprite._voxelIdxs.set(idx.name, idx.value)
        })
        const matrices = Array.from(this._matrices, ([name, value]) => ({ name, value }))
        matrices.forEach(idx =>{
            sprite._matrices.set(idx.name, idx.value)
        })
        const colors = Array.from(this._colors, ([name, value]) => ({ name, value }))
        colors.forEach(idx =>{
            sprite._colors.set(idx.name, idx.value)
        })

        this._animations.forEach(animation=>{
            const _animation = animation.clone(sprite)
            sprite._animations.set(animation.name, _animation)
        })

        sprite.metadata = {...this.metadata}

        return sprite
    }

    private _updateObs: Observer<Scene>
    public addOnUpdate(callback: (self)=> void){
        if(!this._updateObs){
            this._updateObs = this.scene.onBeforeRenderObservable.add(()=>{
                callback(self)
            })
        }
    }
    public removeOnUpdate(){
        if(this._updateObs){
            this.scene.onBeforeRenderObservable.remove(this._updateObs)
        }
    }

    public dispose(){
        this.removeOnUpdate()
        this.root.dispose()        
    }

    private _flashObs: Observer<Scene> = null
    private _stopFlashObs(onDone?: ()=>void){
        if(this._flashObs){
            
            this._mat.onBindObservable.addOnce(()=>{
                this._mat.getEffect().setColor3("tintColor", Color3.Black())
            })

            this.scene.onBeforeRenderObservable.remove(this._flashObs)
            if(onDone){
                onDone()
            }
        }
    }

    public flashTintColor(color: Vector3, duration: number, speed: number, onDone?: ()=>void){
        this._stopFlashObs()
        const start = performance.now()
        const startColor = Vector3.Zero()
        duration = duration * 1000
        this._flashObs = this.scene.onBeforeRenderObservable.add(()=>{
            const t = (performance.now() - start) / duration
            if(t >= 1){
                this._stopFlashObs(onDone)
                this.metadata.tintColor = startColor
            }else{                
                const r = startColor.x + (color.x - startColor.x) * Math.sin(t * Math.PI * speed)
                const g = startColor.y + (color.y - startColor.y) * Math.sin(t * Math.PI * speed)
                const b = startColor.z + (color.z - startColor.z) * Math.sin(t * Math.PI * speed)
                this.metadata.tintColor = new Vector3(r, g, b)
                this._mat.onBindObservable.addOnce(()=>{
                    this._mat.getEffect().setVector3("tintColor", this.metadata.tintColor)
                })                
            }
        })
    }
    
}

