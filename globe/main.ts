// import { Renderer } from './rendererWebGL2';
import { GlobeControls } from './controls';
import { cartography } from './mathUtils';

console.log('hel', cartography.latLonAltToECEF(60, 24, 0))

class Globe {
    private canvas: HTMLCanvasElement | null;
    private controls: GlobeControls;
    // private renderer: Renderer;

    static async create(): Promise<Globe> {
        const globe = new Globe();
        await globe.initialize();
        return globe;
    }

    private constructor() {
        this.canvas = null;
        this.controls = {} as GlobeControls;
        // this.renderer = {} as Renderer;
    }

    private async initialize(): Promise<void> {
        this.canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        if (!this.canvas) {
            throw new Error('Canvas element not found!');
        }

        this.controls = new GlobeControls(this.canvas);
        // this.renderer = new Renderer(this.canvas, this.controls);
        // await this.renderer.initRenderer();
    }

    mainLoop(): void {
        // this.renderer.drawScene();
        requestAnimationFrame(() => this.mainLoop());
    }
}

Globe.create().then(globe => {
    globe.mainLoop();
}).catch(err => {
    console.error('Error in global catch:', err);
});
