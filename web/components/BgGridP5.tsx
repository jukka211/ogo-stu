// components/BgGridP5.tsx
'use client'

import {useEffect, useRef} from 'react'

type BgGridP5Props = {
  gridValue: number
}

export default function BgGridP5({gridValue}: BgGridP5Props) {
  const initialized = useRef(false)
  const gridValueRef = useRef(gridValue)

  useEffect(() => {
    gridValueRef.current = gridValue
  }, [gridValue])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let p5Instance: any = null
    let cancelled = false

    ;(async () => {
      const p5Module = await import('p5')
      const p5 = p5Module.default

      if (cancelled) return

      const sketch = (p: any) => {
        let bgColor = '#000000'
        let numCols = 6
        let cellGap = 0

        let autoRowPattern = 'radial' // "radial" | "radialInverse"
        let autoRowMin = 1
        let autoRowMax = 30

        function getRowGrowthColsPerStep() {
          return isMobileLike() ? 6 : 1
        }

        const COL_K = 4
        const ROW_K = 1.0
        const MIN_CELL_PX = 6

        let vid: any = null
        let vidReady = false
        let videoEl: HTMLVideoElement | null = null
        let videoCanPlay = false

        let onGridChange: ((e: Event) => void) | null = null
        let onFirstGesture: (() => void) | null = null
        let onVisibilityChange: (() => void) | null = null

        function isMobileLike() {
          return p.windowWidth < 768
        }

        function getMaxCols() {
          return isMobileLike() ? 28 : 75
        }

        function getAutoRowMax() {
          return isMobileLike() ? 12 : autoRowMax
        }

        function applyColsFromSlider(v01: number) {
          const v = Number.isFinite(v01) ? v01 : 70
          const cols = Math.round(p.map(v, 0, 100, 1, 75))
          numCols = p.constrain(cols, 1, getMaxCols())
        }

        function getGlobalMaxRowsForCols(cols: number) {
          const c = Math.max(1, Math.floor(cols || 1))
          const stepped = 1 + Math.floor((c - 1) / getRowGrowthColsPerStep())
          return p.constrain(stepped, 1, getAutoRowMax())
        }

        function getRowCountForColumn(colIndex: number) {
          const cols = Math.max(1, numCols)
          if (cols === 1) return 1

          const globalMaxRows = getGlobalMaxRowsForCols(cols)
          if (globalMaxRows <= 1) return 1

          return calculateAutoRowCount(colIndex, globalMaxRows)
        }

        function calculateAutoRowCount(colIndex: number, dynamicMaxRows: number) {
          const cols = Math.max(1, numCols)
          const u = (colIndex + 0.5) / cols

          let factor = 0.5
          if (autoRowPattern === 'radialInverse') {
            factor = Math.abs(u - 0.5) * 2.0
          } else {
            factor = 1.0 - Math.abs(u - 0.5) * 2.0
          }

          factor = p.constrain(factor, 0, 1)

          const minRows = Math.min(autoRowMin, dynamicMaxRows)
          const maxRows = Math.max(minRows, dynamicMaxRows)

          const rows = Math.round(p.lerp(minRows, maxRows, factor))
          return Math.max(1, rows)
        }

        function allocatePixelsSym(totalPixels: number, weights: number[]) {
          const n = weights.length
          totalPixels = Math.max(0, Math.floor(totalPixels))
          if (n === 0) return []
          if (totalPixels === 0) return new Array(n).fill(0)

          const sumW = weights.reduce((a, b) => a + b, 0)
          if (sumW <= 0) return new Array(n).fill(0)

          const raw = weights.map((w) => (w / sumW) * totalPixels)
          const base = raw.map((v) => Math.floor(v))
          let used = base.reduce((a, b) => a + b, 0)
          let rem = totalPixels - used

          const center = (n - 1) / 2
          const frac = raw.map((v, i) => ({i, f: v - Math.floor(v)}))
          frac.sort((a, b) => {
            if (b.f !== a.f) return b.f - a.f
            return Math.abs(a.i - center) - Math.abs(b.i - center)
          })

          let k = 0
          while (rem > 0) {
            base[frac[k % frac.length].i] += 1
            rem--
            k++
          }

          return base
        }

        function radialWeight(spatial01: number, k: number) {
          return Math.exp(k * (spatial01 - 0.5))
        }

        function centerOutOrder(n: number) {
          const out: number[] = []
          if (n <= 0) return out

          if (n % 2 === 1) {
            const mid = Math.floor(n / 2)
            out.push(mid)
            for (let k = 1; mid - k >= 0 || mid + k < n; k++) {
              if (mid - k >= 0) out.push(mid - k)
              if (mid + k < n) out.push(mid + k)
            }
          } else {
            const midL = n / 2 - 1
            const midR = n / 2
            out.push(midL, midR)
            for (let k = 1; midL - k >= 0 || midR + k < n; k++) {
              if (midL - k >= 0) out.push(midL - k)
              if (midR + k < n) out.push(midR + k)
            }
          }
          return out
        }

        function enforceMinSizes(sizes: number[], total: number, minPx: number) {
          const n = sizes.length
          if (n === 0) return sizes

          const out = sizes.slice()
          let deficit = 0

          for (let i = 0; i < n; i++) {
            if (out[i] < minPx) {
              deficit += minPx - out[i]
              out[i] = minPx
            }
          }
          if (deficit <= 0) return out

          const center = (n - 1) / 2
          const idx = [...Array(n).keys()]
          idx.sort((a, b) => {
            if (out[b] !== out[a]) return out[b] - out[a]
            return Math.abs(a - center) - Math.abs(b - center)
          })

          let k = 0
          while (deficit > 0 && k < idx.length * 20) {
            const i = idx[k % idx.length]
            if (out[i] > minPx) {
              out[i] -= 1
              deficit -= 1
            }
            k++
            if (k > idx.length && out.every((v) => v === minPx)) break
          }

          let sum = out.reduce((a, b) => a + b, 0)
          let diff = total - sum
          if (diff !== 0) {
            const order = centerOutOrder(n)
            let j = 0
            while (diff !== 0 && j < order.length * 20) {
              const i = order[j % order.length]
              if (diff > 0) {
                out[i] += 1
                diff--
              } else if (out[i] > minPx) {
                out[i] -= 1
                diff++
              }
              j++
              if (j > order.length && diff < 0 && out.every((v) => v === minPx)) break
            }
          }

          return out
        }

        function drawCellClipped(x: number, y: number, w: number, h: number) {
          p.noStroke()
          p.fill(0)
          p.rect(x, y, w, h)

          if (!vid || !vidReady || !videoEl || !videoCanPlay) return

          const vw = videoEl.videoWidth
          const vh = videoEl.videoHeight
          if (!vw || !vh) return

          const s = Math.max(w / vw, h / vh)
          const dw = vw * s
          const dh = vh * s
          const dx = x + (w - dw) / 2
          const dy = y + (h - dh) / 2

          const ctx = p.drawingContext as CanvasRenderingContext2D
          ctx.save()
          ctx.beginPath()
          ctx.rect(x, y, w, h)
          ctx.clip()

          p.image(vid, dx, dy, dw, dh)

          ctx.restore()
        }

        async function tryPlayVideo() {
          if (!videoEl) return
          try {
            await videoEl.play()
            videoCanPlay = true
            vidReady = true
          } catch (err) {
            videoCanPlay = false
            console.warn('Video play blocked:', err)
          }
        }

        p.setup = () => {
          const host = document.getElementById('bg-canvas')
          const c = p.createCanvas(p.windowWidth, p.windowHeight)
          if (host) c.parent(host)

          try {
            vid = p.createVideo('/test.mp4')
            videoEl = vid?.elt as HTMLVideoElement | null

            if (videoEl) {
              videoEl.muted = true
              videoEl.defaultMuted = true
              videoEl.autoplay = true
              videoEl.loop = true
              videoEl.playsInline = true
              videoEl.preload = 'auto'

              videoEl.setAttribute('muted', '')
              videoEl.setAttribute('autoplay', '')
              videoEl.setAttribute('loop', '')
              videoEl.setAttribute('playsinline', '')
              videoEl.setAttribute('webkit-playsinline', 'true')

              videoEl.addEventListener(
                'loadeddata',
                () => {
                  vidReady = true
                  void tryPlayVideo()
                },
                {once: true}
              )

              videoEl.addEventListener('canplay', () => {
                vidReady = true
              })

              videoEl.addEventListener('playing', () => {
                videoCanPlay = true
                vidReady = true
              })

              videoEl.addEventListener('pause', () => {
                if (document.visibilityState === 'visible') {
                  void tryPlayVideo()
                }
              })
            }

            vid.hide()
            vid.volume(0)
          } catch (e) {
            console.error('Video init failed:', e)
            vid = null
            videoEl = null
            vidReady = false
            videoCanPlay = false
          }

          onFirstGesture = () => {
            void tryPlayVideo()
          }
          window.addEventListener('touchstart', onFirstGesture, {once: true, passive: true})
          window.addEventListener('click', onFirstGesture, {once: true})

          onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
              void tryPlayVideo()
            }
          }
          document.addEventListener('visibilitychange', onVisibilityChange)

          applyColsFromSlider(gridValueRef.current)

          onGridChange = (e: Event) => {
            const ce = e as CustomEvent
            if (!ce || !ce.detail) return
            const cols = Number(ce.detail.cols)
            if (Number.isFinite(cols)) {
              numCols = p.constrain(Math.round(cols), 1, getMaxCols())
            }
          }

          window.addEventListener('gridChange', onGridChange as EventListener)
        }

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight)
          numCols = p.constrain(numCols, 1, getMaxCols())
          applyColsFromSlider(gridValueRef.current)
        }

        p.draw = () => {
          applyColsFromSlider(gridValueRef.current)

          p.background(bgColor)

          const cols = Math.max(1, Math.min(numCols, getMaxCols()))

          const colWeights: number[] = []
          for (let c = 0; c < cols; c++) {
            const u = (c + 0.5) / cols
            const spatial = 1.0 - Math.abs(u - 0.5) * 2.0
            colWeights.push(radialWeight(p.constrain(spatial, 0, 1), COL_K))
          }

          const totalGapW = (cols + 1) * cellGap
          const availableW = Math.max(0, Math.floor(p.width - totalGapW))
          let colWidths = allocatePixelsSym(availableW, colWeights)
          colWidths = enforceMinSizes(colWidths, availableW, MIN_CELL_PX)

          let x = cellGap

          for (let c = 0; c < cols; c++) {
            const colW = colWidths[c]
            const rows = Math.max(1, getRowCountForColumn(c))

            const rowWeights: number[] = []
            for (let r = 0; r < rows; r++) {
              const v = (r + 0.5) / rows
              const spatial = 1.0 - Math.abs(v - 0.5) * 2.0
              rowWeights.push(radialWeight(p.constrain(spatial, 0, 1), ROW_K))
            }

            const totalGapH = (rows + 1) * cellGap
            const availableH = Math.max(0, Math.floor(p.height - totalGapH))
            let rowHeights = allocatePixelsSym(availableH, rowWeights)
            rowHeights = enforceMinSizes(rowHeights, availableH, MIN_CELL_PX)

            let y = cellGap
            for (let r = 0; r < rows; r++) {
              drawCellClipped(x, y, colW, rowHeights[r])
              y += rowHeights[r] + cellGap
            }

            x += colW + cellGap
          }
        }

        p.remove = ((origRemove) => {
          return function patchedRemove(this: any) {
            try {
              if (onGridChange) window.removeEventListener('gridChange', onGridChange as EventListener)

              if (onFirstGesture) {
                window.removeEventListener('touchstart', onFirstGesture as EventListener)
                window.removeEventListener('click', onFirstGesture as EventListener)
              }

              if (onVisibilityChange) {
                document.removeEventListener('visibilitychange', onVisibilityChange)
              }

              if (vid) {
                try {
                  if (videoEl) {
                    videoEl.pause()
                    videoEl.removeAttribute('src')
                    videoEl.load()
                  }
                  vid.stop?.()
                  vid.remove?.()
                } catch {
                  // ignore cleanup issues
                }
              }
            } finally {
              return origRemove.call(this)
            }
          }
        })(p.remove)
      }

      p5Instance = new p5(sketch)
    })()

    return () => {
      cancelled = true
      if (p5Instance) p5Instance.remove()
    }
  }, [])

  return <div id="bg-canvas" />
}