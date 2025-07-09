#version 300 es
in vec2  a_position;
out vec2 v_uv;

uniform mat4  u_view, u_proj;
uniform float u_zoom;

void main()
{
	vec4 pos    = vec4(a_position * u_zoom, 0.0, 1.0);
	gl_Position = u_proj * u_view * pos;
	v_uv        = (a_position + 1.0) * 0.5;
}
