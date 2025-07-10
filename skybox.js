import { fetchText } from "./utils.js";

export const [skyboxVS, skyboxFS] = await Promise.all([
  fetchText('shaders/skybox.vert'),
  fetchText('shaders/skybox.frag'),
]);

const skyboxVerts = [
  -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1,
  -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1,
];
const skyboxIndices = [
  0, 1, 2,   2, 3, 0,      // -Z
  4, 5, 6,   6, 7, 4,      // +Z
  0, 4, 7,   7, 3, 0,      // -X
  1, 5, 6,   6, 2, 1,      // +X
  3, 2, 6,   6, 7, 3,      // +Y
  0, 1, 5,   5, 4, 0,      // -Y
];

export class Skybox {
  constructor(gl, program, cubemap) {
    this.gl = gl;
    this.program = program;
    this.cubemap = cubemap;

    // VBO
    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skyboxVerts), gl.STATIC_DRAW);

    // IBO
    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(skyboxIndices), gl.STATIC_DRAW);
  }

  draw(u_view, u_proj, targetFramebuffer = null, width = null, height = null) {
    const gl = this.gl;

    // FBO Binding
    if (targetFramebuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);
      if (width && height) {
        gl.viewport(0, 0, width, height);
      }
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    gl.useProgram(this.program);

    // buffer, attribute 
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    // uniform
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_view"), false, u_view);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, "u_proj"), false, u_proj);

    // cubemap texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemap);
    gl.uniform1i(gl.getUniformLocation(this.program, "myCube"), 1);

    gl.depthFunc(gl.LEQUAL);
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    gl.depthFunc(gl.LESS);

    // FBO Unbinding
    if (targetFramebuffer) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}
