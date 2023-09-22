#version 300 es

layout(location=0) in vec4 aVertex;

out vec2 vUv;

void main() {
    vUv = (aVertex.xy + 1.) / 2.;
    gl_Position = aVertex;
}
