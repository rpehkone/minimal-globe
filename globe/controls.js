export class GlobeControls {
    constructor() {
    }

    attachEventListeners() {
        this.fullscreenCapture.addEventListener('mousedown', (e) => this.handleMouseDown(e))
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e))
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e))
        document.addEventListener('wheel', (e) => this.handleScroll(e))
    }

    handleScroll(e) {
        let scrollSpeed = 0.001
        let zoomIntensity = e.deltaY * scrollSpeed
        let exponentialFactor = 2
        let newZoom = this.mapZ * Math.pow(1 - zoomIntensity, exponentialFactor);
        newZoom = this.clamp(newZoom, 1.0, 400000.0)

        let mouseX = e.pageX - this.mapX
        let mouseY = e.pageY - this.mapY
        mouseX = mouseX * -1.0
        mouseY = mouseY * -1.0

        this.mapX = (mouseX * newZoom / this.mapZ) + this.mapX - mouseX;
        this.mapY = (mouseY * newZoom / this.mapZ) + this.mapY - mouseY;
        this.mapZ = newZoom;

        this.updateMapState();
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

            this.mapX += deltaX
            this.mapY += deltaY

            this.prevX = e.pageX
            this.prevY = e.pageY
            this.updateMapState()
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false
        }
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
}