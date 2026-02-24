'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import gsap from 'gsap'
import BgGridP5 from '@/components/BgGridP5'
import {urlFor} from '@/lib/image'
import AccentLogosSvg from '@/components/AccentLogosSvg'

type ContactButton = {
  label?: string
  href?: string
}

type Settings = {
  titleDe?: string
  servicesDe?: string[]
  titleEn?: string
  servicesEn?: string[]
  menuLabel?: string
  langLabelDe?: string
  langLabelEn?: string
  contactButtons?: ContactButton[]
  ogoLogo?: any
  logosSvgFile?: {
    asset?: {url?: string}
  }
}

function splitLines(text?: string) {
  if (!text) return []
  return text.split('\n').map((line) => line.trim()).filter(Boolean)
}

export default function MenuExperience({settings}: {settings: Settings}) {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [open, setOpen] = useState(false)

  const btnRef = useRef<HTMLButtonElement | null>(null)
  const chevRef = useRef<HTMLSpanElement | null>(null)
  const accRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  const accentHueSliderRef = useRef<HTMLInputElement | null>(null)
  const accentHueLabelRef = useRef<HTMLSpanElement | null>(null)
  const gridColsSliderRef = useRef<HTMLInputElement | null>(null)
  const gridColsLabelRef = useRef<HTMLSpanElement | null>(null)
  const logosMountRef = useRef<HTMLDivElement | null>(null)

  const titleLines = useMemo(
    () => (lang === 'de' ? splitLines(settings?.titleDe) : splitLines(settings?.titleEn)),
    [lang, settings?.titleDe, settings?.titleEn]
  )

  const serviceLines = lang === 'de'
    ? (settings?.servicesDe ?? [])
    : (settings?.servicesEn ?? [])

  const contactButtons = (settings?.contactButtons?.length
    ? settings.contactButtons.slice(0, 3)
    : [
        {label: 'E-Mail', href: 'mailto:hello@example.com'},
        {label: 'Instagram', href: 'https://instagram.com'},
        {label: 'Impressum', href: '/impressum'},
      ])

  const ogoLogoSrc = settings?.ogoLogo ? urlFor(settings.ogoLogo).url() : '/ogo-logo.svg'

  // GSAP accordion
  useEffect(() => {
    const btn = btnRef.current
    const chev = chevRef.current
    const acc = accRef.current
    const inner = innerRef.current
    if (!btn || !chev || !acc || !inner) return

    gsap.set(acc, {height: 0})
    gsap.set(inner, {opacity: 0, y: -10})
    gsap.set(chev, {rotate: 0, transformOrigin: '50% 50%'})

    const tl = gsap.timeline({paused: true})
      .to(acc, {
        height: 'auto',
        duration: 0.55,
        ease: 'power3.inOut',
      }, 0)
      .to(inner, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
      }, 0.15)
      .to(chev, {
        rotate: 180,
        duration: 0.35,
        ease: 'power2.out',
      }, 0)

    if (open) {
      acc.hidden = false
      btn.setAttribute('aria-expanded', 'true')
      tl.invalidate().restart()
    } else {
      btn.setAttribute('aria-expanded', 'false')
      tl.reverse()
      tl.eventCallback('onReverseComplete', () => {
        acc.hidden = true
        gsap.set(acc, {height: 0})
        gsap.set(inner, {opacity: 0, y: -10})
        gsap.set(chev, {rotate: 0})
      })
    }

    return () => {
        tl.kill()
      }
  }, [open, lang])

  // Sliders + labels + accent hue + grid event
  useEffect(() => {
    const root = document.documentElement
    const accentHueSlider = accentHueSliderRef.current
    const accentHueLabel = accentHueLabelRef.current
    const gridColsSlider = gridColsSliderRef.current
    const gridColsLabel = gridColsLabelRef.current

    function setAccentHue(value: string | number) {
      const hue = Math.min(360, Math.max(0, Number.parseInt(String(value), 10) || 116))
      root.style.setProperty('--accent-hue', String(hue))
    }

    function sliderValueToCols(value: string | number) {
      const v = Math.min(100, Math.max(0, Number.parseInt(String(value), 10) || 0))
      return Math.round((v / 100) * 74 + 1)
    }

    function colsToRows(cols: number, maxRows = 13) {
      const c = Math.max(1, Number(cols) || 1)
      const rows = 1 + Math.floor((c - 1) / 6)
      return Math.min(maxRows, rows)
    }

    function updateThumbLabel(
      slider: HTMLInputElement | null,
      label: HTMLSpanElement | null,
      formatter: (v: number) => string,
      thumbWidth: number
    ) {
      if (!slider || !label) return

      const min = Number.parseFloat(slider.min) || 0
      const max = Number.parseFloat(slider.max) || 100
      const value = Number.parseFloat(slider.value) || 0
      const range = max - min || 1
      const pct = (value - min) / range
      const trackWidth = slider.clientWidth
      const usableWidth = Math.max(0, trackWidth - thumbWidth)
      const x = pct * usableWidth + Math.min(thumbWidth / 2, trackWidth / 2)

      label.style.setProperty('--thumb-w', `${thumbWidth}px`)
      label.style.left = `${x}px`
      label.textContent = formatter(value)
    }

    function updateGridDerivedValues() {
      if (!gridColsSlider) return
      const slider = Number(gridColsSlider.value)
      const cols = sliderValueToCols(slider)
      const rows = colsToRows(cols, 13)

      root.style.setProperty('--grid-cols', String(cols))
      root.style.setProperty('--grid-rows', String(rows))

      ;(window as any).ogoGridCols = cols
      ;(window as any).ogoGridRows = rows

      window.dispatchEvent(new CustomEvent('gridChange', {
        detail: {cols, rows, slider},
      }))
    }

    function updateAllThumbLabels() {
      updateThumbLabel(accentHueSlider, accentHueLabel, (v) => `hsl:${Math.round(v)}`, 70)

      updateThumbLabel(gridColsSlider, gridColsLabel, (v) => {
        const cols = sliderValueToCols(v)
        const rows = colsToRows(cols, 13)
        return `${cols}×${rows}`
      }, 70)

      updateGridDerivedValues()
    }

    async function mountAccentLogo() {
      const mount = logosMountRef.current
      const svgUrl = settings?.logosSvgFile?.asset?.url || '/logos.svg'
      if (!mount || !svgUrl) return

      try {
        const response = await fetch(svgUrl)
        if (!response.ok) return

        const svgText = await response.text()
        mount.innerHTML = svgText

        const svg = mount.querySelector('svg')
        if (!svg) return

        svg.removeAttribute('width')
        svg.removeAttribute('height')

        svg.querySelectorAll('[fill]').forEach((node) => {
          const fill = (node.getAttribute('fill') || '').trim().toLowerCase()
          if (fill === '#11ff00') {
            node.setAttribute('fill', 'var(--accent-color)')
          }
        })
      } catch {
        // no-op
      }
    }

    const onAccent = () => {
      if (!accentHueSlider) return
      setAccentHue(accentHueSlider.value)
      updateAllThumbLabels()
    }

    const onGrid = () => updateAllThumbLabels()

    if (accentHueSlider) {
      setAccentHue(accentHueSlider.value)
      accentHueSlider.addEventListener('input', onAccent)
      accentHueSlider.addEventListener('change', onAccent)
    }

    if (gridColsSlider) {
      gridColsSlider.addEventListener('input', onGrid)
      gridColsSlider.addEventListener('change', onGrid)
    }

    window.addEventListener('resize', updateAllThumbLabels)

    updateAllThumbLabels()
    mountAccentLogo()

    return () => {
      accentHueSlider?.removeEventListener('input', onAccent)
      accentHueSlider?.removeEventListener('change', onAccent)
      gridColsSlider?.removeEventListener('input', onGrid)
      gridColsSlider?.removeEventListener('change', onGrid)
      window.removeEventListener('resize', updateAllThumbLabels)
    }
  }, [settings])
  useEffect(() => {
    if (!open) return
  
    const mount = logosMountRef.current
    const svgUrl = settings?.logosSvgFile?.asset?.url || '/logos.svg'
    if (!mount) return
  
    ;(async () => {
      try {
        const response = await fetch(svgUrl)
        if (!response.ok) return
  
        const svgText = await response.text()
        mount.innerHTML = svgText
  
        const svg = mount.querySelector('svg')
        if (!svg) return
  
        svg.removeAttribute('width')
        svg.removeAttribute('height')
  
        svg.querySelectorAll('[fill]').forEach((node) => {
          const fill = (node.getAttribute('fill') || '').trim().toLowerCase()
          if (fill === '#11ff00') {
            node.setAttribute('fill', 'var(--accent-color)')
          }
        })
      } catch (err) {
        console.error('SVG mount failed:', err)
      }
    })()
  }, [open, settings])
  return (
    <>
      <BgGridP5 />

      <div className="menu-container">
        <div className="menu-row">
          <div className="slider-wrap">
            <input
              ref={accentHueSliderRef}
              id="accentHueSlider"
              className="slider"
              type="range"
              min="0"
              max="360"
              defaultValue="116"
              aria-label="Accent Hue"
            />
            <span ref={accentHueLabelRef} id="accentHueLabel" className="thumb-label" aria-hidden="true" />
          </div>

          <button
            ref={btnRef}
            className="menu-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="menu-accordion"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="label">{settings?.menuLabel || 'Menu'}</span>
            <span ref={chevRef} className="chev">
              <img src="/menu-arrow.svg" style={{width: '100%', height: '0.6rem'}} alt="" />
            </span>
          </button>

          <div className="slider-wrap">
            <input
              ref={gridColsSliderRef}
              id="gridColsSlider"
              className="slider"
              type="range"
              min="0"
              max="100"
              defaultValue="70"
              aria-label="Grid Cols"
            />
            <span ref={gridColsLabelRef} id="gridColsLabel" className="thumb-label" aria-hidden="true" />
          </div>
        </div>

        <div id="menu-accordion" ref={accRef} className="accordion" hidden>
          <div ref={innerRef} className="accordion-inner">
            <div id="acc-title" className="acc-title">
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>

            <div id="acc-text" className="acc-text">
              <div className="acc-services">{lang === 'de' ? 'LEISTUNGEN:' : 'SERVICES:'}</div>
              {serviceLines.map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>

          <div id="logosMount" className="logos-image" aria-hidden="true">
  <AccentLogosSvg className="logos-svg-inline" />
</div>

          <div className="buttons-block">
            {contactButtons.map((item, i) => (
              <a key={i} href={item.href || '#'} className="contact-button-link">
                <button className="contact-button" type="button">{item.label || 'Button'}</button>
              </a>
            ))}
          </div>
        </div>

        <div className="menu-logo-block">
          <button
            className={`lang-btn ${lang === 'de' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setLang('de')}
          >
            {settings?.langLabelDe || 'DE: ORIGINALE GRAFISCHE ORDNUNG'}
          </button>

          <img src={ogoLogoSrc} style={{width: '100%'}} alt="OGO logo" />

          <button
            className={`lang-btn ${lang === 'en' ? 'is-active' : ''}`}
            type="button"
            onClick={() => setLang('en')}
          >
            {settings?.langLabelEn || 'EN: ORIGINAL GRAPHIC ORDER'}
          </button>
        </div>
      </div>
    </>
  )
}