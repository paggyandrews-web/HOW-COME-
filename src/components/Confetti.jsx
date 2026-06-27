import { useEffect, useRef } from 'react'

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#20c997']

function randomBetween(a, b) { return a + Math.random() * (b - a) }

function createParticle(canvas) {
  return {
    x: randomBetween(0, canvas.width),
    y: randomBetween(-80, -10),
    vx: randomBetween(-3, 3),
    vy: randomBetween(2, 6),
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

    // Generate particles in waves
    const particles = []
    for (let i = 0; i < 160; i++) {
      const p = createParticle(canvas)
      // stagger launch time
      p.y = randomBetween(-canvas.height * 0.5, -10)
      p.vy = randomBetween(3, 7)
      particles.push(p)
    }

    let frame = 0
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      for (const p of particles) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.12 // gravity
        p.vx *= 0.99 // air friction
        p.rotation += p.rotSpeed

        // fade out near bottom
        if (p.y > canvas.height * 0.7) {
          p.opacity = Math.max(0, p.opacity - 0.025)
        }

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

      const alive = particles.some(p => p.y < canvas.height + 20 && p.opacity > 0.02)
      if (alive) {
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
