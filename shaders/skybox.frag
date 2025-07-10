#version 300 es
precision highp float;
in vec3   v_dir;
out vec4  outColor;

uniform samplerCube myCube;

void main()
{
	outColor = texture(myCube, normalize(v_dir));
}
