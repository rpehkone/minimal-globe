import { Renderer } from './renderWebGL2.js';

class Globe {
    static async create() {
        const globe = new Globe();
        await globe.initialize();
        return globe;
    }

    async initialize() {
        this.canvas = document.getElementById('renderCanvas');

        this.renderer = new Renderer(this.canvas)
        await this.renderer.initRenderer();

        this.renderer.drawScene();
    }
}

Globe.create().then(() => {
    console.log("Globe initialized successfully.");
}).catch(err => {
    console.error('Error in global catch:', err);
});
