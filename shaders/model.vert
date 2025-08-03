#version 300 es
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;

uniform mat4 u_model;
uniform mat4 u_viewProj;
uniform mat3 u_normalMatrix;

out vec3 v_normal;
out vec3 v_worldPos;

void main(){
    vec4 worldPos = u_model * vec4(a_position, 1.0);
    v_worldPos = worldPos.xyz;
    v_normal = normalize(u_normalMatrix * a_normal);
    gl_Position = u_viewProj * worldPos;
}
