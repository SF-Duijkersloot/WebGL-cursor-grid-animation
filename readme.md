# Interactive grid background animation

A responsive, high-performance grid background with smooth hover effects—implemented in WebGL (Three.js) on desktop and a simple Canvas fallback on mobile.

<img width="500" alt="image" src="https://github.com/user-attachments/assets/95f1c9eb-66b6-4b00-a3b2-14fa652de720" />
<img width="500" alt="image" src="https://github.com/user-attachments/assets/fd4748ae-16f1-4b36-a9b9-0f5d4d813040" />

---

## 🔗 Live demo

Check out the live version on Vercel:
👉 [https://webgl-cursor-grid-animation.vercel.app/#debug](https://webgl-cursor-grid-animation.vercel.app/#debug)

> Note: Appending #debug to the URL (e.g. https://webgl-cursor-grid-animation.vercel.app/#debug) enables the debug GUI panel, allowing you to tweak colors, decay times, shadow settings, and other variables in real time.

---

## 🧑‍💻 Running locally
To get the grid up and running on your machine:

1. Clone the repo
```bash
git clone https://github.com/yourusername/webgl-cursor-grid-animation.git
cd webgl-cursor-grid-animation
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
4. Open your browser at the port shown in the console.

---

## 🚀 Overview

- **Desktop**:  
  - Uses Three.js with a single **InstancedMesh** (one plane geometry, one ShaderMaterial, ~400 instances)  
  - Orthographic camera to treat the grid as a flat 2D plane  
  - Per-instance hover state driven by custom GLSL shaders (border + inner-shadow)  
  - Mouse‐move → cell index calculation → highlight center + random neighbours → decay over time  
  - `#debug` mode toggles Stats.js (FPS) + Lil-GUI panel for live tweaking  

- **Mobile**:  
  - Falls back to an HTML5 Canvas redraw of a static grid (no hover/interaction)  
  - Lightweight, zero external deps, instant load  

---

## 🏗️ Architecture

- **`WebGLGrid`** (desktop)  
  - `setThreeContext()`, `setInstances()`, `buildGrid()`, `handleMouseMove()`, `animate()`  
  - GLSL shaders generate border & inner-shadow based on uniforms  

- **`CanvasGrid`** (mobile)  
  - Scales canvas for DPR, draws static grid in `drawGrid()`  

- **`index.js`**  
  ```js
  import CanvasGrid from './mobile-grid.js';
  import WebGLGrid  from './webgl-grid.js';

  const canvas = document.querySelector('#grid');
  if (CanvasGrid.isMobile()) {
    new CanvasGrid(canvas);
  } else {
    new WebGLGrid(canvas);
  }
  ```

---

## 🐞 Debug mode

Add `#debug` to your URL to enable:

- **Lil-GUI** controls for:
  - `centerDecay`, `neighbourDecay`, `neighbourProb`  
  - `fillColor`, `borderColor`, `highlightColor`, `shadowColor`  
  - `shadowZone`, `shadowIntensity`  

<img src="https://github.com/user-attachments/assets/b9c1b785-7f69-464e-bdce-394186e7e26a" style="width:250px;">


---

## 🤨 Why WebGL?

I originally tried a vanilla JS + CSS approach to speed up load times, but constantly toggling hundreds of DOM elements proved too CPU-intensive and led to choppy animations. By moving to WebGL with Three.js, all the heavy lifting is off-loaded to the GPU, so the grid stays perfectly smooth—even on lower-end devices. And to keep mobile load times lightning-fast (especially on slow 4G), I now only load the Three.js/WebGL bundle on desktop; on mobile we fall back to a simple, static canvas grid with no hover interactions.

