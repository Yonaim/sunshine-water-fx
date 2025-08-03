import { fetchText } from "./utils.js";

export const [sphereVS, sphereFS] = await Promise.all([
  fetchText('shaders/sphere.vert'),
  fetchText('shaders/sphere.frag'),
]);

export class Sphere {
  constructor(gl, program, radius = 1, latBands = 32, longBands = 32) {
    this.gl = gl;
    this.program = program;

    const positions = [];
    const normals = [];
    const indices = [];

    for (let lat = 0; lat <= latBands; ++lat) {
      const theta = lat * Math.PI / latBands;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);
      for (let lon = 0; lon <= longBands; ++lon) {
        const phi = lon * 2 * Math.PI / longBands;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);
        const x = cosPhi * sinTheta;
        const y = cosTheta;
        const z = sinPhi * sinTheta;
        positions.push(radius * x, radius * y, radius * z);
        normals.push(x, y, z);
      }
    }

    for (let lat = 0; lat < latBands; ++lat) {
      for (let lon = 0; lon < longBands; ++lon) {
        const first = (lat * (longBands + 1)) + lon;
        const second = first + longBands + 1;
        indices.push(first, second, first + 1);
        indices.push(second, second + 1, first + 1);
      }
    }

    this.indexCount = indices.length;

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  }

  draw(model, viewProj, normalMatrix, color, lightDir, camPos) {
    const gl = this.gl;
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_model'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_viewProj'), false, viewProj);
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, 'u_normalMatrix'), false, normalMatrix);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_color'), color);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_lightDir'), lightDir);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_camPos'), camPos);

    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }
}
