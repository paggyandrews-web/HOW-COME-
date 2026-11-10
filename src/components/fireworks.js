// ── Fireworks ("crackers") burst ───────────────────────────────────────
// Rockets shoot up from the bottom leaving a glittering trail, then pop
// into a shower of glowing sparks. Used for a correct answer.
//
// Two themes:
//   'diwali'    — multicolour round sparks
//   'christmas' — one big cracker that bursts into baubles, shiny stars,
//                 candy canes and gift boxes, with snowflakes drifting down
//   'onam'      — bursts open like a pookalam: rings of petals (yellow
//                 inside, orange / red / purple outside), petals drifting down
//   'vishu'     — golden crackers with kani-konna flowers falling
//
// Time-based (not frame-based), so it runs at the same speed on 60 Hz and
// 120 Hz phones and always finishes in about 1.5 seconds.

const THEMES = {
  diwali: {
    rockets: ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b'],
    sparks: ['#ffd93d', '#ff4fa3', '#ff922b', '#6bcb77', '#4d96ff', '#ff6b6b', '#cc5de8', '#ffc94d'],
    glitter: '#ffc94d',
    spark: 'dot',
    fall: null,
  },
  christmas: {
    rockets: ['#e63946', '#2a9d58', '#f4b400'],
    sparks: ['#e63946', '#ff4d5e', '#2a9d58', '#3cc46f', '#f4b400', '#ffd54a'],
    glitter: '#ffd54a',
    spark: 'ornaments',
    rockets_n: 1,
    fall: 'snow',
  },
  onam: {
    rockets: ['#ff8c00', '#f4b400', '#d7263d'],
    sparks: ['#ffc300', '#ff8c00', '#d7263d', '#9b4dca'],
    // pookalam rings: inner ring, outer ring
    rings: [['#ffd000', '#ffb300'], ['#ff7a00', '#d7263d', '#9b4dca']],
    glitter: '#ffc300',
    spark: 'petal',
    fall: 'petals',
  },
  vishu: {
    rockets: ['#f4b400', '#ff9f1c', '#ffd000'],
    sparks: ['#ffd000', '#f4b400', '#ffe066', '#ff9f1c', '#ff6b35'],
    glitter: '#ffe066',
    spark: 'dot',
    fall: 'konna',
  },
}

const FALL_PETAL_COLORS = ['#ffc300', '#ff8c00', '#d7263d', '#9b4dca', '#ffb300']

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

// ── Christmas ornaments ──
const BAUBLE_COLORS = ['#e63946', '#2a9d58', '#1f6feb', '#c0392b', '#8e44ad', '#f4b400']
const GIFT_COLORS = [['#e63946', '#f4d35e'], ['#2a9d58', '#f4d35e'], ['#1f6feb', '#ffffff'], ['#f4b400', '#e63946']]

function bauble(ctx, r, color) {
  // hanging loop + gold cap
  ctx.strokeStyle = '#b8860b'; ctx.lineWidth = Math.max(1, r * 0.12)
  ctx.beginPath(); ctx.arc(0, -r * 1.22, r * 0.2, 0, Math.PI * 2); ctx.stroke()
  ctx.fillStyle = '#d4a017'
  ctx.fillRect(-r * 0.32, -r * 1.12, r * 0.64, r * 0.3)
  // shiny ball
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r)
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, color); g.addColorStop(1, color)
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = Math.max(0.8, r * 0.08); ctx.stroke()
  // a band of gold across the middle
  ctx.strokeStyle = 'rgba(255,215,90,0.85)'; ctx.lineWidth = r * 0.16
  ctx.beginPath(); ctx.ellipse(0, r * 0.1, r * 0.97, r * 0.28, 0, 0.15, Math.PI - 0.15); ctx.stroke()
}

function shinyStar(ctx, r, glint) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2
    const rr = i % 2 === 0 ? r * 1.25 : r * 0.52
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
  const g = ctx.createLinearGradient(-r, -r, r, r)
  g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffc400'); g.addColorStop(1, '#e09b00')
  ctx.fillStyle = g; ctx.fill()
  ctx.strokeStyle = '#c47f00'; ctx.lineWidth = Math.max(0.8, r * 0.08); ctx.stroke()
  // twinkling four-ray glint
  if (glint > 0.05) {
    ctx.globalAlpha *= glint
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.lineCap = 'round'
    const L = r * 1.6
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.moveTo(0, -L); ctx.lineTo(0, L); ctx.stroke()
  }
}

function candyCane(ctx, r) {
  const w = r * 0.42
  const path = () => {
    ctx.beginPath()
    ctx.moveTo(r * 0.3, r * 1.3)
    ctx.lineTo(r * 0.3, -r * 0.45)
    ctx.arc(-r * 0.25, -r * 0.45, r * 0.55, 0, Math.PI, true)
    ctx.lineTo(-r * 0.8, -r * 0.15)
  }
  ctx.lineCap = 'round'
  path(); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = w + Math.max(1, r * 0.1); ctx.stroke()
  path(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w; ctx.stroke()
  ctx.setLineDash([r * 0.32, r * 0.32])
  path(); ctx.strokeStyle = '#e63946'; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.stroke()
  ctx.setLineDash([])
}

function gift(ctx, r, [box, ribbon]) {
  const s = r * 0.9
  ctx.fillStyle = box
  ctx.fillRect(-s, -s * 0.7, s * 2, s * 1.7)
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = Math.max(0.8, r * 0.08)
  ctx.strokeRect(-s, -s * 0.7, s * 2, s * 1.7)
  ctx.fillStyle = ribbon
  ctx.fillRect(-s * 0.18, -s * 0.7, s * 0.36, s * 1.7)
  ctx.fillRect(-s, s * 0.05, s * 2, s * 0.3)
  // bow
  ctx.beginPath(); ctx.ellipse(-s * 0.35, -s * 0.85, s * 0.35, s * 0.2, -0.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(s * 0.35, -s * 0.85, s * 0.35, s * 0.2, 0.5, 0, Math.PI * 2); ctx.fill()
}

function ornament(ctx, o, alpha, t) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.translate(o.x, o.y); ctx.rotate(o.rot)
  ctx.globalAlpha = alpha
  if (o.kind === 'bauble') bauble(ctx, o.r, o.color)
  else if (o.kind === 'star') shinyStar(ctx, o.r, Math.max(0, Math.sin(t * 0.012 + o.ph)))
  else if (o.kind === 'cane') candyCane(ctx, o.r)
  else gift(ctx, o.r, o.gift)
  ctx.restore()
}

// A single flower petal, pointed along its direction of travel
function petal(ctx, x, y, r, color, alpha, rot) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.translate(x, y); ctx.rotate(rot)
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-r * 1.5, 0)
  ctx.quadraticCurveTo(0, -r * 0.95, r * 1.5, 0)
  ctx.quadraticCurveTo(0, r * 0.95, -r * 1.5, 0)
  ctx.fill()
  ctx.globalAlpha = alpha * 0.45
  ctx.strokeStyle = 'rgba(120,40,0,0.6)'
  ctx.lineWidth = Math.max(0.6, r * 0.15)
  ctx.beginPath(); ctx.moveTo(-r * 1.2, 0); ctx.lineTo(r * 1.2, 0); ctx.stroke()
  ctx.restore()
}

// Kani-konna (golden shower) flower: five round yellow petals, orange heart
function konna(ctx, x, y, r, alpha, rot) {
  if (alpha <= 0.01) return
  ctx.save()
  ctx.translate(x, y); ctx.rotate(rot)
  ctx.globalAlpha = alpha
  ctx.fillStyle = '#ffd000'
  ctx.strokeStyle = '#d99a00'
  ctx.lineWidth = Math.max(0.6, r * 0.12)
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5
    ctx.beginPath()
    ctx.ellipse(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.55, r * 0.42, a, 0, Math.PI * 2)
    ctx.fill(); ctx.stroke()
  }
  ctx.fillStyle = '#e67e00'
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill()
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

export function startFireworks(canvas, ctx, { rockets: rocketsOpt, theme = 'diwali' } = {}) {
  const T = THEMES[theme] || THEMES.diwali
  const rocketCount = rocketsOpt || T.rockets_n || 3
  const ROCKET_COLORS = T.rockets, SPARK_COLORS = T.sparks
  const W = canvas.width, H = canvas.height
  const unit = Math.min(W, H) / 400            // scales sizes to the screen

  // Snowflakes fall from above the top edge for the length of the show
  const flakes = []
  if (T.fall) {
    const n = Math.round((T.fall === 'snow' ? 14 : 10) + W / (T.fall === 'snow' ? 40 : 55))
    for (let i = 0; i < n; i++) {
      flakes.push({
        x: rand(0, W), y: rand(-H * 0.12, H * 0.1),
        vy: rand(3.2, 5.6) * unit, sway: rand(0.6, 1.6) * unit, ph: rand(0, 6),
        r: rand(5.5, 10) * unit, rot: rand(0, 6), spin: rand(-0.04, 0.04),
        delay: rand(0, 300),
        color: pick(FALL_PETAL_COLORS),
      })
    }
  }
  const rockets = []
  for (let i = 0; i < rocketCount; i++) {
    // Spread the pops across the width so they don't stack on each other
    const slot = (i + 0.5) / rocketCount
    const tx = W * (slot + rand(-0.1, 0.1) / rocketCount)
    const ty = rocketCount === 1 ? H * rand(0.3, 0.36) : H * rand(0.2, 0.42)
    rockets.push({
      delay: i * 90 + rand(0, 40),
      sx: tx + rand(-0.22, 0.22) * W / rocketCount, sy: H + 10,
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
        glowDot(ctx, x, y, (rocketCount === 1 ? 5.5 : 3.6) * unit, r.color, 1)
        continue
      }

      if (!r.sparks) {
        r.sparks = []
        if (T.spark === 'ornaments') {
          // One burst of ornaments, flung out in a ring, then tumbling down
          const kinds = ['bauble', 'bauble', 'bauble', 'star', 'star', 'star', 'cane', 'cane', 'gift']
          const n = Math.round(16 + W / 65)
          for (let k = 0; k < n; k++) {
            const ang = (k / n) * Math.PI * 2 + rand(-0.2, 0.2)
            const sp = rand(4, 10) * unit
            const kind = kinds[k % kinds.length]
            r.sparks.push({
              ornament: true, kind,
              x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1.5 * unit,
              r: (kind === 'star' ? rand(9.5, 13) : kind === 'cane' ? rand(12, 15.5) : rand(10, 13.5)) * unit,
              rot: kind === 'bauble' ? rand(-0.4, 0.4) : rand(0, 6), spin: rand(-0.08, 0.08),
              ph: rand(0, 6), color: pick(BAUBLE_COLORS), gift: pick(GIFT_COLORS),
            })
          }
          // plus a sprinkle of gold glitter
          for (let k = 0; k < 26; k++) {
            const ang = rand(0, Math.PI * 2), sp = rand(2, 7) * unit
            r.sparks.push({
              x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              r: rand(1.6, 3) * unit, ph: rand(0, 6), life: rand(0.6, 1),
              color: pick(['#ffd54a', '#ffffff', '#ffc400']),
            })
          }
        } else if (T.rings) {
          // Pookalam: two neat rings of petals, inner and outer
          const rings = [[14, 2.6, 3.2], [22, 5.6, 6.4]]
          rings.forEach(([n, lo, hi], ri) => {
            const off = rand(0, Math.PI)
            for (let k = 0; k < n; k++) {
              const ang = off + (k / n) * Math.PI * 2
              const sp = rand(lo, hi) * unit
              r.sparks.push({
                x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
                r: (ri ? rand(2.8, 3.6) : rand(2.4, 3)) * unit, ph: rand(0, 6), life: rand(0.8, 1),
                color: pick(T.rings[ri]),
              })
            }
          })
        } else {
          const n = T.spark === 'star' ? 34 : 60
          for (let k = 0; k < n; k++) {
            const ang = (k / n) * Math.PI * 2 + rand(-0.15, 0.15)
            const sp = rand(2.2, 7.5) * unit
            r.sparks.push({
              x: r.tx, y: r.ty, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
              r: (T.spark === 'star' ? rand(2.6, 4.4) : rand(1.8, 3.6)) * unit, ph: rand(0, 6), life: rand(0.65, 1),
              rot: rand(0, 6), spin: rand(-0.15, 0.15),
              color: Math.random() < 0.55 ? r.color : pick(SPARK_COLORS),
            })
          }
        }
      }

      const bt = rt - RISE_MS
      // Bright flash at the moment of the pop
      if (bt < 180) {
        alive = true
        const a = 1 - bt / 180
        const rad = (30 + 70 * (bt / 180)) * unit * (rocketCount === 1 ? 1.5 : 1)
        const g = ctx.createRadialGradient(r.tx, r.ty, 0, r.tx, r.ty, rad)
        g.addColorStop(0, `rgba(255,236,170,${0.95 * a})`)
        g.addColorStop(0.3, `rgba(255,200,90,${0.5 * a})`)
        g.addColorStop(1, 'rgba(255,200,120,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(r.tx, r.ty, rad, 0, Math.PI * 2); ctx.fill()
      }

      for (const s of r.sparks) {
        if (s.ornament) {
          const ORN_MS = 1500
          if (bt >= ORN_MS) continue
          alive = true
          const drag = Math.pow(0.95, dt)
          s.vx *= drag; s.vy = s.vy * drag + 0.22 * unit * dt   // flung out, then fall
          s.x += s.vx * dt; s.y += s.vy * dt
          s.rot += s.spin * dt
          const p = bt / ORN_MS
          const pop = Math.min(1, bt / 120)                       // grow in from the burst
          s._r0 = s._r0 || s.r
          const o = { ...s, r: s._r0 * (0.4 + 0.6 * pop) }
          ornament(ctx, o, p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35, bt)
          continue
        }
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
        if (T.spark === 'star') {
          s.rot += s.spin * dt
          glowStar(ctx, s.x, s.y, s.r * (1 - p * 0.35), s.color, fade * twinkle, s.rot)
        } else if (T.spark === 'petal') {
          // petals don't twinkle; they point the way they fly and tumble as they slow
          const heading = Math.atan2(s.vy, s.vx)
          petal(ctx, s.x, s.y, s.r * (1 - p * 0.25), s.color, fade, heading + p * 1.2)
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
      const a = 0.9 * fadeIn * fadeOut
      if (T.fall === 'snow') snowflake(ctx, x, f.y, f.r, a, f.rot)
      else if (T.fall === 'konna') konna(ctx, x, f.y, f.r * 0.85, a, f.rot)
      else petal(ctx, x, f.y, f.r * 0.6, f.color, a, f.rot * 3)
    }

    ctx.restore()
    if (alive) raf = requestAnimationFrame(frame)
    else ctx.clearRect(0, 0, W, H)
  }

  raf = requestAnimationFrame(frame)
  return () => { if (raf) cancelAnimationFrame(raf) }
}
