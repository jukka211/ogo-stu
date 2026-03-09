// components/MenuExperience.tsx
'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import gsap from 'gsap'
import BgGridP5 from '@/components/BgGridP5'
import OgoGridLogo from '@/components/OgoGridLogo'

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
  logosSvgFile?: {
    asset?: {url?: string}
  }
}

function splitLines(text?: string) {
  if (!text) return []
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export default function MenuExperience({settings}: {settings: Settings}) {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [open, setOpen] = useState(false)

  // slider 1 = logo grid
  const [logoGridValue, setLogoGridValue] = useState(33)

  // slider 2 = background grid
  const [bgGridValue, setBgGridValue] = useState(2)

  const btnRef = useRef<HTMLButtonElement | null>(null)
  const chevRef = useRef<HTMLSpanElement | null>(null)
  const accRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  const logoGridSliderRef = useRef<HTMLInputElement | null>(null)
  const logoGridLabelRef = useRef<HTMLSpanElement | null>(null)

  const bgGridSliderRef = useRef<HTMLInputElement | null>(null)
  const bgGridLabelRef = useRef<HTMLSpanElement | null>(null)

  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const acc = accRef.current

    const setBlurMask = () => {
      if (!acc || !open) {
        root.style.setProperty('--accordion-blur-top', '0px')
        root.style.setProperty('--accordion-blur-right', '100vw')
        root.style.setProperty('--accordion-blur-bottom', '100vh')
        root.style.setProperty('--accordion-blur-left', '100vw')
        root.style.setProperty('--accordion-blur-opacity', '0')
        return
      }

      const rect = acc.getBoundingClientRect()
      const left = Math.max(0, Math.floor(rect.left))
      const top = Math.max(0, Math.floor(rect.top))
      const right = Math.max(0, Math.floor(window.innerWidth - rect.right))
      const bottom = Math.max(0, Math.floor(window.innerHeight - rect.bottom))

      root.style.setProperty('--accordion-blur-top', `${top}px`)
      root.style.setProperty('--accordion-blur-right', `${right}px`)
      root.style.setProperty('--accordion-blur-bottom', `${bottom}px`)
      root.style.setProperty('--accordion-blur-left', `${left}px`)
      root.style.setProperty('--accordion-blur-opacity', '1')
    }

    if (!open || !acc) {
      setBlurMask()
      return
    }

    setBlurMask()
    let raf = 0
    let i = 0
    const chaseFrames = () => {
      if (!open || !acc) return
      setBlurMask()
      if (i < 12) {
        i += 1
        raf = window.requestAnimationFrame(chaseFrames)
      }
    }
    raf = window.requestAnimationFrame(chaseFrames)

    window.addEventListener('resize', setBlurMask)
    const observer = new ResizeObserver(setBlurMask)
    observer.observe(acc)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', setBlurMask)
      observer.disconnect()
      root.style.setProperty('--accordion-blur-opacity', '0')
    }
  }, [open])

  const titleLines = useMemo(
    () => (lang === 'de' ? splitLines(settings?.titleDe) : splitLines(settings?.titleEn)),
    [lang, settings?.titleDe, settings?.titleEn]
  )

  const serviceLines = lang === 'de' ? settings?.servicesDe ?? [] : settings?.servicesEn ?? []

  const contactButtons = settings?.contactButtons?.length
    ? settings.contactButtons.slice(0, 3)
    : [
        {label: 'E-Mail', href: 'mailto:hello@example.com'},
        {label: 'Instagram', href: 'https://instagram.com'},
        {label: 'Impressum', href: '/impressum'},
      ]

      useEffect(() => {
        const btn = btnRef.current
        const chev = chevRef.current
        const acc = accRef.current
        const inner = innerRef.current
        if (!btn || !chev || !acc || !inner) return
      
        const getMaxAccordionHeight = () => Math.floor(window.innerHeight * 0.6)
      
        const measureAccordionContentHeight = () => {
          const prevHidden = acc.hidden
          const prevHeight = acc.style.height
          const prevOverflowY = acc.style.overflowY
      
          acc.hidden = false
          acc.style.height = 'auto'
          acc.style.overflowY = 'hidden'
      
          const full = acc.scrollHeight
      
          acc.style.height = prevHeight
          acc.style.overflowY = prevOverflowY
          acc.hidden = prevHidden
      
          return full
        }
      
        const getOpenHeight = () => {
          const contentHeight = measureAccordionContentHeight()
          return Math.min(contentHeight, getMaxAccordionHeight())
        }
      
        const buildTimeline = () => {
          const targetHeight = getOpenHeight()
      
          tlRef.current?.kill()
      
          tlRef.current = gsap
            .timeline({paused: true})
            .to(
              acc,
              {
                height: targetHeight,
                duration: 0.55,
                ease: 'power3.inOut',
              },
              0
            )
            .to(
              inner,
              {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: 'power2.out',
              },
              0.15
            )
            .to(
              chev,
              {
                rotate: 180,
                duration: 0.35,
                ease: 'power2.out',
              },
              0
            )
        }
      
        // only initialize closed state when timeline doesn't exist yet
        if (!tlRef.current) {
          gsap.set(acc, {height: 0})
          gsap.set(inner, {opacity: 0, y: -10})
          gsap.set(chev, {rotate: 0, transformOrigin: '50% 50%'})
          acc.hidden = true
          buildTimeline()
        }
      
        if (open) {
          acc.hidden = false
          btn.setAttribute('aria-expanded', 'true')
      
          // rebuild only when opening, so reverse still has the open state to animate from
          buildTimeline()
          tlRef.current?.play(0)
        } else {
          btn.setAttribute('aria-expanded', 'false')
          tlRef.current?.eventCallback('onReverseComplete', () => {
            acc.hidden = true
          })
          tlRef.current?.reverse()
        }
      
        const onResize = () => {
          if (!open) return
      
          const newHeight = getOpenHeight()
          gsap.to(acc, {
            height: newHeight,
            duration: 0.2,
            ease: 'power1.out',
            overwrite: true,
          })
        }
      
        window.addEventListener('resize', onResize)
      
        return () => {
          window.removeEventListener('resize', onResize)
        }
      }, [open, lang, settings])

  useEffect(() => {
    const root = document.documentElement
    const logoGridSlider = logoGridSliderRef.current
    const logoGridLabel = logoGridLabelRef.current
    const bgGridSlider = bgGridSliderRef.current
    const bgGridLabel = bgGridLabelRef.current

    function sliderValueToLogoCols(value: string | number) {
      const v = Math.min(100, Math.max(0, Number.parseInt(String(value), 10) || 0))
      return Math.round((v / 100) * (15 - 3) + 3) // 3..15
    }

    function sliderValueToBgCols(value: string | number) {
      const v = Math.min(100, Math.max(0, Number.parseInt(String(value), 10) || 0))
      const rawCols = Math.round((v / 100) * 74 + 1)
      const isMobile = window.innerWidth < 768
      return Math.min(isMobile ? 28 : 75, rawCols)
    }

    function bgColsToRows(cols: number, maxRowsDesktop = 13) {
      const c = Math.max(1, Number(cols) || 1)
      const isMobile = window.innerWidth < 768
      const maxRows = isMobile ? 12 : maxRowsDesktop
      const growthStep = isMobile ? 6 : 1

      const rows = 1 + Math.floor((c - 1) / growthStep)
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

    function updateBackgroundGridDerivedValues() {
      if (!bgGridSlider) return

      const slider = Number(bgGridSlider.value)
      const cols = sliderValueToBgCols(slider)
      const rows = bgColsToRows(cols, 13)

      root.style.setProperty('--grid-cols', String(cols))
      root.style.setProperty('--grid-rows', String(rows))

      ;(window as any).ogoGridCols = cols
      ;(window as any).ogoGridRows = rows

      window.dispatchEvent(
        new CustomEvent('gridChange', {
          detail: {cols, rows, slider},
        })
      )
    }

    function updateAllThumbLabels() {
      updateThumbLabel(
        logoGridSlider,
        logoGridLabel,
        (v) => {
          const cols = sliderValueToLogoCols(v)
          return `${cols}`
        },
        32
      )
    
      updateThumbLabel(
        bgGridSlider,
        bgGridLabel,
        (v) => {
          const cols = sliderValueToBgCols(v)
          return `${cols}`
        },
        32
      )
    
      updateBackgroundGridDerivedValues()
    }

    const onLogoGrid = () => {
      if (!logoGridSlider) return
      setLogoGridValue(Number(logoGridSlider.value))
      updateAllThumbLabels()
    }

    const onBgGrid = () => {
      if (!bgGridSlider) return
      setBgGridValue(Number(bgGridSlider.value))
      updateAllThumbLabels()
    }

    if (logoGridSlider) {
      setLogoGridValue(Number(logoGridSlider.value))
      logoGridSlider.addEventListener('input', onLogoGrid)
      logoGridSlider.addEventListener('change', onLogoGrid)
    }

    if (bgGridSlider) {
      setBgGridValue(Number(bgGridSlider.value))
      bgGridSlider.addEventListener('input', onBgGrid)
      bgGridSlider.addEventListener('change', onBgGrid)
    }

    window.addEventListener('resize', updateAllThumbLabels)

    updateAllThumbLabels()

    return () => {
      logoGridSlider?.removeEventListener('input', onLogoGrid)
      logoGridSlider?.removeEventListener('change', onLogoGrid)
      bgGridSlider?.removeEventListener('input', onBgGrid)
      bgGridSlider?.removeEventListener('change', onBgGrid)
      window.removeEventListener('resize', updateAllThumbLabels)
    }
  }, [settings])

  return (
    <>
      <BgGridP5 gridValue={bgGridValue} hostId="bg-canvas" className="bg-canvas-layer" />
      <BgGridP5 gridValue={bgGridValue} hostId="bg-canvas-blur" className="bg-canvas-layer bg-canvas-blur" />

      <div className="menu-container">
        <div className="menu-row">
          <div className="slider-wrap">
            <input
              ref={logoGridSliderRef}
              id="logoGridSlider"
              className="slider"
              type="range"
              min="0"
              max="100"
              defaultValue="33"
              aria-label="Logo Grid"
            />
            <span ref={logoGridLabelRef} id="logoGridLabel" className="thumb-label" aria-hidden="true" />
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
  <img src="/menu-arrow.svg" className="menu-arrow" alt="" />
</span>
          </button>

          <div className="slider-wrap">
            <input
              ref={bgGridSliderRef}
              id="bgGridSlider"
              className="slider"
              type="range"
              min="0"
              max="100"
              defaultValue="2"
              aria-label="Background Grid"
            />
            <span ref={bgGridLabelRef} id="bgGridLabel" className="thumb-label" aria-hidden="true" />
          </div>
        </div>

        <div id="menu-accordion" ref={accRef} className="accordion" hidden>

        <div className="buttons-block">
            {contactButtons.map((item, i) => (
              <a
                key={i}
                href={item.href || '#'}
                className="contact-button-link"
                target={item.href?.startsWith('http') ? '_blank' : undefined}
                rel={item.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span className="contact-button">{item.label || 'Button'}</span>
              </a>
            ))}
          </div>

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

          <div className="logos-image" aria-hidden="true">
            <img src="/logos.svg" className="logos-svg-inline" alt="" />
          </div>


        </div>

        <div className="menu-logo-block">
          <button className={`lang-btn ${lang === 'de' ? 'is-active' : ''}`} type="button" onClick={() => setLang('de')}>
            {settings?.langLabelDe || 'DE: ORIGINALE GRAFISCHE ORDNUNG'}
          </button>

          <OgoGridLogo gridValue={logoGridValue} className="ogo-grid-logo" />

          <button className={`lang-btn ${lang === 'en' ? 'is-active' : ''}`} type="button" onClick={() => setLang('en')}>
            {settings?.langLabelEn || 'EN: ORIGINAL GRAPHIC ORDER'}
          </button>
        </div>
      </div>
    </>
  )
}
