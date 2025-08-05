import { OrbitCamera } from './camera.js';
import { createManualMipmapTexture } from './mipmap.js';
import { mat4, mat3, vec3 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";
import { Skybox, skyboxFS, skyboxVS } from './skybox.js';
import { createProgram } from './utils.js';
import { loadCubemap } from './cubemap.js';
import { planeFS, planeVS, WaterPlane } from './WaterPlane.js';
import { OBJModel, modelFS, modelVS } from './Model.js';

// ======================== Initialization ========================
const canvas = document.getElementById('webgl');
const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
if (!gl) throw 'WebGL2 not supported';

// for compability with webGL version of github.io (github pages)
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);

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
const modelProg = createProgram(gl, modelVS, modelFS);
const skybox = new Skybox(gl, skyboxProg, cubemap);
const planeScale = 10.0;
const waterPlane = new WaterPlane(gl, planeProg, planeScale);
const star = await OBJModel.load(gl, modelProg, 'model/powerStar.obj');
const treasureBox = await OBJModel.load(gl, modelProg, 'model/treasureBox.obj');
const pipe = await OBJModel.load(gl, modelProg, 'model/pipe.obj');
const coin = await OBJModel.load(gl, modelProg, 'model/coin.obj');
const starMaterials = {
    Empty: { color: [1.0,0.85,0.0], emissive: [0.25,0.21075,0.0] },
    FooMat: { color: [1.0,0.85,0.0], emissive: [0.25,0.21075,0.0] },
    Eye: { color: [0.0,0.0,0.0], emissive: [0.0,0.0,0.0] },
    'Eye(2)': { color: [0.0,0.0,0.0], emissive: [0.0,0.0,0.0] },
    'Eye(3)': { color: [0.0,0.0,0.0], emissive: [0.0,0.0,0.0] },
    default: { color: [1.0,0.85,0.0], emissive: [0.25,0.21075,0.0] }
};
const boxMaterials = {
    TreasureBox_Mat_v: { color: [0.55,0.27,0.07], emissive: [0.0,0.0,0.0] },
    'TreasureBox_Mat_v(2)': { color: [0.40,0.20,0.05], emissive: [0.0,0.0,0.0] },
    TreasureBoxMt_Mat_v: { color: [0.2,0.2,0.2], emissive: [0.0,0.0,0.0] },
    'TreasureBoxMt_Mat_v(2)': { color: [0.2,0.2,0.2], emissive: [0.0,0.0,0.0] },
    'TreasureBoxMt_Mat_v(3)': { color: [0.2,0.2,0.2], emissive: [0.0,0.0,0.0] },
    'TreasureBoxMt_Mat_v(4)': { color: [0.2,0.2,0.2], emissive: [0.0,0.0,0.0] },
    default: { color: [0.55,0.27,0.07], emissive: [0.0,0.0,0.0] }
};
const pipeMaterials = {
    'EarthenPipeMat_v.001': { color: [0.0,0.6,0.0], emissive: [0.0,0.2,0.0] },
    'EarthenPipeMat_v_x.001': { color: [0.0,0.6,0.0], emissive: [0.0,0.2,0.0] },
    default: { color: [0.0,0.6,0.0], emissive: [0.0,0.2,0.0] }
};
const coinMaterials = {
    lambert3_v: { color: [1.0,0.84,0.0], emissive: [0.25,0.21,0.0] },
    default: { color: [1.0,0.84,0.0], emissive: [0.25,0.21,0.0] }
};
const lightDir = vec3.normalize(vec3.create(), [1,1,1]);
const waterHeight = 0.0;

// ======================== Rendering ========================
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

const reflectionFbo = gl.createFramebuffer();
const reflectionFboTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, reflectionFboTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
const reflectionDepth = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, reflectionDepth);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFbo);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, reflectionFboTex, 0);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, reflectionDepth);
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const refractionTex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, refractionTex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);


function render(time) {
    if (!waveTex) return;

    const fovy = Math.PI / 2;
    const aspect = canvas.width / canvas.height;
    const near = 0.1;
    const far = 100.0;
    camera.azimuth += 0.003;

    const view = camera.getViewMatrix();
    const proj = mat4.create();
    mat4.perspective(proj, fovy, aspect, near, far);
    const viewProj = mat4.create();
    mat4.multiply(viewProj, proj, view);

    // ----- Reflection pass -----
    const eye = [
        camera.distance * Math.cos(camera.elevation) * Math.sin(camera.azimuth),
        camera.distance * Math.sin(camera.elevation),
        camera.distance * Math.cos(camera.elevation) * Math.cos(camera.azimuth)
    ];
    const reflectedEye = [eye[0], -eye[1], eye[2]];
    const viewRef = mat4.create();
    mat4.lookAt(viewRef, reflectedEye, [0,0,0], [0,-1,0]);
    const viewProjRef = mat4.create();
    mat4.multiply(viewProjRef, proj, viewRef);

    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFbo);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const starModelRef = mat4.create();
    mat4.translate(starModelRef, starModelRef, [0,5,0]);
    mat4.scale(starModelRef, starModelRef, [2,2,2]);
    const normalRef = mat3.create();
    mat3.normalFromMat4(normalRef, starModelRef);
    star.draw(starModelRef, viewProjRef, normalRef, starMaterials, lightDir, reflectedEye, waterHeight);

    const boxModelRef = mat4.create();
    mat4.translate(boxModelRef, boxModelRef, [4,-5,5]);
    mat4.scale(boxModelRef, boxModelRef, [2,2,2]);
    const boxNormalRef = mat3.create();
    mat3.normalFromMat4(boxNormalRef, boxModelRef);
    treasureBox.draw(boxModelRef, viewProjRef, boxNormalRef, boxMaterials, lightDir, reflectedEye, waterHeight);

    const pipeModelRef = mat4.create();
    mat4.translate(pipeModelRef, pipeModelRef, [-5,-5,-5]);
    mat4.scale(pipeModelRef, pipeModelRef, [0.02,0.02,0.02]);
    const pipeNormalRef = mat3.create();
    mat3.normalFromMat4(pipeNormalRef, pipeModelRef);
    pipe.draw(pipeModelRef, viewProjRef, pipeNormalRef, pipeMaterials, lightDir, reflectedEye, waterHeight);

    const coinModelRef = mat4.create();
    mat4.translate(coinModelRef, coinModelRef, [-5,5,-5]);
    mat4.scale(coinModelRef, coinModelRef, [2,2,2]);
    const coinNormalRef = mat3.create();
    mat3.normalFromMat4(coinNormalRef, coinModelRef);
    coin.draw(coinModelRef, viewProjRef, coinNormalRef, coinMaterials, lightDir, reflectedEye, waterHeight);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // ----- Main scene -----
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const skyboxView = mat4.clone(view);
    skyboxView[12]=skyboxView[13]=skyboxView[14]=0;
    skybox.draw(skyboxView, proj);

    // Draw objects below the water surface first so they appear only in the refraction texture
    const boxModel = mat4.create();
    mat4.translate(boxModel, boxModel, [4,-5,5]);
    mat4.scale(boxModel, boxModel, [2,2,2]);
    const boxNormal = mat3.create();
    mat3.normalFromMat4(boxNormal, boxModel);
    treasureBox.draw(boxModel, viewProj, boxNormal, boxMaterials, lightDir, eye);

    const pipeModel = mat4.create();
    mat4.translate(pipeModel, pipeModel, [-5,-5,-5]);
    mat4.scale(pipeModel, pipeModel, [0.02,0.02,0.02]);
    const pipeNormal = mat3.create();
    mat3.normalFromMat4(pipeNormal, pipeModel);
    pipe.draw(pipeModel, viewProj, pipeNormal, pipeMaterials, lightDir, eye);

    // Capture refraction texture without above-water objects
    gl.bindTexture(gl.TEXTURE_2D, refractionTex);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, canvas.width, canvas.height);

    // Render objects above the water surface
    const starModel = mat4.create();
    mat4.translate(starModel, starModel, [0,5,0]);
    mat4.scale(starModel, starModel, [2,2,2]);
    const starNormal = mat3.create();
    mat3.normalFromMat4(starNormal, starModel);
    star.draw(starModel, viewProj, starNormal, starMaterials, lightDir, eye);

    const coinModel = mat4.create();
    mat4.translate(coinModel, coinModel, [3,1,-5]);
    mat4.scale(coinModel, coinModel, [2,2,2]);
    const coinNormal = mat3.create();
    mat3.normalFromMat4(coinNormal, coinModel);
    coin.draw(coinModel, viewProj, coinNormal, coinMaterials, lightDir, eye);

    const mvp = viewProj;
    waterPlane.draw(
        waveTex,
        time * 0.003,
        mvp,
        reflectionFboTex,
        refractionTex,
        [canvas.width, canvas.height]
    );

    requestAnimationFrame(render);
}