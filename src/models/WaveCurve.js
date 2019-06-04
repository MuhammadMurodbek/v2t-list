class WaveCurve {
  constructor(opt) {
    this.opt = opt || {}
    this.controller = opt.controller
    this.color = opt.color
    this.tick = 0
    this.respawn = this.respawn.bind(this)
    this.equation = this.equation.bind(this)
    this.drawAlt = this.equation.bind(this)
    this.draw = this.draw.bind(this)
    this.respawn()
  }

  respawn() {
    this.amplitude = 0.3 + (Math.random() * 0.7)
    this.seed = Math.random()
    this.open_class = 2 + (Math.random() * 3) || 0
  }

  equation(i) {
    const p = this.tick
    const y = (-1 * Math.abs(Math.sin(p)))
      * (this.controller.amplitude * this.amplitude)
      * this.controller.MAX * (1 / ((1 + ((this.open_class * i) ** 2)) ** 2))
    if (Math.abs(y) < 0.001) {
      this.respawn()
    }
    return y
  }

  dram(m) {
    const { speed, ctx } = this.controller
    this.tick += speed * (1 - (0.5 * Math.sin(this.seed * Math.PI)))
    ctx.beginPath()
    const xBase = (this.controller.width / 2)
      + ((-this.controller.width / 4)
      + (this.seed * (this.controller.width / 2)))
    const yBase = this.controller.height / 2
    let x
    let y
    let xInit
    let i = -3
    while (i <= 3) {
      x = xBase + ((i * this.controller.width) / 4)
      y = yBase + (m * this.equation(i))
      xInit = xInit || x
      ctx.lineTo(x, y)
      i += 0.01
    }

    const h = Math.abs(this.equation(0))
    const gradient = ctx.createRadialGradient(xBase, yBase, h * 1.15, xBase, yBase, h * 0.3)
    gradient.addColorStop(0, `rgba(${this.color.join(',')},0.4)`)
    gradient.addColorStop(1, `rgba(${this.color.join(',')},0.2)`)
    ctx.fillStyle = gradient
    ctx.lineTo(xInit, yBase)
    ctx.closePath()
    ctx.fill()
  }

  draw() {
    this.dram(-1)
    this.dram(1)
  }
}

export default WaveCurve
