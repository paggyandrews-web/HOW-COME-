import { useEffect, useRef } from 'react'
import { playChime } from '../utils/sound'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997']
const GOLD_COLORS = ['#ffd700', '#ffc107', '#ffab00', '#fff176', '#ff6b6b', '#4d96ff']
const FIRE_COLORS = ['#ff4500', '#ff6b35', '#f7931e', '#ffb347', '#dc143c']

const GRAVITY = 0.45

function randomBetween(a, b) { return a + Math.random() * (b - a) }

function createParticle(canvas, { colors, speedMult = 1 }) {
  // Velocity needed for the tallest bursts to clear the top of the screen
  // (with a bit of overshoot), derived from actual screen height so this
  // scales correctly on any device.
  const baseV = Math.sqrt(2 * GRAVITY * canvas.height * 1.15) * speedMult

  return {
    x: randomBetween(canvas.width * 0.05, canvas.width * 0.95),
    y: canvas.height - randomBetween(0, 30), // launch from the bottom edge
    vx: randomBetween(-3, 3) * speedMult,
    vy: -randomBetween(baseV * 0.55, baseV * 1.05), // burst upward
    color: colors[Math.floor(Math.random() * colors.length)],
    width: randomBetween(6, 14),
    height: randomBetween(4, 8),
    rotation: randomBetween(0, 360),
    rotSpeed: randomBetween(-8, 8),
    opacity: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }
}

// Embers drift upward and flicker instead of arcing and falling — a
// distinct silhouette from confetti, reserved for streak milestones.
function createEmber(canvas) {
  return {
    x: randomBetween(canvas.width * 0.15, canvas.width * 0.85),
    y: canvas.height - randomBetween(0, 20),
    vx: randomBetween(-0.6, 0.6),
    vy: -randomBetween(1.2, 3.2),
    wobble: randomBetween(0, Math.PI * 2),
    wobbleSpeed: randomBetween(0.05, 0.12),
    color: FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)],
    size: randomBetween(4, 10),
    life: randomBetween(60, 110), // frames until fully burned out
    age: 0,
    flicker: randomBetween(0, Math.PI * 2),
  }
}

function drawConfettiParticle(ctx, p) {
  ctx.save()
  ctx.globalAlpha = p.opacity
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)
  ctx.fillStyle = p.color
  if (p.shape === 'circle') {
    ctx.beginPath()
    ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
  }
  ctx.restore()
}

function drawEmber(ctx, p) {
  const lifeRatio = 1 - p.age / p.life
  ctx.save()
  ctx.globalAlpha = Math.max(0, lifeRatio) * (0.6 + 0.4 * Math.sin(p.flicker))
  ctx.translate(p.x, p.y)
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
  grad.addColorStop(0, p.color)
  grad.addColorStop(1, 'rgba(255,80,0,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(0, 0, p.size * (1 - lifeRatio * 0.3), p.size * 1.3 * (1 - lifeRatio * 0.3), 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * Confetti — renders a burst of canvas confetti or ember particles.
 *
 * Props:
 *   active  (bool)              — set to true to fire the burst.
 *   tier    ('normal' | 'big')  — 'big' = more particles, faster, gold-tinted.
 *                                  Used for standout wins (perfect score, milestone).
 *   variant ('confetti'|'fire') — 'fire' renders drifting embers instead of
 *                                  confetti, reserved for streak milestones.
 *
 * Haptic + sound feedback only fires for tier="big" or variant="fire" —
 * routine per-answer confetti already gets a tap-vibration from the answer
 * handler, so adding it here too would double-buzz on the common case.
 */
export default function Confetti({ active, tier = 'normal', variant = 'confetti' }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    const isBig = tier === 'big'
    const isFire = variant === 'fire'

    // Standout moments get a tactile + audible cue alongside the visuals.
    if (isBig || isFire) {
      if (navigator.vibrate) navigator.vibrate(isFire ? [25, 40, 25, 40, 60] : [30, 30, 60])
      playChime(isFire ? 'fire' : 'big')
    }

    let particles = []
    let frame = 0

    if (isFire) {
      const count = isBig ? 90 : 60
      for (let i = 0; i < count; i++) {
        const p = createEmber(canvas)
        p.launchDelay = Math.floor(randomBetween(0, 20))
        particles.push(p)
      }
    } else {
      const count = isBig ? 260 : 160
      const colors = isBig ? GOLD_COLORS : COLORS
      const speedMult = isBig ? 1.15 : 1
      for (let i = 0; i < count; i++) {
        const p = createParticle(canvas, { colors, speedMult })
        p.launchDelay = Math.floor(randomBetween(0, isBig ? 20 : 14))
        particles.push(p)
      }
    }

    function drawConfettiFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      let anyVisible = false

      for (const p of particles) {
        if (frame < p.launchDelay) { anyVisible = true; continue }

        p.x  += p.vx
        p.y  += p.vy
        p.vy += GRAVITY
        p.vx *= 0.995
        p.rotation += p.rotSpeed

        if (p.y > canvas.height + 10) {
          p.opacity = Math.max(0, p.opacity - 0.06)
        }

        if (p.opacity <= 0.02) continue
        anyVisible = true
        drawConfettiParticle(ctx, p)
      }

      if (anyVisible) {
        animRef.current = requestAnimationFrame(drawConfettiFrame)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    function drawFireFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      let anyVisible = false

      for (const p of particles) {
        if (frame < p.launchDelay) { anyVisible = true; continue }

        p.age += 1
        p.wobble += p.wobbleSpeed
        p.flicker += 0.3
        p.x += p.vx + Math.sin(p.wobble) * 0.4
        p.y += p.vy
        p.vy *= 0.985 // embers decelerate as they rise, unlike confetti's gravity arc

        if (p.age >= p.life) continue
        anyVisible = true
        drawEmber(ctx, p)
      }

      if (anyVisible) {
        animRef.current = requestAnimationFrame(drawFireFrame)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animRef.current = requestAnimationFrame(isFire ? drawFireFrame : drawConfettiFrame)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active, tier, variant])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}
