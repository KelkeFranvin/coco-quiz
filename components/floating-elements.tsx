"use client"

import { useEffect, useState } from "react"

type FloatingElement = {
  id: number
  x: number
  y: number
  size: number
  opacity: number
  rotation: number
  rotationSpeed: number
  xSpeed: number
  ySpeed: number
  type: "circle" | "square" | "triangle" | "star"
}

export default function FloatingElements() {
  const [elements, setElements] = useState<FloatingElement[]>([])

  useEffect(() => {
    // Create random floating elements
    const newElements: FloatingElement[] = []
    const elementCount = 15

    for (let i = 0; i < elementCount; i++) {
      newElements.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 10 + 5,
        opacity: Math.random() * 0.15 + 0.05,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
        xSpeed: (Math.random() - 0.5) * 0.5,
        ySpeed: (Math.random() - 0.5) * 0.5,
        type: ["circle", "square", "triangle", "star"][Math.floor(Math.random() * 4)] as any,
      })
    }

    setElements(newElements)

    // Animation loop
    let animationFrameId: number
    let lastTime = 0

    const animate = (time: number) => {
      const deltaTime = time - lastTime
      lastTime = time

      setElements((prevElements) =>
        prevElements.map((element) => {
          // Update position
          let x = element.x + element.xSpeed
          let y = element.y + element.ySpeed

          // Wrap around edges
          if (x < -50) x = window.innerWidth + 50
          if (x > window.innerWidth + 50) x = -50
          if (y < -50) y = window.innerHeight + 50
          if (y > window.innerHeight + 50) y = -50

          // Update rotation
          const rotation = (element.rotation + element.rotationSpeed) % 360

          return { ...element, x, y, rotation }
        }),
      )

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    // Handle window resize
    const handleResize = () => {
      setElements((prevElements) =>
        prevElements.map((element) => ({
          ...element,
          x: Math.min(element.x, window.innerWidth),
          y: Math.min(element.y, window.innerHeight),
        })),
      )
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const renderShape = (element: FloatingElement) => {
    switch (element.type) {
      case "circle":
        return (
          <div
            className="rounded-full border border-white/30"
            style={{
              width: `${element.size}px`,
              height: `${element.size}px`,
            }}
          />
        )
      case "square":
        return (
          <div
            className="border border-white/30"
            style={{
              width: `${element.size}px`,
              height: `${element.size}px`,
            }}
          />
        )
      case "triangle":
        return (
          <div
            className="border-l border-r border-b border-white/30"
            style={{
              width: `${element.size}px`,
              height: `${element.size * 0.866}px`, // height of equilateral triangle
              clipPath: "polygon(0% 100%, 50% 0%, 100% 100%)",
            }}
          />
        )
      case "star":
        return (
          <div
            className="border border-white/30"
            style={{
              width: `${element.size}px`,
              height: `${element.size}px`,
              clipPath:
                "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            }}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute"
          style={{
            left: `${element.x}px`,
            top: `${element.y}px`,
            opacity: element.opacity,
            transform: `rotate(${element.rotation}deg)`,
            transition: "transform 0.1s linear",
          }}
        >
          {renderShape(element)}
        </div>
      ))}
    </div>
  )
}

