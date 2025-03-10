"use client"

import { useEffect, useRef } from "react"

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Mouse interaction
    let mouseX = 0
    let mouseY = 0
    const mouseRadius = 150

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Particle class with enhanced effects
    class Particle {
      x: number
      y: number
      size: number
      baseSize: number
      speedX: number
      speedY: number
      opacity: number
      baseOpacity: number
      color: string

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.baseSize = Math.random() * 1.5 + 0.5
        this.size = this.baseSize
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.baseOpacity = Math.random() * 0.2 + 0.1
        this.opacity = this.baseOpacity

        // Random color from a beautiful palette
        const colors = [
          "rgba(255, 255, 255, OPACITY)",
          "rgba(173, 216, 230, OPACITY)",
          "rgba(186, 85, 211, OPACITY)",
          "rgba(135, 206, 235, OPACITY)",
        ]

        this.color = colors[Math.floor(Math.random() * colors.length)].replace("OPACITY", this.opacity.toString())
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width
        if (this.x > canvas.width) this.x = 0
        if (this.y < 0) this.y = canvas.height
        if (this.y > canvas.height) this.y = 0

        // Mouse interaction
        const dx = this.x - mouseX
        const dy = this.y - mouseY
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius
          this.size = this.baseSize * (1 + force)
          this.opacity = this.baseOpacity * (1 + force * 2)

          // Push particles away from mouse
          const angle = Math.atan2(dy, dx)
          const pushX = Math.cos(angle) * force * 2
          const pushY = Math.sin(angle) * force * 2

          this.x += pushX
          this.y += pushY
        } else {
          this.size = this.baseSize
          this.opacity = this.baseOpacity
        }

        // Update color with new opacity
        this.color = this.color.replace(/[\d.]+\)$/, `${this.opacity})`)
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Create particles
    const particles: Particle[] = []
    const particleCount = 100

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    // Animation loop with enhanced effects
    const animate = () => {
      // Create a semi-transparent background for trail effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      // Draw connections with gradient
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            // Create gradient for connection
            const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y)

            gradient.addColorStop(0, particles[i].color)
            gradient.addColorStop(1, particles[j].color)

            ctx.strokeStyle = gradient
            ctx.lineWidth = 0.5 * (1 - distance / 150)

            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ opacity: 0.8 }} />
}

