
import { Color3, Color4, Matrix, Vector3 } from "@babylonjs/core/Maths/math"
import { Mesh } from "@babylonjs/core/Meshes/mesh"
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder"
import { Scene } from "@babylonjs/core/scene"
import { CustomMaterial } from "@babylonjs/materials/custom/customMaterial"
import { Game, GameStates } from "../../game"

export class VoxelSpaceBackground{
    private _baseCube: Mesh
    private _colors: Color4[] = [
        new Color4(0.97, 0.45, 0.45),
        new Color4(0.85, 0.84, 0.54),
        new Color4(0.51, 0.67, 0.51),
        new Color4(0.22, 0.44, 0.46),
        new Color4(0.3, 0.35, 0.58),
        new Color4(0.56, 0.27, 0.59),
        new Color4(0.85, 0.85, 0.85),
    ]

    private _getRandomColor(): Color4{
        return this._colors[Math.floor(Math.random() * this._colors.length)]
    }
    constructor(private _scene: Scene){
        const blockSize = 0.04
        this._baseCube = MeshBuilder.CreateBox("star", {size: blockSize}, this._scene)
        this._baseCube.thinInstanceRegisterAttribute("color", 4)     
        this._baseCube.thinInstanceRegisterAttribute("instanceIdx", 1) 
        
        const mat = new CustomMaterial('starMat', this._scene)
        this._baseCube.visibility = 0.99
        mat.AddUniform('time', 'float', 0)
        mat.AddAttribute('instanceIdx')
        mat.Vertex_Definitions(
            `
            varying float vFlicker;
            `
        )

        mat.Vertex_MainEnd(`
            vColor=vec4(1.0);
            vColor.rgb *= instanceColor.rgb;
            vFlicker = sin((time + (instanceColor.a * 100.0)) * 2.0) * 0.5 + 0.5;
            
        `)

        mat.Fragment_Definitions(`
            varying float vFlicker;
        `)

        mat.Fragment_Before_FragColor(`
            color.a = vFlicker;
        `)

        this._baseCube.material = mat  
        let time = 0
        mat.onBindObservable.add(()=>{
            time += Game.Delta
            const effect = mat.getEffect()            
            effect.setFloat('time', time)
        })

        mat.emissiveColor = new Color3(0.6, 0.6, 0.6)

        const blocks: {matrix: Matrix, offset: number}[] = [] 
        const blockCount = 600
        const offsetSize = new Vector3(30, 40, 40)
        const yBaseStart = 60
        const yDeath = -30
        const zOffestBase = 3
        for(let i = 0; i < blockCount; i++){
            const yOffset = ((Math.random() * 2 - 1) * offsetSize.y)
            const matrix = Matrix.Translation(
               (Math.random() * 2 - 1) * offsetSize.x,
               yOffset,
               (Math.random() * offsetSize.z) + zOffestBase
            )
            blocks.push({matrix, offset: yOffset})
        }
        const colors = []
        for(let i = 0; i < blockCount; i++){
            const color = this._getRandomColor()
            colors.push(color.r, color.g, color.b, i)        
        }
        this._baseCube.thinInstanceAdd(blocks.map((v)=>v.matrix), false)
        this._baseCube.thinInstanceSetAttributeAt("color", 0, colors, true)             
      
        const updateObs = this._scene.onBeforeRenderObservable.add(()=>{            
            if(Game.GameState == GameStates.Playing || Game.GameState == GameStates.BetweenLevels){         
                const delta = Game.Delta
                const speed = 3 * delta
                blocks.forEach((block, i)=>{
                    block.offset -= speed               
                    if(block.offset < yDeath){
                        block.offset = yBaseStart +  ((Math.random() * 2 - 1) * (offsetSize.y * 0.25))
                        block.matrix.setTranslationFromFloats(
                            (Math.random() * 2 - 1) * offsetSize.x,
                            block.offset,
                            (Math.random() * offsetSize.z) + zOffestBase
                        )
                    }else{
                        block.matrix.addTranslationFromFloats(
                            0, -speed, 0
                        )
                    }
                    this._baseCube.thinInstanceSetMatrixAt(i, block.matrix, (i === blocks.length - 1)? true : false)
                })
            }
        })
    }
}