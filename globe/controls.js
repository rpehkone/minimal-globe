export class GlobeControls {
    constructor(canvas) {
        this.canvas = canvas
        this.userYaw = 0.0
        this.userPitch = 0.0
        this.userZoom = 2.0

        this.isDragging = false
        this.prevX = 0
        this.prevY = 0

        this.#attachEventListeners()
    }

    #attachEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e))
        this.canvas.addEventListener('wheel', (e) => this.handleScroll(e))
    }

    handleScroll(e) {
        let scrollSpeed = 0.001
        let zoomIntensity = e.deltaY * scrollSpeed
        let exponentialFactor = 1.5
        let newZoom = this.userZoom * Math.pow(zoomIntensity + 1.0, exponentialFactor);
        newZoom = clamp(newZoom, 0.0, 400000.0)

        let mouseX = e.pageX - this.userYaw
        let mouseY = e.pageY - this.userPitch
        mouseX = mouseX * -1.0
        mouseY = mouseY * -1.0

        // this.userYaw = (mouseX * newZoom / this.userZoom) + this.userYaw - mouseX;
        // this.userPitch = (mouseY * newZoom / this.userZoom) + this.userPitch - mouseY;
        this.userZoom = newZoom;
    }

    handleMouseDown(e) {
        this.isDragging = true
        this.prevX = e.pageX
        this.prevY = e.pageY
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.pageX - this.prevX
            const deltaY = e.pageY - this.prevY

            let spinScale = 0.5
            this.userYaw += deltaX * (this.userZoom * spinScale)
            this.userPitch += deltaY * (this.userZoom * spinScale)

            this.prevX = e.pageX
            this.prevY = e.pageY
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false
        }
    }
}
