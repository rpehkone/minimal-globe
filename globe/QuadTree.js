export class MapQuadTreeNode {
    #octreeMaxDepth = 3
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

        this.initVertices()
    }

    initVertices() {
        var corner1 = vec3.fromValues(-1.0, -1.0, 0.0);
        var corner2 = vec3.fromValues(1.0, -1.0, 0.0);
        var corner3 = vec3.fromValues(-1.0, 1.0, 0.0);
        var corner4 = vec3.fromValues(1.0, 1.0, 0.0);
        this.squareMesh = this.renderer.addMapTile(
            'https://tile.openstreetmap.org/0/0/0.png',
            corner1,
            corner2,
            corner3,
            corner4
        )
    }

    addChildNodes() {
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

    deleteChildNodes() {
    }

    renderQuadTree() {
        this.renderer.drawSquareMesh(this.squareMesh)
        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i].render()
            }
        }
    }

    update(mapX, mapY, mapZ) {
        let imgWidth = this.#imageWidth * mapZ
        if (this.z) {
            imgWidth /= Math.pow(2, this.z)
        }

        let posX = this.isRight ? mapX + imgWidth : mapX
        let posY = this.isDown ? mapY + imgWidth : mapY

        if (this.img) {
            this.img.width = imgWidth
            this.img.style.left = `${posX}px`
            this.img.style.top = `${posY}px`

            let minSize = Math.min(window.innerWidth, window.innerHeight)
            let sizeOnScreen = imgWidth / minSize
            if (sizeOnScreen > 0.5 && this.isImageOnScreen(posX, posY, imgWidth, imgWidth)) {
                this.addChildNodes()
            } else {
                this.deleteChildNodes()
            }
        }

        for (let i = 0; i < 4; i++) {
            if (this.children[i]) {
                this.children[i].update(posX, posY, mapZ)
            }
        }
    }
}
