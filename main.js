import { OrbitCamera } from './camera.js';
import { createManualMipmapTexture } from './mipmap.js';
import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";
import { Skybox, skyboxFS, skyboxVS } from './skybox.js';
import { createProgram } from './utils.js';
import { loadCubemap } from './cubemap.js';
import { planeFS, planeVS, WaterPlane } from './WaterPlane.js';

const canvas = document.getElementById('webgl');
const gl = canvas.getContext('webgl2');
if (!gl) throw 'WebGL2 not supported';

// ======================== Objects ========================
const faceInfos = [
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_X, url: 'skybox/px.bmp' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, url: 'skybox/nx.bmp' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, url: 'skybox/py.bmp' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, url: 'skybox/ny.bmp' },
    { target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, url: 'skybox/pz.bmp' },
    { target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, url: 'skybox/nz.bmp' },
  ];
const cubemap = await loadCubemap(gl, faceInfos);
const camera = new OrbitCamera();
const skyboxProg = createProgram(gl, skyboxVS, skyboxFS);
const planeProg = createProgram(gl, planeVS, planeFS);
const skybox = new Skybox(gl, skyboxProg, cubemap);
const planeScale = 1.0;
const waterPlane = new WaterPlane(gl, planeProg, planeScale);

// ======================== Rendering ========================
const baseColor = [0.10, 0.65, 1.0];
const mipmapFiles = [
    'mipmap/L0.png', // level 0 (original)
    'mipmap/L1.png', // level 0 (1/2)
    'mipmap/L2.png', // level 1 (1/4)
    'mipmap/L3.png', // level 2 (1/8)
    'mipmap/L4.png' // level 3 (1/16)
];
let waveTex = null;
createManualMipmapTexture(gl, mipmapFiles, 0).then(tex => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, mipmapFiles.length - 1);
    waveTex = tex;
    requestAnimationFrame(render);
  });
  

function render(time) {
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    if (!waveTex) return;
    gl.clearColor(baseColor[0], baseColor[1], baseColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
    // ---------- Camera ----------
    const fovy = Math.PI / 4;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 100.0;
    
    // -------- Matrices ----------
    const model = mat4.create();
    const view = camera.getViewMatrix();
    const proj = mat4.create();
    const viewNoTrans = camera.getSkyboxViewMatrix(); // for skybox
    viewNoTrans[12] = 0; viewNoTrans[13] = 0; viewNoTrans[14] = 0;
    mat4.perspective(proj, fovy, aspect, near, far);
    const mvp = mat4.create();
    mat4.multiply(mvp, proj, view);
  
    // ----- Skybox -----
    // 1. FBO 준비
    const fbo = gl.createFramebuffer();
    const fboTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);

    // 2. skybox 렌더링 (FBO, Screen 각각)
    skybox.draw(viewNoTrans, proj, fbo, canvas.width, canvas.height);
    skybox.draw(viewNoTrans, proj);

    // ----- waterPlane -----
    waterPlane.draw(
        waveTex,
        time * 0.003,
        mvp,
        2.0,
        fboTex,        // skybox FBO texture
        [canvas.width, canvas.height]
    );
    
    requestAnimationFrame(render);
}