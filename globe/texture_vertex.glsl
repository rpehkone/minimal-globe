attribute highp vec2 aTextureCoord;
uniform highp mat4 uProjectionMatrix;
uniform highp mat4 uModelViewMatrix;

varying highp vec2 vTextureCoord;
void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
}
