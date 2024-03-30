export class Renderer {
    canvas = null
    gl = null
    #initialized = false
    #anistropicExtensions
    #shaderProgram
    #positionLocation
    #texcoordLocation
    #positionBuffer
    #texcoordBuffer
    #texture

    constructor(getCanvas) {
        this.canvas = getCanvas
        this.gl = this.canvas.getContext('webgl2', { antialias: true });
        this.drawScene = this.drawScene.bind(this);

        if (!this.gl) {
            console.error('WebGL not supported');
            throw 'WebGL not supported';
        }
        this.#anistropicExtensions = this.gl.getExtension('EXT_texture_filter_anisotropic') || this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
    }

    async fileToString(filename) {
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

    compileShader(source, type) {
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

    async initShaderProgram() {
        var vsSource = await this.fileToString(window.location.href + 'globe/texture_vertex.glsl')
        var fsSource = await this.fileToString(window.location.href + 'globe/texture_frag.glsl')

        const vertexShader = this.compileShader(vsSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fsSource, this.gl.FRAGMENT_SHADER);
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

    setupTextureFilteringAndMipmaps(textureWidth, textureHeight) {
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

    async initRenderer() {
        this.#shaderProgram = await this.initShaderProgram();
        this.#positionLocation = this.gl.getAttribLocation(this.#shaderProgram, "aVertexPosition");
        this.#texcoordLocation = this.gl.getAttribLocation(this.#shaderProgram, "aTextureCoord");
        this.#positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);

        const positions = [
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0,  1.0, 0.0,
            -1.0,  1.0, 0.0,
            1.0, -1.0, 0.0,
            1.0,  1.0, 0.0,
        ];
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

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

        this.#texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#texture);

        const image = new Image();
        image.crossOrigin = 'anonymous'
        image.src = 'https://tile.openstreetmap.org/0/0/0.png'
        // image.src = 'https://tile.openstreetmap.org/${z}/${x}/${y}.png'
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.#texture);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            
            const level = 0;
            const internalFormat = this.gl.RGBA;
            const border = 0;
            const format = this.gl.RGBA;
            const type = this.gl.UNSIGNED_BYTE;
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, image.width, image.height,
                            border, format, type, image);

            this.setupTextureFilteringAndMipmaps(image.naturalWidth, image.naturalWidth);
            this.#initialized = true
        };
    }

    drawScene() {
        if (!this.#initialized) {
            requestAnimationFrame(this.drawScene);
            return
        }
        var projectionMatrix = mat4.create();
        var modelViewMatrix = mat4.create();

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.useProgram(this.#shaderProgram);

        this.gl.enableVertexAttribArray(this.#positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
        this.gl.vertexAttribPointer(this.#positionLocation, 3, this.gl.FLOAT, false, 0, 0);

        this.gl.enableVertexAttribArray(this.#texcoordLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#texcoordBuffer);
        this.gl.vertexAttribPointer(this.#texcoordLocation, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, 'uProjectionMatrix'),
            false,
            projectionMatrix
        );
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.#shaderProgram, 'uModelViewMatrix'),
            false,
            modelViewMatrix
        );

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#texture);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        requestAnimationFrame(this.drawScene);
    }
}
