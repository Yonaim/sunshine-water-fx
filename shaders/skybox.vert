#version 300 es
precision mediump float;
layout(location = 0) in vec3 a_position;
out vec3 v_dir;

uniform mat4 u_view; // (translation 0, only rotation)
uniform mat4 u_proj;

void main()
{
	// 큐브맵 샘플 방향 : 회전 주지 않고 그대로
	v_dir = a_position;

	// 지오메트리(큐브)만 카메라 회전으로 돌림
	vec3 rotated = mat3(u_view) * a_position;
	vec4 clipPos = u_proj * vec4(rotated, 1.0);

	// 깊이 w로 고정
	gl_Position = clipPos.xyww;
}
