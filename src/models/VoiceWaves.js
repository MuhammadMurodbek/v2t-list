import WaveCurve from './WaveCurve'

class VoiceWaves {
  constructor(opt) {
    this.opt = opt || {}
    this.tick = 0
    this.run = false
    // UI vars
    this.ratio = this.opt.ratio || window.devicePixelRatio || 1
    this.width = this.ratio * (this.opt.width || 320)
    this.height = this.ratio * (this.opt.height || 100)
    this.MAX = this.height / 2
    this.speed = 0.1
    this.amplitude = this.opt.amplitude || 1
    // Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.width = `${this.width / this.ratio}px`
    this.canvas.style.height = `${this.height / this.ratio}px`
    this.container = this.opt.container || document.body
    this.container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.ctx = this.canvas.getContext('2d', { alpha: false })

    // Create curves
    this.curves = []
    // Colors
    this.colors = [
      [164, 226, 178],
      [83, 201, 248],
      [4, 53, 121]
    ]

    this.init = this.init.bind(this)
    this.clear = this.clear.bind(this)
    this.draw = this.draw.bind(this)
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)

    this.init()
  }

  init() {
    const vm = this
    for (let i = 0; i < vm.colors.length; i += 1) {
      const color = vm.colors[i]
      for (let j = 0; j < (3 * Math.random()) || 0; j += 1) {
        vm.curves.push(new WaveCurve({
          controller: vm,
          color
        }))
      }
    }
    if (vm.opt.autostart) {
      vm.start()
    }
  }

  clear() {
    this.ctx.globalCompositeOperation = 'destination-out'
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.globalCompositeOperation = 'lighter'
  }

  draw() {
    if (this.run === false) return
    this.clear()
    const len = this.curves.length
    for (let i = 0; i < len; i += 1) {
      this.curves[i].draw()
    }
    requestAnimationFrame(this.draw.bind(this))
  }

  start() {
    this.tick = 0
    this.run = true
    this.draw()
  }

  stop() {
    this.tick = 0
    this.run = false
  }
}

export default VoiceWaves
