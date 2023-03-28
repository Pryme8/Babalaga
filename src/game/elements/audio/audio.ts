import { Sound } from "@babylonjs/core/Audio/sound";
import { Observable, Observer } from "@babylonjs/core/Misc/observable";
import { Scene } from "@babylonjs/core/scene";

export class AudioCache{
    public static CoinDrop: Sound
    public static GameStart: Sound
    public static PlayerShoot: Sound
    public static EnemyDeath: Sound
    public static EnemyDropping: Sound
}

interface AudioPreparationProps{
    name: string
    path: string
    baseVolume: number
}

export class AudioManager{
    public static Instance: AudioManager
    private _currentSounds: Sound[] = []
    private _onEndObservable: Observer<Sound>

    public static OnAllSoundsLoaded: Observable<null> = new Observable<null>()

    public static Initialize(scene: Scene, channels: number = 1){
        new AudioManager(scene, channels)
        
    }

    constructor(private _scene: Scene, private _channels: number = 1){   
        AudioManager.Instance = this
        for(let i = 0; i < _channels; i++){
            this._currentSounds.push(null)
        }
        const prepList = [
            {name: "CoinDrop", path: "assets/audio/CoinDrop.wav", baseVolume: 0.5},
            {name: "GameStart", path: "assets/audio/GameStart.wav", baseVolume: 0.5},
            {name: "PlayerShoot", path: "assets/audio/PlayerShoot.wav", baseVolume: 0.5},
            {name: "EnemyDeath", path: "assets/audio/EnemyDeath.wav", baseVolume: 0.5},
            {name: "EnemyDropping", path: "assets/audio/EnemyDropping.wav", baseVolume: 0.5},
        ]
        AudioManager.OnAllSoundsLoaded.addOnce(()=>{
            console.log("All sounds loaded")
        })
        this._prepareAudio(prepList)
    }

    private _prepareAudio(prepList: AudioPreparationProps[]){ 
    
        const soundMap = prepList.map(() => null) 
        
        const _checkDone = ()=>{    
            for(let i = 0; i < soundMap.length; i++){
                if(!soundMap[i]){
                    return false
                }
            }
            return true
        }
        
        for(let i = 0; i < prepList.length; i++){
            const props = prepList[i]
            const sound = new Sound(props.name.toLowerCase(), props.path, this._scene, ()=>{
                soundMap[i] = true
                if(_checkDone()){
                    AudioManager.OnAllSoundsLoaded.notifyObservers(null)
                }
            }, {loop: false, autoplay: false, volume: props.baseVolume})
            AudioCache[props.name] = sound
        }       
    }

    public playOneShotThen(sound: Sound, callback?: () => void, channel: number = 0){
        if(channel >= this._channels){
            return
        }
        if(sound == this._currentSounds[channel] && sound.isPlaying){
            const duration = sound.currentTime / this._currentSounds[channel].getSoundSource().buffer.duration
            if(duration < 0.25){
                return
            }
        }
        if(this._currentSounds[channel]){
            this._currentSounds[channel].onended = null
            this._currentSounds[channel].stop()
        }
        this._currentSounds[channel]= sound
        this._currentSounds[channel].play(0, 0)
        this._currentSounds[channel].onended = ()=>{
            this._currentSounds[channel] = null
            if(callback){
                callback()
            } 
        }        
    }
    public static PlayOneShotThen(sound: Sound, callback?: () => void, channel: number = 0){
        AudioManager.Instance.playOneShotThen(sound, callback, channel)
    }
}

