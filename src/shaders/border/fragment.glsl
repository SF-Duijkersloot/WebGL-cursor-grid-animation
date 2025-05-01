precision highp float;

uniform vec3  fillColor;
uniform vec3  borderColor;
uniform vec3  highlightColor;
uniform float borderWidthPx;
uniform float cols;
uniform vec2  resolution;

uniform float shadowZone;
uniform float shadowIntensity;
uniform vec3  shadowColor;

varying vec2  vUv;
varying float vHover;

void main() {
    // 1) Bereken rand‐dikte in UV‐eenheden
    float cellPx = resolution.x / cols;
    float bw     = borderWidthPx / cellPx;

    // 2) anti-alias factor (in UV-ruimtes)
    float aa = fwidth(vUv.x);

    // 3) zachte interior-mask in plaats van vier harde steps
    float left   = smoothstep(bw - aa, bw + aa, vUv.x);
    float right  = smoothstep(bw - aa, bw + aa, 1.0 - vUv.x);
    float bottom = smoothstep(bw - aa, bw + aa, vUv.y);
    float top    = smoothstep(bw - aa, bw + aa, 1.0 - vUv.y);
    float interior = left * bottom * right * top;

    // 4) basis kleur
    vec3 bCol = mix(borderColor, highlightColor, vHover);
    vec3 col  = mix(bCol, fillColor, interior);

    // 5) inner-shadow zoals voorheen
    if (vHover > 0.5 && interior > 0.0) {
        float dist = min(
            min(vUv.x, vUv.y),
            min(1.0 - vUv.x, 1.0 - vUv.y)
        );
        float zone = bw * shadowZone;
        float t    = clamp((dist - bw) / zone, 0.0, 1.0);
        float falloff = pow(t, 0.3);
        float minBright = 1.0 - shadowIntensity;
        float mixF = mix(minBright, 1.0, falloff);
        col = mix(shadowColor, col, mixF);
    }

    gl_FragColor = vec4(col, 1.0);
}
