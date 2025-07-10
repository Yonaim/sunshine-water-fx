#version 300 es
precision highp float;
in vec2   v_uv;
out vec4  outColor;

uniform sampler2D waveTex;
uniform sampler2D screenColorTex;
uniform float     u_time;
uniform float     u_scale;
uniform float     lodBias;
uniform vec2      screenSize;
uniform vec3      baseColor;

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
    float lodBias = 0.999; // LOD 편향 (예: 2.0)
	float manualLod = getManualLod(v_uv, 256.0) + lodBias; // 256 = waveTex의 L0 해상도

	float wave1 = texture(waveTex, uv1, manualLod).r;
	float wave2 = texture(waveTex, uv2, manualLod).r;
	float moire = mix(wave1, wave2, 0.5);
	float hi    = pow(moire, 3.5);

	vec2 screenUV = gl_FragCoord.xy / screenSize;
	vec3 bgColor  = texture(screenColorTex, screenUV).rgb;

	float band
		= smoothstep(1.7, 2.0, manualLod) * smoothstep(2.7, 2.2, manualLod);

	vec3 shineColor = vec3(1.0, 2.5, 1.5);
	float strength = 0.22;
	vec3  water = bgColor + vec3(moire * strength) + hi * vec3(0.9, 0.95, 1.5);;
	vec3 finalColor = mix(water, shineColor, band * 0.05);

	// --- 디버그용 ---
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
	float brightness
		= dot(outColor.rgb, vec3(0.299, 0.587, 0.114));
	if (brightness > 0.53 && brightness < 0.72)
		outColor.a = 0.0; // for compability with webGL version of github.io (github pages) 
		// discard;
}
