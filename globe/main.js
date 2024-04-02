import { Renderer } from './rendererWebGL2.js';
import { GlobeControls } from './controls.js'

class Globe {
    static async create() {
        const globe = new Globe();
        await globe.initialize();
        return globe;
    }

    async initialize() {
        this.canvas = document.getElementById('renderCanvas');

        this.controls = new GlobeControls(this.canvas)
        this.renderer = new Renderer(this.canvas, this.controls)
        await this.renderer.initRenderer();

    }

    mainLoop() {
        this.renderer.drawScene();
        requestAnimationFrame(this.mainLoop.bind(this));
    }
}

Globe.create().then(globe => {
    globe.mainLoop();
}).catch(err => {
    console.error('Error in global catch:', err);
});
