// import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
// import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent 
import { Game } from "./game"

class App {    
    public game: Game    
    constructor() {
        this.game = new Game()
    }
}
new App()