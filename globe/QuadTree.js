class MapQuadTreeNode {
    #octreeMaxDepth = 19
    #imageWidth = 500

    constructor(z, x, y, isRight, isDown) {
        this.z = z
        this.x = x
        this.y = y
        this.isRight = isRight
        this.isDown = isDown
        this.img = null
        this.children = [null, null, null, null]

        const imageUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
        // const imageUrl = `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}.png`
        this.addImageToPage(imageUrl)
    }

    addChildNodes() {
        const tiles = [
            { x: 0, y: 0 },     // Top-left
            { x: 1, y: 0 },     // Top-right
            { x: 0, y: 1 },     // Bottom-left
            { x: 1, y: 1 }      // Bottom-right
        ];

        if (this.z + 1 <= this.#octreeMaxDepth) {
            for (let i = 0; i < 4; i++) {
                if (this.children[i] == null) {
                    const newX = 2 * this.x + tiles[i].x
                    const newY = 2 * this.y + tiles[i].y
                    this.children[i] = new MapQuadTreeNode(this.z + 1, newX, newY, tiles[i].x, tiles[i].y)
                }
            }
        }
    }

    deleteChildNodes() {
    }

    isImageOnScreen(imgPosX, imgPosY, imgWidth, imgHeight) {
        const imgRightEdge = imgPosX + imgWidth;
        const imgBottomEdge = imgPosY + imgHeight;
        const isVisibleHorizontally = imgRightEdge > 0 && imgPosX < window.innerWidth;
        const isVisibleVertically = imgBottomEdge > 0 && imgPosY < window.innerHeight;
        return isVisibleHorizontally && isVisibleVertically;
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

    addImageToPage(imageUrl) {
        this.img = document.createElement('img')

        this.img.src = imageUrl
        this.img.width = this.#imageWidth
        this.img.addEventListener('contextmenu', function (e) {
            e.preventDefault()
        });
        this.img.style.position = 'absolute'
        this.img.style.userSelect = 'none'
        this.img.style.border = '1px solid #a61603'

        const container = document.getElementById('contain')
        container.appendChild(this.img)
    }
}
