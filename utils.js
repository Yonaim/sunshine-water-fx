export async function fetchText(url) {
    return await (await fetch(url)).text();
}

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
  return shader;
}

export function createProgram(gl, vsrc, fsrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
  return prog;
}
