precision mediump float;


uniform sampler2D u_image;// наша текстура
varying vec2 v_texCoord; // texCoords, переданные из вершинного шейдера

void main(){
    gl_FragColor = texture2D(u_image, v_texCoord);
}