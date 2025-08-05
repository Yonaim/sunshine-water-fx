#version 300 es
precision highp float;
in vec2   v_uv;
out vec4  outColor;

uniform sampler2D   waveTex;
uniform sampler2D   reflectionTex;
uniform sampler2D   refractionTex;
uniform float       u_time;
uniform float       u_scale;
uniform vec2        screenSize;

// GLSL ES 3.0 compatible LOD approximation
float getManualLod(vec2 uv, float textureSize)
{
	vec2  dx  = dFdx(uv * textureSize);
	vec2  dy  = dFdy(uv * textureSize);
	float rho = max(dot(dx, dx), dot(dy, dy));
	float lod = 0.5 * log2(rho);
	return max(lod, 0.0);
}

void main()
{
	vec2 offset1 = vec2(0.7182, 0.7182) + u_time * vec2(0.02, 0.018);
	vec2 offset2 = vec2(-0.3110, 0.3110) + u_time * vec2(-0.018, 0.021);
	vec2 uv1 = v_uv + offset1;
	vec2 uv2 = v_uv + offset2;
	float lodBias   = 2.0; // Optional LOD bias
	float manualLod = getManualLod(v_uv, 256.0) + lodBias;
	manualLod       = clamp(manualLod, 0.0, 4.0);

	float wave1 = texture(waveTex, uv1, manualLod).r;
	float wave2 = texture(waveTex, uv2, manualLod).r;
	float moire = mix(wave1, wave2, 0.5);

	vec2 screenUV     = gl_FragCoord.xy / screenSize;
	vec2 distort      = (vec2(wave1, wave2) - 0.5) * 0.05; // 필요 시 스케일 조정
	vec2 refractUV    = clamp(screenUV + distort, 0.0, 1.0);
	vec3 refractColor = texture(refractionTex, refractUV).rgb;
    vec3 dynReflect  = texture(reflectionTex, screenUV).rgb;

    vec3 water = refractColor + vec3(moire);
    float brightness = dot(water, vec3(0.299, 0.587, 0.114)) * 0.83; // RGB to luminance
    vec3 finalColor = clamp(water + dynReflect * 0.60, 0.0, 1.0);

    // -------------------------- 디버그용 ----------------------------
	// outColor = vec4(band, band, band, 1.0); // 밴드 마스킹 확인

	vec3 lodColor;
	if (manualLod < 1.0)
		lodColor = vec3(1, 0, 0); // L0
	else if (manualLod < 2.0)
		lodColor = vec3(0, 1, 0); // L1
	else if (manualLod < 3.0)
		lodColor = vec3(0, 0, 1); // L2
	else if (manualLod < 4.0)
		lodColor = vec3(1, 1, 0); // L3
	else
		lodColor = vec3(1, 0, 1); // L4
	outColor = vec4(lodColor, 1.0);

	// outColor = vec4(manualLod/4.0, manualLod/4.0, manualLod/4.0, 1.0); // LOD값 시각화 (흑백)

	// outColor = vec4(moire, moire, moire, 1.0);

    outColor = vec4(finalColor, 1.0);
    if (0.50 < brightness && brightness < 0.99)
            outColor.a = 0.0; // for compability with webGL version of github.io (github pages)
}
