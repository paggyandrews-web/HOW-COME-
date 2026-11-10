// ── Fireworks ("crackers") burst ───────────────────────────────────────
// Rockets shoot up from the bottom leaving a glittering trail, then pop
// into a shower of glowing sparks. Used for a correct answer.
//
// Two themes:
//   'diwali'    — multicolour round sparks
//   'christmas' — red / green / gold rockets that pop into little stars,
//                 with snowflakes drifting down from the top
//
// Time-based (not frame-based), so it runs at the same speed on 60 Hz and
// 120 Hz phones and always finishes in about 1.5 seconds.

const THEMES = {
  diwali: {
    rockets: ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b'],
    sparks: ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b', '#cc5de8', '#ffc94d'],
    glitter: '#ffc94d',
    stars: false,
    snow: false,
  },
  christmas: {
    rockets: ['#e63946', '#2a9d58', '#f4b400'],
    sparks: ['#e63946', '#ff4d5e', '#2a9d58', '#3cc46f', '#f4b400', '#ffd54a'],
    glitter: '#ffd54a',
    stars: true,
    snow: true,
  },
}

const RISE_MS = 430      // launch → pop
const SPARK_MS = 950     // how long the sparks live after the pop
const rand = (a, b) => a + Math.random() * (b - a)
const pick = arr => arr[Math.floor(Math.random() * arr.length)]

// A 5-point star with a soft glow behind it
function glowStar(ctx, x, y, r, color, alpha, rot) {
  if (alpha <= 0.01) return
  ctx.globalAlpha = alpha * 0.3
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = alpha
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2
    const rr = i % 2 === 0 ? r * 1.35 : r * 0.55
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath(); ctx.fill()
}

// A six-armed snowflake. Icy blue with a white core so it shows on both
// the light and the dark theme.
function snowflake(ctx, x, y, r, alpha, rot) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.translate(x, y); ctx.rotate(rot)
  ctx.globalAlpha = alpha
  ctx.lineCap = 'round'
  for (const [w, c] of [[r * 0.42, '#5aa9e6'], [r * 0.18, '#ffffff']]) {
    ctx.strokeStyle = c; ctx.lineWidth = w
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3
      const ex = Math.cos(a) * r, ey = Math.sin(a) * r
      ctx.moveTo(0, 0); ctx.lineTo(ex, ey)
      // little side branches
      const bx = Math.cos(a) * r * 0.6, by = Math.sin(a) * r * 0.6
      for (const s of [-1, 1]) {
        const ba = a + s * 0.7
        ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ba) * r * 0.32, by + Math.sin(ba) * r * 0.32)
      }
    }
    ctx.stroke()
  }
  ctx.restore()
}

function glowDot(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return
  ctx.globalAlpha = alpha * 0.35
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = alpha
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
}

export function startFireworks(canvas, ctx, { rockets: rocketCount = 3, theme = 'diwali' } = {}) {
  const T = THEMES[theme] || THEMES.diwali
  const ROCKET_COLORS = T.rockets, SPARK_COLORS = T.sparks
  const W = canvas.width, H = canvas.height
  const unit = Math.min(W, H) / 400            // scales sizes to the screen

  // Snowflakes fall from above the top edge for the length of the show
  const flakes = []
  if (T.snow) {
    const n = Math.round(14 + W / 40)
    for (let i = 0; i < n; i++) {
      flakes.push({
        x: rand(0, W), y: rand(-H * 0.12, H * 0.1),
        vy: rand(3.2, 5.6) * unit, sway: rand(0.6, 1.6) * unit, ph: rand(0, 6),
        r: rand(5.5, 10) * unit, rot: rand(0, 6), spin: rand(-0.04, 0.04),
        delay: rand(0, 300),
      })
    }
  }
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
      color: ROCKET_COLORS[(i + Math.floor(Math.random() * ROCKET_COLORS.length)) % ROCKET_COLORS.length],
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
            color: Math.random() < 0.3 ? T.glitter : r.color,
          })
        }
        glowDot(ctx, x, y, 3.6 * unit, r.color, 1)
        continue
      }

      if (!r.sparks) {
        r.sparks = []
        const n = T.stars ? 34 : 60
        for (let k = 0; k < n; k++) {
          const ang = (k / n) * Math.PI * 2 + rand(-0.15, 0.15)
          const sp = rand(2.2, 7.5) * unit
          r.sparks.push({
            x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
            r: (T.stars ? rand(2.6, 4.4) : rand(1.8, 3.6)) * unit, ph: rand(0, 6), life: rand(0.65, 1),
            rot: rand(0, 6), spin: rand(-0.15, 0.15),
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
        if (T.stars) {
          s.rot += s.spin * dt
          glowStar(ctx, s.x, s.y, s.r * (1 - p * 0.35), s.color, fade * twinkle, s.rot)
        } else {
          glowDot(ctx, s.x, s.y, s.r * (1 - p * 0.4), s.color, fade * twinkle)
        }
      }
    }

    // Snow drifts down behind the last bursts and fades out with them
    const END = 1500
    for (const f of flakes) {
      const ft = t - f.delay
      if (ft < 0 || ft > END) { if (ft < 0) alive = true; continue }
      alive = true
      f.y += f.vy * dt
      f.rot += f.spin * dt
      const x = f.x + Math.sin(ft * 0.004 + f.ph) * f.sway * 8
      const fadeIn = Math.min(1, ft / 200)
      const fadeOut = ft > END - 350 ? (END - ft) / 350 : 1
      snowflake(ctx, x, f.y, f.r, 0.9 * fadeIn * fadeOut, f.rot)
    }

    ctx.restore()
    if (alive) raf = requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, W, H)
  }

  raf = requestAnimationFrame(frame)
  return () => { if (raf) cancelAnimationFrame(raf) }
}
