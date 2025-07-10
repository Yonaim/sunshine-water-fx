#version 300 es
precision mediump float;
layout(location = 0) in vec3 a_position;
out vec2 v_uv;
out vec3 v_direction;

uniform mat4 u_modelViewProjection;
uniform float u_scale;

void main()
{
	gl_Position = u_modelViewProjection * vec4(a_position, 1.0);

    float uv_scailing = 0.8; // UV 스케일링 값 (추후 조정)
	v_uv        = (a_position.xz / (u_scale * uv_scailing)) + 0.5; // Normalize UV coordinates
}
