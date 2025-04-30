export default class CanvasGrid {
    
    static isMobile() {
      return window.innerWidth < 768;
    }
  
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      // device pixel ratio voor scherpte op high-DPI schermen
      this.dpr = window.devicePixelRatio || 1;
  
      this.properties = {
        gridBreakpoints: [
          { minWidth: 1200, cols: 28 },
          { minWidth:  768, cols: 22 },
          { minWidth:    0, cols: 12 },
        ],
        fillColor:   '#ffffff',
        borderColor: '#dad8c8',
      };
  
      this.resize();
      window.addEventListener('resize', () => this.resize());
  
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  
    resize() {
      this.width  = window.innerWidth;
      this.height = window.innerHeight;
      // pas canvas drawing buffer aan voor dpr
      this.canvas.width  = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      // CSS-grootte op 1:1 houden
      this.canvas.style.width  = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      // scale context zodat 1 eenheid = 1 CSS-pixel
      this.ctx.resetTransform();
      this.ctx.scale(this.dpr, this.dpr);
  
      const bp = this.properties.gridBreakpoints
        .find(b => this.width >= b.minWidth);
      this.cols = bp.cols;
      this.rows = Math.ceil(this.cols * (this.height / this.width));
      this.cellW = this.width  / this.cols;
      this.cellH = this.height / this.rows;
  
      this.drawGrid();
    }
  
    drawGrid() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.fillStyle = this.properties.fillColor;
  
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const x = col * this.cellW;
          const y = row * this.cellH;
  
          // fill background
          ctx.fillRect(x, y, this.cellW, this.cellH);
  
          // draw border
          ctx.strokeStyle = this.properties.borderColor;
          ctx.lineWidth = .5;
          ctx.strokeRect(x, y, this.cellW, this.cellH);
        }
      }
    }
  }
  