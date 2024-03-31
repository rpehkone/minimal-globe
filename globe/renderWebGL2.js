class SquareMesh {
    gl;
    #textureID
    #anistropicExtensions
    #positionBuffer;
    #vertices;

    /**
     * @param {WebGL2RenderingContext} gl The WebGL2 rendering context.
     */
    constructor(gl, textureURL, corner1, corner2, corner3, corner4) {
        this.gl = gl;
        this.#vertices = this.#createVertices(corner1, corner2, corner3, corner4);
        this.#setupBuffers();

        this.#anistropicExtensions = this.gl.getExtension('EXT_texture_filter_anisotropic') || this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        this.#setupTexture(textureURL)
    }

    bind() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);
    }

    #createVertices(corner1, corner2, corner3, corner4) {
        return new Float32Array([
            ...corner1, ...corner2, ...corner3, // first triangle
            ...corner3, ...corner2, ...corner4  // second triangle
        ]);
    }

    #setupBuffers() {
        this.#positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.#vertices, this.gl.STATIC_DRAW);
    }

    #setupTexture(textureURL) {
        this.#textureID = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);
        const image = new Image();
        image.src = textureURL
        image.crossOrigin = 'anonymous'
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            
            const level = 0;
            const internalFormat = this.gl.RGBA;
            const border = 0;
            const format = this.gl.RGBA;
            const type = this.gl.UNSIGNED_BYTE;
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, image.width, image.height,
                            border, format, type, image);

            this.#setupTextureFilteringAndMipmaps(image.naturalWidth, image.naturalWidth);
        };
    }

    #setupTextureFilteringAndMipmaps(textureWidth, textureHeight) {
        function isPowerOfTwo(x) {
            return (x & (x - 1)) === 0;
        }

        if (isPowerOfTwo(textureWidth) && isPowerOfTwo(textureHeight)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        if (this.#anistropicExtensions){
            var max = this.gl.getParameter(this.#anistropicExtensions.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.#anistropicExtensions.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
    }
}

export class Renderer {
    canvas = null
    gl = null
    #shaderProgram
    #positionLocation
    #texcoordLocation
    #texcoordBuffer
    #startTimeMs

    constructor(getCanvas) {
        this.canvas = getCanvas
        this.gl = this.canvas.getContext('webgl2', { antialias: true });
        this.drawScene = this.drawScene.bind(this);
        this.#startTimeMs = Date.now()

        if (!this.gl) {
            console.error('WebGL not supported');
            throw 'WebGL not supported';
        }
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth * 1, this.gl.drawingBufferHeight * 1);
    }

    addMapTile(textureURL, corner1, corner2, corner3, corner4) {
        return new SquareMesh(this.gl, textureURL, corner1, corner2, corner3, corner4);
    }

    async initRenderer() {
        this.#shaderProgram = await this.#initShaderProgram();
        this.#positionLocation = this.gl.getAttribLocation(this.#shaderProgram, "aVertexPosition");
        this.#texcoordLocation = this.gl.getAttribLocation(this.#shaderProgram, "aTextureCoord");

        this.#texcoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#texcoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0.0, 1.0,
            1.0, 1.0,
            0.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            1.0, 0.0,
        ]), this.gl.STATIC_DRAW);

        var corner1 = vec3.fromValues(-1.0, -1.0, 0.0);
        var corner2 = vec3.fromValues(1.0, -1.0, 0.0);
        var corner3 = vec3.fromValues(-1.0, 1.0, 0.0);
        var corner4 = vec3.fromValues(1.0, 1.0, 0.0);
        this.square1 = new SquareMesh(this.gl, 
            'https://tile.openstreetmap.org/0/0/0.png',
            //'https://tile.openstreetmap.org/${z}/${x}/${y}.png',
            corner1, corner2, corner3, corner4);
    }

    async #fileToString(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.text();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            throw error;
        }
    }

    #compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    async #initShaderProgram() {
        var vsSource = await this.#fileToString(window.location.href + 'globe/texture_vertex.glsl')
        var fsSource = await this.#fileToString(window.location.href + 'globe/texture_frag.glsl')

        const vertexShader = this.#compileShader(vsSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.#compileShader(fsSource, this.gl.FRAGMENT_SHADER);
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    #drawSquareMesh(square, modelMatrix, viewMatrix, projectionMatrix) {
        this.gl.useProgram(this.#shaderProgram);

        this.gl.enableVertexAttribArray(this.#positionLocation);
        square.bind()
        this.gl.vertexAttribPointer(this.#positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.enableVertexAttribArray(this.#texcoordLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#texcoordBuffer);
        this.gl.vertexAttribPointer(this.#texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, 'uModelMatrix'),
            false,
            modelMatrix
        );

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, 'uViewMatrix'),
            false,
            viewMatrix
        );

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, 'uProjectionMatrix'),
            false,
            projectionMatrix
        );

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    resizeCanvasToDisplaySize() {
        const width = this.canvas.clientWidth * window.devicePixelRatio;
        const height = this.canvas.clientHeight * window.devicePixelRatio;

        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
            return true;
        }

        return false;
    }


    drawScene() {
        if (this.resizeCanvasToDisplaySize()) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        var modelMatrix = mat4.create();
        // let dtSec = (Date.now() - this.#startTimeMs) / 1000
        // let spinDurationSec = 4
        // let progress = fmod(dtSec, spinDurationSec) / spinDurationSec
        // let rotYRad = degToRad(360 * progress);
        // mat4.rotate(modelMatrix, modelMatrix, rotYRad, [0, 1, 0]);


        var viewMatrix = mat4.create();
        const translation = vec3.fromValues(0, 0, -2);
        mat4.translate(viewMatrix, viewMatrix, translation);


        var projectionMatrix = mat4.create();
        const fovy = degToRad(90)
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const near = 0.1;
        const far = 1000;
        mat4.perspective(projectionMatrix, fovy, aspect, near, far);

        this.#drawSquareMesh(this.square1, modelMatrix, viewMatrix, projectionMatrix)
        requestAnimationFrame(this.drawScene);
    }
}
