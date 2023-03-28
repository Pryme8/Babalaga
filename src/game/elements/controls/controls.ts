import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents"
import { Scene } from "@babylonjs/core/scene"

export class Controls{
    public static Instance: Controls
    private _map = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        ArrowDown: false,
        " ": false,
        Space: false
    }
    public static get Map():any{
        return Controls.Instance._map
    }
    constructor(scene: Scene){
        Controls.Instance = this
        scene.onKeyboardObservable.add((eventData)=>{
            switch(eventData.type){
                case KeyboardEventTypes.KEYDOWN: 
                    if(this._map[eventData.event.key] !== undefined){
                        this._map[eventData.event.key] = true
                    }
                break;
                case KeyboardEventTypes.KEYUP: 
                    if(this._map[eventData.event.key] !== undefined){
                        this._map[eventData.event.key] = false
                    }
                break;
            }
            this._map.Space = this._map[" "]
        })
    }
}   