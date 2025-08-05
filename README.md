# Super Mario Sunshine Water FX

Reverse engineering and recreation of the water effects from Super Mario Sunshine (2002).  

## Live demo

<!-- ![<video controls src="demo.mov" title="Demo"></video>](demo.gif) -->

You can see this way -> [https://yonaim.github.io/super-mario-sunshine-water-fx/](https://yonaim.github.io/super-mario-sunshine-water-fx/)

## Feature Checklist

* [x] Wave animation using multi-layer texture scrolling
* [x] Specular Highlights 
* [x] Environment reflection
* [x] Refraction
* [x] Transparency

## Overview

This project analyzes and recreates the water rendering techniques used in Super Mario Sunshine on the Nintendo GameCube. The game achieved impressive water effects with only fixed-function hardware and creative technical solutions.

This implementation uses modern graphics APIs (WebGL) and programmable shader programs. The underlying principles and rendering logic from the original are faithfully reproduced, but adapted for modern hardware and APIs.

For educational and research purposes only. All original techniques are credited to Nintendo.

## How It Works

### GameCube Hardware Limitations

* **GPU**: ATI Flipper (fixed-function only)
* **No programmable shaders**: All effects were implemented using hardware features
* **Key features**: Multi-texturing, EFB (Embedded Frame Buffer), alpha testing

### Water Effect Components

#### 1. Wave Animation

**Technique**: Texture Scrolling

* Multiple layers of the same wave texture are scrolled at different speeds and directions
* Creates Moiré patterns that simulate dynamic water movement

#### 2. Reflection

**A) Specular Highlights**

* Mip-mapping is used to create distance-based brightness
* Alpha testing produces sharp highlight bands
* Simulates sun reflection on the water surface

**B) Environment Reflection**

* The scene is rendered to the EFB (Embedded Frame Buffer)
* The EFB copy is used as a texture for the water surface
* Produces mirror-like reflections of the environment

#### 3. Refraction

**Technique**: EFB Distortion Sampling

* Wave textures are used to offset UV coordinates
* The EFB copy is sampled with distorted coordinates to simulate refraction through the water

#### 4. Transparency

* Alpha blending with underwater geometry
* EFB is used to capture the underwater scene
* Depth-based transparency effects are applied

## References

* [Blog post: The water effects in Super Mario Sunshine – How it works](https://yona-blog.netlify.app/posts/2025/07/the-water-effects-in-super-mario-sunshine/how-it-works/)
* [Blog post: Deconstructing the water effect in Super Mario Sunshine](https://blog.mecheye.net/2018/03/deconstructing-the-water-effect-in-super-mario-sunshine/)
