import { useEffect, useRef } from 'react'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997']
const GRAVITY = 0.45

function randomBetween(a, b) { return a + Math.random() * (b - a) }

function createParticle(canvas) {
  // Velocity needed for the tallest bursts to clear the top of the screen
  // (with a bit of overshoot), derived from actual screen height so this
  // scales correctly on any device.
  const baseV = Math.sqrt(2 * GRAVITY * canvas.height * 1.15)

  return {
    x: randomBetween(canvas.width * 0.05, canvas.width * 0.95),
    y: canvas.height - randomBetween(0, 30), // launch from the bottom edge
    vx: randomBetween(-3, 3),
    vy: -randomBetween(baseV * 0.55, baseV * 1.05), // burst upward
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: randomBetween(6, 14),
    height: randomBetween(4, 8),
    rotation: randomBetween(0, 360),
    rotSpeed: randomBetween(-8, 8),
    opacity: 1,
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
  }
}

/**
 * Confetti — renders a burst of canvas confetti.
 * Props: active (bool) — set to true to fire the confetti.
 */
export default function Confetti({ active }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')

    // Generate particles, staggered so the burst erupts over a few frames
    // rather than all at once — gives it a fuller, more "magical" feel.
    const particles = []
    for (let i = 0; i < 160; i++) {
      const p = createParticle(canvas)
      p.launchDelay = Math.floor(randomBetween(0, 14)) // frames before this one fires
      particles.push(p)
    }

    let frame = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      let anyVisible = false

      for (const p of particles) {
        if (frame < p.launchDelay) {
          anyVisible = true
          continue // hasn't launched yet
        }

        p.x  += p.vx
        p.y  += p.vy
        p.vy += GRAVITY
        p.vx *= 0.995 // air friction
        p.rotation += p.rotSpeed

        // Only fade once it's actually fallen back below the bottom edge,
        // so the full up-and-down arc stays fully visible.
        if (p.y > canvas.height + 10) {
          p.opacity = Math.max(0, p.opacity - 0.06)
        }

        if (p.opacity <= 0.02) continue

        anyVisible = true

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

      if (anyVisible) {
        animRef.current = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [active])

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
