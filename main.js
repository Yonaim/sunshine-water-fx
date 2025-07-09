import { OrbitCamera } from './camera.js';

async function fetchText(url) {
  return await (await fetch(url)).text();
}

function createShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(shader);
  return shader;
}
function createProgram(gl, vsrc, fsrc) {
  const vs = createShader(gl, gl.VERTEX_SHADER, vsrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw gl.getProgramInfoLog(prog);
  return prog;
}

const canvas = document.getElementById('webgl');
const gl = canvas.getContext('webgl2');
if (!gl) throw 'WebGL2 not supported';

const [planeVS, planeFS] = await Promise.all([
  fetchText('shaders/waterEffect.vert'),
  fetchText('shaders/waterEffect.frag'),
]);

const camera = new OrbitCamera();

const planeProg = createProgram(gl, planeVS, planeFS);
const planeBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, planeBuf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1,-1,  1,-1,  -1,1,
   1,-1,  1, 1,  -1,1
]), gl.STATIC_DRAW);

function createTexture(gl, url, unit) {
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255]));
  const image = new Image();
  image.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src = url;
  return tex;
}
createTexture(gl, 'mipmap/L1.png', 0);

function perspective(out, fovy, aspect, near, far) {
  const f = 1.0 / Math.tan(fovy/2), nf = 1/(near-far);
  out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0;
  out[4]=0; out[5]=f; out[6]=0; out[7]=0;
  out[8]=0; out[9]=0; out[10]=(far+near)*nf; out[11]=-1;
  out[12]=0; out[13]=0; out[14]=2*far*near*nf; out[15]=0;
  return out;
}

const baseColor = [0.10, 0.65, 1.0];

function render(time) {
    const loc = gl.getUniformLocation(planeProg, 'baseColor');
 gl.uniform3fv(loc, baseColor);
  gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
  gl.clearColor(baseColor[0], baseColor[1], baseColor[2], 1.0);  // 캔버스 파란색으로
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  

  // ----- Plane (water) -----
  gl.useProgram(planeProg);
  gl.bindBuffer(gl.ARRAY_BUFFER, planeBuf);
  const planePosLoc = gl.getAttribLocation(planeProg,'a_position');
  gl.enableVertexAttribArray(planePosLoc);
  gl.vertexAttribPointer(planePosLoc,2,gl.FLOAT,false,0,0);

  const view = camera.getViewMatrix();
  const proj = perspective(new Float32Array(16), Math.PI/3, gl.canvas.width/gl.canvas.height, 0.1, 100.0);

  gl.uniformMatrix4fv(gl.getUniformLocation(planeProg,'u_view'),false,view);
  gl.uniformMatrix4fv(gl.getUniformLocation(planeProg,'u_proj'),false,proj);
  gl.uniform1f(gl.getUniformLocation(planeProg,'u_time'), time*0.001);
  gl.uniform1f(gl.getUniformLocation(planeProg,'u_zoom'),1.0);

  gl.uniform1i(gl.getUniformLocation(planeProg,'waveTex'), 0);

  gl.drawArrays(gl.TRIANGLES,0,6);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
