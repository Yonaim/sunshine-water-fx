#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_worldPos;

uniform vec3 u_color;
uniform vec3 u_emissive;
uniform vec3 u_lightDir;
uniform vec3 u_camPos;

out vec4 outColor;

void main(){
    vec3 N = normalize(v_normal);
    vec3 L = normalize(u_lightDir);
    vec3 V = normalize(u_camPos - v_worldPos);
    vec3 R = reflect(-L, N);
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(R, V), 0.0), 16.0);
    vec3 ambient = 0.1 * u_color;
    vec3 diffuse = diff * u_color;
    vec3 specular = spec * vec3(1.0);
    outColor = vec4(ambient + diffuse + specular + u_emissive, 1.0);
}
