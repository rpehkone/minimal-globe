export class MapQuadTreeNode {
    #octreeMaxDepth = 5//starts from 0
    #imageWidth = 500

    constructor(renderer, z=0, x=0, y=0, isRight=0, isDown=0) {
        this.renderer = renderer
        this.z = z
        this.x = x
        this.y = y
        this.isRight = isRight
        this.isDown = isDown
        this.children = [null, null, null, null]
        this.img = null
        this.squareMesh = null
        this.imageUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`

        this.#initVertices()
        this.#addChildNodes()
    }

    #initVertices() {
        var webmercatorVerts = cartography.getTileCorners(this.z, this.x, this.y)

        console.log('verts', webmercatorVerts)
        console.log('ecef', cartography.latLonAltToECEF(webmercatorVerts.upperLeft.lat, webmercatorVerts.upperLeft.lon, 0.0))

        this.squareMesh = this.renderer.addMapTile(
            this.imageUrl,
            cartography.latLonAltToECEF(webmercatorVerts.lowerLeft.lat, webmercatorVerts.lowerLeft.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.lowerRight.lat, webmercatorVerts.lowerRight.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.upperLeft.lat, webmercatorVerts.upperLeft.lon, 0.0),
            cartography.latLonAltToECEF(webmercatorVerts.upperRight.lat, webmercatorVerts.upperRight.lon, 0.0),
        )
    }

    #addChildNodes() {
        const tiles = [
            { x: 0, y: 0 }, // Top-left
            { x: 1, y: 0 }, // Top-right
            { x: 0, y: 1 }, // Bottom-left
            { x: 1, y: 1 }  // Bottom-right
        ];

        if (this.z + 1 <= this.#octreeMaxDepth) {
            for (let i = 0; i < 4; i++) {
                if (this.children[i] == null) {
                    const newX = 2 * this.x + tiles[i].x
                    const newY = 2 * this.y + tiles[i].y
                    this.children[i] = new MapQuadTreeNode(this.renderer, this.z + 1, newX, newY, tiles[i].x, tiles[i].y)
                }
            }
        }
    }

    #deleteChildNodes() {
    }

    renderQuadTree() {
        if (this.z == this.#octreeMaxDepth) {
            this.renderer.drawSquareMesh(this.squareMesh)
        }
        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i].renderQuadTree()
            }
        }
    }

    update(mapX, mapY, mapZ) {
        // if (some condition) {
        //     this.addChildNodes()
        // } else {
        //     this.deleteChildNodes()
        // }

        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i].update(posX, posY, mapZ)
            }
        }
    }
}
