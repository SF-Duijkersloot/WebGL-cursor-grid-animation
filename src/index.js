import MobileGrid from './js/mobile-grid.js'
import WebGLGrid from './js/webgl-grid.js'

const canvasEl = document.querySelector('#grid')

if (MobileGrid.isMobile()) {
    // alleen grid tekenen, geen interactie
    new MobileGrid(canvasEl)
} else {
    // volledige WebGL grid
    new WebGLGrid(canvasEl)
}
