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
const star = await OBJModel.load(gl, modelProg, 'powerStar.obj');
const treasureBox = await OBJModel.load(gl, modelProg, 'treasureBox.obj');
const lightDir = vec3.normalize(vec3.create(), [1,1,1]);

// ======================== Rendering ========================
const baseColor = [0.10, 0.65, 1.0];
// const baseColor = [0.223, 0.494, 0.835];
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
    const skyboxViewRef = mat4.clone(viewRef);
    skyboxViewRef[12]=skyboxViewRef[13]=skyboxViewRef[14]=0;

    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFbo);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(baseColor[0], baseColor[1], baseColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    skybox.draw(skyboxViewRef, proj, reflectionFbo, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, reflectionFbo);
    const starModelRef = mat4.create();
    mat4.translate(starModelRef, starModelRef, [0,5,0]);
    mat4.scale(starModelRef, starModelRef, [2,2,2]);
    const normalRef = mat3.create();
    mat3.normalFromMat4(normalRef, starModelRef);
    const viewProjRef = mat4.create();
    mat4.multiply(viewProjRef, proj, viewRef);
    star.draw(starModelRef, viewProjRef, normalRef, [1.0,0.85,0.0], lightDir, reflectedEye);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // ----- Main scene -----
    gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
    gl.clearColor(baseColor[0], baseColor[1], baseColor[2], 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const skyboxView = mat4.clone(view);
    skyboxView[12]=skyboxView[13]=skyboxView[14]=0;
    skybox.draw(skyboxView, proj);

    const starModel = mat4.create();
    mat4.translate(starModel, starModel, [0,5,0]);
    mat4.scale(starModel, starModel, [2,2,2]);
    const starNormal = mat3.create();
    mat3.normalFromMat4(starNormal, starModel);
    star.draw(starModel, viewProj, starNormal, [1.0,0.85,0.0], lightDir, eye);

    const boxModel = mat4.create();
    mat4.translate(boxModel, boxModel, [0,-5,0]);
    mat4.scale(boxModel, boxModel, [2,2,2]);
    const boxNormal = mat3.create();
    mat3.normalFromMat4(boxNormal, boxModel);
    treasureBox.draw(boxModel, viewProj, boxNormal, [0.55,0.27,0.07], lightDir, eye);

    gl.bindTexture(gl.TEXTURE_2D, refractionTex);
    gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, canvas.width, canvas.height);

    const mvp = viewProj;
    waterPlane.draw(
        baseColor,
        waveTex,
        time * 0.003,
        mvp,
        reflectionFboTex,
        refractionTex,
        [canvas.width, canvas.height]
    );

    requestAnimationFrame(render);
}