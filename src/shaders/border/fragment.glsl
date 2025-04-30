// fragment.glsl
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
    // 1) Bereken rand-dikte in UV‐eenheden
    float cellPx = resolution.x / cols;
    float bw     = borderWidthPx / cellPx;

    // 2) Bepaal of we in het interior zitten
    float interior = step(bw, vUv.x)
                   * step(bw, vUv.y)
                   * step(bw, 1.0 - vUv.x)
                   * step(bw, 1.0 - vUv.y);

    // 3) Basiskleur (border of fill)
    vec3 bCol = mix(borderColor, highlightColor, vHover);
    vec3 col  = mix(bCol, fillColor, interior);

    // 4) Inner‐shadow alleen op hovered interior
    if (vHover > 0.5 && interior > 0.0) {
        // afstand tot de dichtstbijzijnde rand (in UV)
        float dist = min(
            min(vUv.x, vUv.y),
            min(1.0 - vUv.x, 1.0 - vUv.y)
        );

        // zone over which the shadow fades
        float zone = bw * shadowZone;

        // normalize distance into [0,1]
        float t = clamp((dist - bw) / zone, 0.0, 1.0);
        float falloff = pow(t, 0.3);

        // bepaal minimale brightness op rand
        float minBright = 1.0 - shadowIntensity;
        // mix‐factor voor blend
        float mixF = mix(minBright, 1.0, falloff);

        // 5) blend tussen shadowColor en de bestaande color
        col = mix(shadowColor, col, mixF);
    }

    gl_FragColor = vec4(col, 1.0);
}
