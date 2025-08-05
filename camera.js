import { mat4 } from "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm";
/* * OrbitCamera.js
 * A simple orbit camera implementation for WebGL.
 * Allows the user to rotate the camera around a point and zoom in/out.   
 * Allows mouse dragging to rotate and scroll wheel to zoom.
 */

const maxDistance = 30.0;
const minDistance = 10.0; // Minimum distance to prevent camera from going inside the object

export class OrbitCamera {
    constructor() {
      this.azimuth = 0.0; // azimuthal angle in radians
      this.elevation = 0.7; // elevation angle in radians
      this.distance = 19.0;
      this.lastX = 0; this.lastY = 0; this.dragging = false;
      this.initEvents();
    }
    initEvents() {
      const canvas = document.getElementById('webgl');
      canvas.addEventListener('mousedown', e => {
        this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY;
      });
      window.addEventListener('mouseup', () => this.dragging = false);
      window.addEventListener('mouseleave', () => this.dragging = false);
      canvas.addEventListener('mousemove', e => {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
        this.lastX = e.clientX; this.lastY = e.clientY;
        this.azimuth += dx * 0.01;
        this.elevation += dy * 0.01;
        this.elevation = Math.max(-Math.PI/2+0.05, Math.min(Math.PI/2-0.05, this.elevation));
      });
      canvas.addEventListener('wheel', e => {
        this.distance += e.deltaY * 0.01;
        this.distance = Math.max(minDistance, Math.min(maxDistance, this.distance));
        e.preventDefault();
      });
    }
    getViewMatrix() {
      const eye = [
        this.distance * Math.cos(this.elevation) * Math.sin(this.azimuth),
        this.distance * Math.sin(this.elevation),
        this.distance * Math.cos(this.elevation) * Math.cos(this.azimuth)
      ];
      return lookAt(eye, [0,0,0], [0,1,0]);
    }
    getSkyboxViewMatrix() {
        const view = mat4.clone(this.getViewMatrix());
        view[12] = view[13] = view[14] = 0.0;
        return view;
      }
  }
  
  function lookAt(eye, center, up) {
    const [ex,ey,ez] = eye, [cx,cy,cz] = center;
    let zx = ex-cx, zy = ey-cy, zz = ez-cz;
    const rl = Math.sqrt(zx*zx+zy*zy+zz*zz);
    zx/=rl; zy/=rl; zz/=rl;
    let xx = up[1]*zz - up[2]*zx, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
    const rl2 = Math.sqrt(xx*xx+xy*xy+xz*xz);
    xx/=rl2; xy/=rl2; xz/=rl2;
    let yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx*ex+xy*ey+xz*ez), -(yx*ex+yy*ey+yz*ez), -(zx*ex+zy*ey+zz*ez), 1
    ]);
  }
  