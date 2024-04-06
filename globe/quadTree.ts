export class MapQuadTreeNode {
    //TODO #minDepth so now lower res than this is shown (but textures can be lower)
    #octreeMaxDepth = 4; //starts from 0
    // #octreeMaxDepth = 6; //starts from 0

    private renderer: any;
    public z: number;
    public x: number;
    public y: number;
    public isRight: number;
    public isDown: number;
    public children: (MapQuadTreeNode | null)[];
    public img: any | null;
    public squareMesh: any | null;
    public imageUrl: string;

    constructor(renderer: any, z = 0, x = 0, y = 0, isRight = 0, isDown = 0) {
        this.renderer = renderer;
        this.z = z;
        this.x = x;
        this.y = y;
        this.isRight = isRight;
        this.isDown = isDown;
        this.children = [null, null, null, null];
        this.img = null;
        this.squareMesh = null;
        // this.imageUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        this.imageUrl = `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}.png`;

        this.#initVertices();
        this.#addChildNodes();
    }

    #initVertices(): void {
        const webmercatorVerts = cartography.getTileCorners(this.z, this.x, this.y);

        this.squareMesh = this.renderer.addMapTile(
            this.imageUrl,
            cartography.latLonAltToECEF(webmercatorVerts.lowerLeft.lat, webmercatorVerts.lowerLeft.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.lowerRight.lat, webmercatorVerts.lowerRight.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.upperLeft.lat, webmercatorVerts.upperLeft.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.upperRight.lat, webmercatorVerts.upperRight.lon, 0.0),
        );
    }

    #addChildNodes(): void {
        const tiles = [
            { x: 0, y: 0 }, // Top-left
            { x: 1, y: 0 }, // Top-right
            { x: 0, y: 1 }, // Bottom-left
            { x: 1, y: 1 }  // Bottom-right
        ];

        if (this.z + 1 <= this.#octreeMaxDepth) {
            for (let i = 0; i < 4; i++) {
                if (this.children[i] == null) {
                    const newX = 2 * this.x + tiles[i].x;
                    const newY = 2 * this.y + tiles[i].y;
                    this.children[i] = new MapQuadTreeNode(this.renderer, this.z + 1, newX, newY, tiles[i].x, tiles[i].y);
                }
            }
        }
    }

    #deleteChildNodes(): void {
        // Implement deletion logic here
    }

    renderQuadTree(): void {
        //TODO del
        if (this.z == this.#octreeMaxDepth) {
            this.renderer.drawSquareMesh(this.squareMesh);
        }
        //TODO if all children have textures dont render this
        //else render this and not children

        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i]!.renderQuadTree();
            }
        }
    }

    update(mapX: number, mapY: number, mapZ: number): void {
        // Implement update logic here, including conditions for adding or deleting child nodes

        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i]!.update(mapX, mapY, mapZ);
            }
        }
    }
}
