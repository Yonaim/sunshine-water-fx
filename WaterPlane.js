import { fetchText } from "./utils.js";

export const [planeVS, planeFS] = await Promise.all([
  fetchText('shaders/waterEffect.vert'),
  fetchText('shaders/waterEffect.frag'),
]);

export class WaterPlane {
    constructor(gl, program, scale=1.0) {
        this.gl = gl;
        this.program = program;
        this.scale = scale;
        this.verts = [
            -scale, 0, -scale,
             scale, 0, -scale,
            -scale, 0,  scale,
            -scale, 0,  scale,
             scale, 0, -scale,
             scale, 0,  scale
        ];

        this.buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);
    }
    draw(baseColor, waveTex, time, mvp, reflectionTex, refractionTex, screenSize) {
        const gl = this.gl;
        gl.useProgram(this.program);

        gl.uniform1f(gl.getUniformLocation(this.program, 'u_time'), time);
        gl.uniform3f(gl.getUniformLocation(this.program, 'baseColor'), baseColor[0], baseColor[1], baseColor[2]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, waveTex);
        gl.uniform1i(gl.getUniformLocation(this.program, 'waveTex'), 0);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, reflectionTex);
        gl.uniform1i(gl.getUniformLocation(this.program, 'reflectionTex'), 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, refractionTex);
        gl.uniform1i(gl.getUniformLocation(this.program, 'refractionTex'), 3);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.uniform1f(gl.getUniformLocation(this.program, 'u_scale'), this.scale);
        gl.uniform1f(gl.getUniformLocation(this.program, 'u_time'), time);
        gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'u_modelViewProjection'), false, mvp);
        gl.uniform2f(gl.getUniformLocation(this.program, 'screenSize'), screenSize[0], screenSize[1]);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
}
