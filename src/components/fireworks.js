// ── Fireworks ("crackers") burst ───────────────────────────────────────
// Rockets shoot up from the bottom leaving a glittering trail, then pop
// into a shower of glowing sparks. Used for a correct answer.
//
// Time-based (not frame-based), so it runs at the same speed on 60 Hz and
// 120 Hz phones and always finishes in about 1.5 seconds.

const ROCKET_COLORS = ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b']
const SPARK_COLORS = ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b', '#cc5de8', '#ffc94d']

const RISE_MS = 430      // launch → pop
const SPARK_MS = 950     // how long the sparks live after the pop
const rand = (a, b) => a + Math.random() * (b - a)
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

function glowDot(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return
  ctx.globalAlpha = alpha * 0.35
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = alpha
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
}

export function startFireworks(canvas, ctx, { rockets: rocketCount = 3 } = {}) {
  const W = canvas.width, H = canvas.height
  const unit = Math.min(W, H) / 400            // scales sizes to the screen
  const rockets = []
  for (let i = 0; i < rocketCount; i++) {
    // Spread the pops across the width so they don't stack on each other
    const slot = (i + 0.5) / rocketCount
    const tx = W * (slot + rand(-0.1, 0.1))
    const ty = H * rand(0.2, 0.42)
    rockets.push({
      delay: i * 90 + rand(0, 40),
      sx: tx + rand(-0.22, 0.22) * W, sy: H + 10,
      tx, ty,
      color: ROCKET_COLORS[(i + Math.floor(Math.random() * 6)) % ROCKET_COLORS.length],
      trail: [], sparks: null,
    })
  }

  let raf = null, start = null, last = null

  function frame(now) {
    if (start === null) { start = now; last = now }
    const t = now - start
    const dt = Math.min(50, now - last) / 16.667   // 1 = one 60 Hz frame
    last = now
    ctx.clearRect(0, 0, W, H)
    ctx.save()
    let alive = false

    for (const r of rockets) {
      const rt = t - r.delay
      if (rt < 0) { alive = true; continue }

      // Glitter trail left behind by the rocket
      for (const d of r.trail) {
        d.age += dt
        d.y += 0.25 * dt
        const a = 1 - d.age / d.life
        if (a > 0) {
          alive = true
          glowDot(ctx, d.x, d.y, d.r, d.color, a * (0.6 + 0.4 * Math.sin(d.age * 0.9 + d.ph)))
        }
      }

      if (rt < RISE_MS) {
        alive = true
        const p = rt / RISE_MS
        const e = 1 - Math.pow(1 - p, 2.2)        // fast off the ground, slowing at the top
        const x = r.sx + (r.tx - r.sx) * e
        const y = r.sy + (r.ty - r.sy) * e
        // Emit glitter by elapsed time so the trail is equally dense at any frame rate
        r.emit = (r.emit || 0) + dt * 2.5
        for (; r.emit >= 1; r.emit--) {
          r.trail.push({
            x: x + rand(-3, 3) * unit, y: y + rand(-3, 3) * unit,
            r: rand(1.4, 3) * unit, age: 0, life: rand(14, 26), ph: rand(0, 6),
            color: Math.random() < 0.3 ? '#ffc94d' : r.color,
          })
        }
        glowDot(ctx, x, y, 3.6 * unit, r.color, 1)
        continue
      }

      if (!r.sparks) {
        r.sparks = []
        const n = 60
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2 + rand(-0.15, 0.15)
          const sp = rand(2.2, 7.5) * unit
          r.sparks.push({
            x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            r: rand(1.8, 3.6) * unit, ph: rand(0, 6), life: rand(0.65, 1),
            color: Math.random() < 0.55 ? r.color : pick(SPARK_COLORS),
          })
        }
      }

      const bt = rt - RISE_MS
      // Bright flash at the moment of the pop
      if (bt < 180) {
        alive = true
        const a = 1 - bt / 180
        const rad = (30 + 70 * (bt / 180)) * unit
        const g = ctx.createRadialGradient(r.tx, r.ty, 0, r.tx, r.ty, rad)
        g.addColorStop(0, `rgba(255,236,170,${0.95 * a})`)
        g.addColorStop(0.3, `rgba(255,200,90,${0.5 * a})`)
        g.addColorStop(1, 'rgba(255,200,120,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(r.tx, r.ty, rad, 0, Math.PI * 2); ctx.fill()
      }

      for (const s of r.sparks) {
        const lifeMs = SPARK_MS * s.life
        if (bt >= lifeMs) continue
        alive = true
        const drag = Math.pow(0.93, dt)
        s.vx *= drag; s.vy *= drag
        s.vy += 0.07 * unit * dt                   // sparks sag gently as they fade
        s.x += s.vx * dt; s.y += s.vy * dt
        const p = bt / lifeMs
        const fade = p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5
        const twinkle = 0.65 + 0.35 * Math.sin(bt * 0.03 + s.ph)
        ctx.fillStyle = s.color
        glowDot(ctx, s.x, s.y, s.r * (1 - p * 0.4), s.color, fade * twinkle)
      }
    }

    ctx.restore()
    if (alive) raf = requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, W, H)
  }

  raf = requestAnimationFrame(frame)
  return () => { if (raf) cancelAnimationFrame(raf) }
}
