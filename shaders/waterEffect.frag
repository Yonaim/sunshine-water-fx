#version 300 es
precision highp float;
in vec2   v_uv;
out vec4  outColor;

uniform sampler2D waveTex;
uniform float     u_time;
uniform vec3      baseColor;

void main()
{
	vec2  offset1 = vec2(0.7182, 0.7182) + u_time * vec2(0.02, 0.018);
	vec2  offset2 = vec2(-0.3110, 0.3110) + u_time * vec2(-0.018, 0.021);
	vec2  uv1     = v_uv + offset1;
	vec2  uv2     = v_uv + offset2;
	float wave1   = texture(waveTex, uv1).r;
	float wave2   = texture(waveTex, uv2).r;
	float moire   = mix(wave1, wave2, 0.5);

	// 덧셈 방식 (plus)
	float strength  = 0.22; // 강도
	vec3  addEffect = baseColor + vec3(moire * strength);

	outColor = vec4(addEffect, 1.0);    // 밝은 반짝임 (덧셈)
}
