import { fetchText } from './utils.js';

export const [modelVS, modelFS] = await Promise.all([
  fetchText('shaders/model.vert'),
  fetchText('shaders/model.frag'),
]);

function parseOBJ(text) {
  const positions = [[0,0,0]];
  const normals = [[0,0,1]];
  const outPositions = [];
  const outNormals = [];
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts[0] === 'v') {
      positions.push(parts.slice(1).map(Number));
    } else if (parts[0] === 'vn') {
      normals.push(parts.slice(1).map(Number));
    } else if (parts[0] === 'f') {
      const verts = parts.slice(1);
      // triangulate face if necessary
      for (let i = 1; i < verts.length - 1; ++i) {
        const tri = [verts[0], verts[i], verts[i+1]];
        for (const vert of tri) {
          const [p, , n] = vert.split('/').map(v => v ? parseInt(v) : 0);
          const pos = positions[p];
          const nor = normals[n];
          outPositions.push(...pos);
          outNormals.push(...nor);
        }
      }
    }
  }
  return { positions: outPositions, normals: outNormals };
}

export class OBJModel {
  constructor(gl, program, positions, normals) {
    this.gl = gl;
    this.program = program;
    this.vertexCount = positions.length / 3;

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    this.nbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }

  static async load(gl, program, url) {
    const text = await fetchText(url);
    const { positions, normals } = parseOBJ(text);
    return new OBJModel(gl, program, positions, normals);
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

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_model'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_viewProj'), false, viewProj);
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, 'u_normalMatrix'), false, normalMatrix);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_color'), color);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_lightDir'), lightDir);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_camPos'), camPos);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
  }
}
