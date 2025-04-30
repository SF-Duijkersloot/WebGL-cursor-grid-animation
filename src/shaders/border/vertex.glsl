// vertex.glsl
attribute vec3 instanceOffset;
attribute float instanceHover;

varying vec2 vUv;
varying float vHover;

void main() {
  vUv = uv;
  vHover = instanceHover;
  vec3 pos = position + instanceOffset;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}
