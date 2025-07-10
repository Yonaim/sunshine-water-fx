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

void main()
{
	vec2 offset1 = vec2(0.7182, 0.7182) + u_time * vec2(0.02, 0.018);
	vec2 offset2 = vec2(-0.3110, 0.3110) + u_time * vec2(-0.018, 0.021);

	vec2 uv1 = v_uv + offset1;
	vec2 uv2 = v_uv + offset2;

	float wave1 = texture(waveTex, uv1).r;
	float wave2 = texture(waveTex, uv2).r;

	float moire = mix(wave1, wave2, 0.5);

	// 스크린 위치의 skybox 색
	vec2 screenUV = gl_FragCoord.xy / screenSize;
	vec3 bgColor  = texture(screenColorTex, screenUV).rgb;

	// 수면의 파도 효과를 bgColor에 더함
	float strength = 0.52;
	vec3  water    = bgColor + vec3(moire * strength);

	float alpha = 1.0;
	outColor    = vec4(water, alpha);
    outColor = vec4(moire, moire, moire, 1.0); // 디버깅용: 모아레 효과만 출력
}
