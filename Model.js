import { fetchText } from './utils.js';

export const [modelVS, modelFS] = await Promise.all([
  fetchText('shaders/model.vert'),
  fetchText('shaders/model.frag'),
]);

function parseOBJ(text) {
  const positions = [[0,0,0]];
  const normals = [[0,0,1]];
  const groups = [];
  let current = { material: 'default', positions: [], normals: [] };
  groups.push(current);
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts[0] === 'v') {
      positions.push(parts.slice(1).map(Number));
    } else if (parts[0] === 'vn') {
      normals.push(parts.slice(1).map(Number));
    } else if (parts[0] === 'usemtl') {
      current = { material: parts[1], positions: [], normals: [] };
      groups.push(current);
    } else if (parts[0] === 'f') {
      const verts = parts.slice(1);
      // triangulate face if necessary
      for (let i = 1; i < verts.length - 1; ++i) {
        const tri = [verts[0], verts[i], verts[i+1]];
        for (const vert of tri) {
          const [p, , n] = vert.split('/').map(v => v ? parseInt(v) : 0);
          const pos = positions[p];
          const nor = normals[n];
          current.positions.push(...pos);
          current.normals.push(...nor);
        }
      }
    }
  }
  return groups.filter(g => g.positions.length > 0);
}

export class OBJModel {
  constructor(gl, program, groups) {
    this.gl = gl;
    this.program = program;
    this.groups = groups.map(g => {
      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.positions), gl.STATIC_DRAW);

      const nbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(g.normals), gl.STATIC_DRAW);

      return { vbo, nbo, vertexCount: g.positions.length / 3, material: g.material };
    });
  }

  static async load(gl, program, url) {
    const text = await fetchText(url);
    const groups = parseOBJ(text);
    return new OBJModel(gl, program, groups);
  }

  draw(model, viewProj, normalMatrix, materials, lightDir, camPos) {
    const gl = this.gl;
    gl.useProgram(this.program);

    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_model'), false, model);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_viewProj'), false, viewProj);
    gl.uniformMatrix3fv(gl.getUniformLocation(this.program, 'u_normalMatrix'), false, normalMatrix);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_lightDir'), lightDir);
    gl.uniform3fv(gl.getUniformLocation(this.program, 'u_camPos'), camPos);

    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    for (const group of this.groups) {
      gl.bindBuffer(gl.ARRAY_BUFFER, group.vbo);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, group.nbo);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

      const mat = materials[group.material] || materials.default || { color: [1,1,1], emissive: [0,0,0] };
      gl.uniform3fv(gl.getUniformLocation(this.program, 'u_color'), mat.color);
      gl.uniform3fv(gl.getUniformLocation(this.program, 'u_emissive'), mat.emissive || [0,0,0]);

      gl.drawArrays(gl.TRIANGLES, 0, group.vertexCount);
    }
  }
}
