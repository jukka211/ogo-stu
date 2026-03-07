'use client'

import {useEffect, useMemo, useRef, useState} from 'react'

type OgoGridLogoProps = {
  gridValue: number
  className?: string
}

function emptyGrid(cols: number, rows: number) {
  return Array.from({length: rows}, () => Array(cols).fill(false))
}

function setCell(grid: boolean[][], c: number, r: number, value = true) {
  if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
    grid[r][c] = value
  }
}

function makeLetterO(cols: number, rows: number, openLeft = false) {
  const grid = emptyGrid(cols, rows)
  const t = 1
  const midR = Math.floor(rows / 2)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const onBorder = r < t || r >= rows - t || c < t || c >= cols - t
      const shouldOpenLeft = openLeft && c < t && r > 0 && r < midR

      if (onBorder) setCell(grid, c, r, true)
      if (shouldOpenLeft) setCell(grid, c, r, false)
    }
  }

  return grid
}

function makeLetterG(cols: number, rows: number) {
  const grid = emptyGrid(cols, rows)
  const topR = 0
  const midR = Math.floor(rows / 2)
  const botR = rows - 1

  for (let c = 0; c < cols; c++) {
    setCell(grid, c, topR, true)
    setCell(grid, c, botR, true)
  }

  const midSpan = Math.max(1, Math.floor(cols * 0.7))
  const midStart = cols - midSpan
  for (let c = midStart; c < Math.min(cols, midStart + midSpan); c++) {
    setCell(grid, c, midR, true)
  }

  return grid
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function OgoGridLogo({gridValue, className}: OgoGridLogoProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [totalW, setTotalW] = useState(600)

  const rows = 5

  const cols = useMemo(() => {
    const v = clamp(Number.isFinite(gridValue) ? gridValue : 33, 0, 100)
    return Math.round((v / 100) * (15 - 3) + 3)
  }, [gridValue])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setTotalW(Math.max(1, rect.width))
    }

    update()

    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const letters = useMemo(() => {
    return [
      makeLetterO(cols, rows, false),
      makeLetterG(cols, rows),
      makeLetterO(cols, rows, true),
    ]
  }, [cols])

  const gap = 0
  const letterW = (totalW - gap * 2) / 3

  // square cells based on current responsive width
  const cellSize = letterW / cols

  // auto height from current logo height
  const gridW = cols * cellSize
  const gridH = rows * cellSize
  const totalH = gridH

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        width: '100%',
        height: `${totalH}px`,
        minHeight: `${totalH}px`,
        maxHeight: `${totalH}px`,
        overflow: 'hidden',
        position: 'relative',
        lineHeight: 0,
      }}
      aria-label="OGO grid logo"
    >
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
        height={totalH}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="xMinYMin meet"
        style={{
          display: 'block',
          width: '100%',
          height: `${totalH}px`,
        }}
      >
        {letters.map((grid, i) => {
          const letterX = i * (letterW + gap)
          const x0 = letterX + (letterW - gridW) / 2
          const y0 = 0

          return (
            <g key={i}>
              {grid.map((row, r) =>
                row.map((isOn, c) => {
                  if (!isOn) return null

                  const x = x0 + c * cellSize
                  const y = y0 + r * cellSize

                  return (
<rect
  key={`${i}-${r}-${c}`}
  x={x}
  y={y}
  width={cellSize}
  height={cellSize}
  fill="#9E9E9E"
  stroke="#9E9E9E"
  strokeWidth={0.5}
  vectorEffect="non-scaling-stroke"
/>
                  )
                })
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}