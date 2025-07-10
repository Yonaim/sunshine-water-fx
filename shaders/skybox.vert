#version 300 es
precision mediump float;
layout(location = 0) in vec3 a_position;
out vec3 v_dir;

uniform mat4 u_view;
uniform mat4 u_proj;

void main()
{
	// 카메라 회전만 반영 (view 행렬의 3x3 부분만 사용)
	v_dir = mat3(u_view) * a_position;
	// gl_Position은 정점 그대로(투영) → 평행이동은 필요없음!
	gl_Position = u_proj * vec4(a_position, 1.0);
}
