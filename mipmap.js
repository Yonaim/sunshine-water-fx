export function createManualMipmapTexture(gl, urls, unit) {
    return new Promise((resolve, reject) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));
  
      let loaded = 0;
      const images = [];
      for (let level = 0; level < urls.length; ++level) {
        images[level] = new Image();
        images[level].onload = () => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[level]);
          loaded++;
          if (loaded === urls.length) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            resolve(tex);
          }
        };
        images[level].onerror = reject;
        images[level].src = urls[level];
      }
      
    });
}
  