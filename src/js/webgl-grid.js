import * as THREE from 'three'
import Stats from 'stats.js'
import GUI from 'lil-gui'
import borderVertexShader from '../shaders/border/vertex.glsl'
import borderFragmentShader from '../shaders/border/fragment.glsl'

export default class WebGLGrid {
    constructor(canvas) {
        this.canvas = canvas // canvas vanuit index.js

        this.properties = {
            gridBreakpoints: [
                { minWidth: 1900, cols: 36 },
                { minWidth: 1600, cols: 32 },
                { minWidth: 1200, cols: 28 },
                { minWidth: 768, cols: 22 },
                { minWidth: 0, cols: 12 },
            ],
            fillColor: '#ffffff',
            borderColor: '#f4f3ef',
            highlightColor: '#55a8de',
            shadowColor: '#253082',
            neighbourProb: 1 / 8,
            centerDecay: 0.6,
            neighbourDecay: 0.4,
            maxInstances: 28 * 28 * 2,
            shadowZone: 10,
            shadowIntensity: 0.1,
            borderWidth: 0.5,
        }

        this.setDebug()
        this.setThreeContext()
        this.setInstances()
        this.setEventListeners()
        this.resize() // resize aanroepen om de camera goed te zetten
        this.animate()
    }

    setDebug() {
        // check of "debug mode" aanstaat
        const debug = window.location.hash === '#debug'
        // Check of Stats beschikbaar is voordat je het gebruikt

        if (debug) {
            if (window.Stats || typeof Stats !== 'undefined') {
                this.stats = new Stats()
                this.stats.showPanel(0) // 0: fps, 1: ms, 2: memory
                document.body.appendChild(this.stats.dom)
            }

            this.gui = new GUI()
            const folder = this.gui.addFolder('settings')
            folder.add(this.properties, 'centerDecay', 0, 2, 0.01).name('Center Decay')
            folder.add(this.properties, 'neighbourDecay', 0, 2, 0.01).name('Neighbour Decay')
            folder.add(this.properties, 'neighbourProb', 0, 1, 0.01).name('Neighbour Prob')

            const colors = this.gui.addFolder('colors')
            colors.addColor(this.properties, 'fillColor').name('Fill Color').onChange(v => this.material.uniforms.fillColor.value.set(v))
            colors.addColor(this.properties, 'borderColor').name('Border Color').onChange(v => this.material.uniforms.borderColor.value.set(v))
            colors.addColor(this.properties, 'highlightColor').name('Highlight Color').onChange(v => this.material.uniforms.highlightColor.value.set(v))
            colors.addColor(this.properties, 'shadowColor').name('Shadow Color').onChange(v => this.material.uniforms.shadowColor.value.set(v))

            const uniforms = this.gui.addFolder('uniforms')
            uniforms.add(this.properties, 'shadowZone', 0, 100, 1).name('Shadow Zone').onChange(v => this.material.uniforms.shadowZone.value = v)
            uniforms.add(this.properties, 'shadowIntensity', 0, 1, 0.01).name('Shadow Intensity').onChange(v => this.material.uniforms.shadowIntensity.value = v)
            uniforms.add(this.properties, 'borderWidth', 0, 10, 0.1).name('Border Width').onChange(v => this.material.uniforms.borderWidthPx.value = v * this.sizes.pixelRatio)
        }
    }

    setThreeContext() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            toneMapping: THREE.NoToneMapping,
        })

        this.renderer.outputColorSpace = THREE.SRGBColorSpace

        this.camera = new THREE.OrthographicCamera()
        this.camera.position.set(0, 0, 10)
        // frustum wordt ingesteld in resize()

        this.scene = new THREE.Scene()
        this.scene.add(this.camera)
    }

    setInstances() {
        const plane = new THREE.PlaneGeometry(1, 1) // globale plane
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                fillColor: { value: new THREE.Color(this.properties.fillColor) },
                borderColor: { value: new THREE.Color(this.properties.borderColor) },
                highlightColor: { value: new THREE.Color(this.properties.highlightColor) },
                shadowZone: { value: this.properties.shadowZone },
                shadowIntensity: { value: this.properties.shadowIntensity },
                shadowColor: { value: new THREE.Color(this.properties.shadowColor) },
                borderWidthPx: { value: 0.5 },
                cols: { value: 0 },
                resolution: { value: new THREE.Vector2() },
            },
            vertexShader: borderVertexShader,
            fragmentShader: borderFragmentShader,
        })

        // instanced mesh met global plane geometry (voorkomt drawcalls)
        this.mesh = new THREE.InstancedMesh(plane, this.material, this.properties.maxInstances)
        this.scene.add(this.mesh)

        // array voor offsets, hovers en holdtimes
        this.offsets = new Float32Array(this.properties.maxInstances * 3) // float voor x,y,z
        this.hovers = new Uint8Array(this.properties.maxInstances) // Uint8Array omdat hovers 0 of 1 is
        this.holdTimes = new Float32Array(this.properties.maxInstances) // float voor fractionele tijd

        // attributes setten voor instanced mesh
        this.mesh.geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(this.offsets, 3))
        this.mesh.geometry.setAttribute('instanceHover', new THREE.InstancedBufferAttribute(this.hovers, 1))
    }

    setEventListeners() {
        window.addEventListener('resize', () => this.resize())
        window.addEventListener('mousemove', e => this.handleMouseMove(e))
    }



    buildGrid(cols, rows) {
        const count = cols * rows
        this.mesh.count = count

        // for loop door hele grid
        let i = 0
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                this.offsets[3 * i + 0] = x + .5 - cols / 2 // x
                this.offsets[3 * i + 1] = rows / 2 - y - .5 // y
                this.offsets[3 * i + 2] = 0 // z
                this.hovers[i] = this.holdTimes[i] = 0 // beide zijn 0 op build
                i++
            }
        }

        // update instance attributes
        this.mesh.geometry.attributes.instanceOffset.needsUpdate = true
        this.mesh.geometry.attributes.instanceHover.needsUpdate = true
    }

    handleMouseMove(event) {
        const cell = this.getCellUnderCursor(event)
        if (!cell || cell.id === this.lastId) return
        this.lastId = cell.id

        this.highlightCell(cell.id, this.properties.centerDecay)
        this.highlightRandomNeighbours(cell.col, cell.row)

        this.mesh.geometry.attributes.instanceHover.needsUpdate = true
    }

    getCellUnderCursor(event) {
        // (ndc) normalized device coords 
        const { width, height } = this.sizes
        const ndcX = (event.clientX / width) * 2 - 1
        const ndcY = -(event.clientY / height) * 2 + 1

        // naar wereldcoördinaten
        const worldX = ndcX * this.camera.right
        const worldY = ndcY * this.camera.top

        // pak kolom/rij uit gecentreerde grid
        const col = Math.floor(worldX + this.cols / 2)
        const row = Math.floor(this.rows / 2 - worldY)
        const id = row * this.cols + col

        // check of binnen bereik
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return null
        }
        return { col, row, id }
    }

    highlightCell(id, decayTime) {
        this.hovers[id] = 1
        this.holdTimes[id] = decayTime
    }

    // save for later if needed

    // highlightNeighbours(col, row) {
    //     const deltas = [
    //         [1, 0], // rechts
    //         [-1, 0], // links
    //         [0, 1], // onder
    //         [0, -1], // boven
    //     ]
    //     for (const [dx, dy] of deltas) {
    //         // n = neighbour, c = column, r = row
    //         const nc = col + dx
    //         const nr = row + dy

    //         // check of binnen bereik
    //         if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue

    //         // checken waar de neighbour cell id is
    //         const nid = nr * this.cols + nc
    //         if (this.holdTimes[nid] <= 0) { // als geen hold -> highlight
    //             this.highlightCell(nid, this.properties.neighbourDecay)
    //         }
    //     }
    // }

    highlightRandomNeighbours(col, row) {
        // loop dx,dy van -1..+1 om de 3×3 omgeving te doorlopen
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                // sla de centrale cel (dx=0, dy=0) over
                if (dx === 0 && dy === 0) continue;

                const nc = col + dx;
                const nr = row + dy;

                // check of buur binnen grid‐grenzen valt
                if (nc < 0 || nc >= this.cols || nr < 0 || nr >= this.rows) continue;

                const nid = nr * this.cols + nc;

                // alleen highlighten als er nog geen actieve hold is én
                // een random draw < neighbourProb
                if (this.holdTimes[nid] <= 0
                    && Math.random() < this.properties.neighbourProb) {
                    this.highlightCell(nid, this.properties.neighbourDecay);
                }
            }
        }
    }


    resize() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }

        // juiste grid size bepalen
        const cols = this.properties.gridBreakpoints.find(b => this.sizes.width >= b.minWidth).cols
        const rows = Math.ceil(cols / (this.sizes.width / this.sizes.height)) // aantal rows op basis van aspect ratio
        this.cols = cols
        this.rows = rows

        // orhographic camera frustum
        this.camera.left = -cols / 2
        this.camera.right = cols / 2
        this.camera.top = rows / 2
        this.camera.bottom = -rows / 2
        this.camera.updateProjectionMatrix()

        this.renderer.setSize(this.sizes.width, this.sizes.height)
        this.renderer.setPixelRatio(this.sizes.pixelRatio)

        // uniforms updaten
        this.material.uniforms.cols.value = cols
        this.material.uniforms.resolution.value.set(this.sizes.width, this.sizes.height)
        this.buildGrid(cols, rows)
    }

    animate() {
        if (this.stats)
            this.stats.begin()

        if (!this.clock) this.clock = new THREE.Clock() // lazy initialization
        let delta = this.clock.getDelta() // delta in secondes

        // holdtimes updaten
        for (let i = 0; i < this.mesh.count; i++) {
            if (this.holdTimes[i] > 0) {
                // tijd aftellen met delta
                this.holdTimes[i] = Math.max(0, this.holdTimes[i] - delta)
                if (this.holdTimes[i] === 0) this.hovers[i] = 0 // hover uitzetten
            }
        }
        // instanceHover updaten voor de shader
        this.mesh.geometry.attributes.instanceHover.needsUpdate = true

        this.renderer.render(this.scene, this.camera)

        if (this.stats)
            this.stats.end()

        requestAnimationFrame(() => this.animate())
    }
}
