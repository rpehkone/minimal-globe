varying highp vec2 vTextureCoord;
uniform highp sampler2D uSampler;
void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
}
