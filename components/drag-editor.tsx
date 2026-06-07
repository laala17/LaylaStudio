"use client"

import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react"
import { computePricing, PRICING } from "@/lib/editor-state"
import type { DragEditorState, EditorExportData } from "@/lib/editor-state"

interface PaletteItem {
  id: string
  src: string
  name: string
  category: string
}

// Hodnoty left, top, width, height jsou nyní v PROCENTECH (0 - 100)
interface CanvasItem {
  id: string
  src: string
  name: string
  left: number // v %
  top: number  // v %
  width: number // v %
  height: number // v %
  view: ViewMode
}

type PointerState =
  | {
      type: "drag"
      itemId: string
      startX: number
      startY: number
      originLeft: number // v %
      originTop: number  // v %
    }
  | null

const paletteItems: PaletteItem[] = [
  { id: "velka-masle-1", src: "/images/1.png", name: "Velká mašle", category: "Velké mašle" },
  { id: "velka-masle-2", src: "/images/2.png", name: "Velká mašle", category: "Velké mašle" },
  { id: "velka-masle-4", src: "/images/4.png", name: "Velká mašle", category: "Velké mašle" },
  { id: "velka-masle-5", src: "/images/5.png", name: "Velká mašle", category: "Velké mašle" },
  { id: "velka-masle-6", src: "/images/6.png", name: "Velká mašle", category: "Velké mašle" },
  { id: "mala-masle-7", src: "/images/7.png", name: "Malá mašle", category: "Malé mašle" },
  { id: "mala-masle-8", src: "/images/8.png", name: "Malá mašle", category: "Malé mašle" },
  { id: "mala-masle-9", src: "/images/9.png", name: "Malá mašle", category: "Malé mašle" },
  { id: "mala-masle-15", src: "/images/15.png", name: "Malá mašle", category: "Malé mašle" },
  { id: "koralky-10", src: "/images/10.png", name: "Korálky", category: "Korálky" },
  { id: "koralky-11", src: "/images/11.png", name: "Korálky", category: "Korálky" },
]

type ViewMode = "front" | "back"

type DragEditorPreview = {
  previewImage: string | null
  view: ViewMode
}

interface DragEditorProps {
  compact?: boolean
  images?: string[]
  basePrice?: number
  initialItems?: CanvasItem[] // Pro načtení v adminu
  initialHeartCount?: number   // Pro načtení v adminu
  readOnly?: boolean          // Vypne editační prvky pro admin zobrazení
  onPreviewChange?: (preview: DragEditorPreview) => void
  onEditorStateChange?: (state: DragEditorState) => void
  onExportDataChange?: (data: EditorExportData) => void
}

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

export function DragEditor({
  compact = false,
  images = [],
  basePrice,
  initialItems = [],
  initialHeartCount = 0,
  readOnly = false,
  onPreviewChange,
  onEditorStateChange,
  onExportDataChange,
}: DragEditorProps) {
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<CanvasItem[]>(initialItems)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedView, setSelectedView] = useState<ViewMode>("front")
  const [selectedCategory, setSelectedCategory] = useState<string>("Velké mašle")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [heartCount, setHeartCount] = useState(initialHeartCount)
  const pointerState = useRef<PointerState>(null)
  const nextId = useRef(initialItems.length + 1)

  const pricing = useMemo(() => computePricing(items, heartCount, basePrice), [items, heartCount, basePrice])

  // Pomocná funkce pro získání velikosti v PX na základě responzivity, kterou následně přepočítáme na %
  const getDecorationSizePx = (category?: string) => {
    if (!isMobile) return 96
    if (typeof window === "undefined") return 64

    let base = 64
    if (window.matchMedia("(max-width: 480px)").matches) base = 56
    else if (window.matchMedia("(max-width: 600px)").matches) base = 60

    let multiplier = 1
    if (category === "Malé mašle") multiplier = 1.1
    else if (category === "Velké mašle") multiplier = 1.05

    return Math.round(base * multiplier)
  }

  const categories = Array.from(new Set(paletteItems.map((item) => item.category)))
  const filteredItems = paletteItems.filter((item) => item.category === selectedCategory)

  useEffect(() => {
    if (initialItems.length > 0) setItems(initialItems)
  }, [initialItems])

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches)
    }
    updateIsMobile()
    const mql = window.matchMedia("(max-width: 767px)")
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mql.addEventListener?.("change", listener)
    return () => mql.removeEventListener?.("change", listener)
  }, [])

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return
    event.preventDefault()
    setDragOver(false)

    const data = event.dataTransfer.getData("text/plain")
    if (!data) return

    const parsed = JSON.parse(data)
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    const rect = canvasArea.getBoundingClientRect()
    const sizePx = getDecorationSizePx(parsed.category)
    
    // Výpočet pozice v pixelech vůči plátnu
    const xPx = event.clientX - rect.left - sizePx / 2
    const yPx = event.clientY - rect.top - sizePx / 2

    // Přepočet pixelů na procenta (0 - 100)
    const leftPercent = (xPx / rect.width) * 100
    const topPercent = (yPx / rect.height) * 100
    const widthPercent = (sizePx / rect.width) * 100
    const heightPercent = (sizePx / rect.height) * 100

    const id = `item-${nextId.current++}`

    setItems((prev) => [
      ...prev,
      {
        id,
        src: parsed.src,
        name: parsed.name,
        left: clamp(leftPercent, 0, 100 - widthPercent),
        top: clamp(topPercent, 0, 100 - heightPercent),
        width: widthPercent,
        height: heightPercent,
        view: selectedView,
      },
    ])
    setSelectedId(id)
  }

  const handlePointerMove = (event: globalThis.PointerEvent) => {
    const state = pointerState.current
    if (!state || readOnly) return
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    if (state.type === "drag") {
      const activeItem = items.find((i) => i.id === state.itemId)
      if (!activeItem) return

      // Rozdíl pohybu kurzoru v PX
      const dxPx = event.clientX - state.startX
      const dyPx = event.clientY - state.startY

      // Přepočet posunu z PX na %
      const dxPercent = (dxPx / canvasArea.clientWidth) * 100
      const dyPercent = (dyPx / canvasArea.clientHeight) * 100

      setItems((prev) =>
        prev.map((item) =>
          item.id === state.itemId
            ? {
                ...item,
                left: clamp(state.originLeft + dxPercent, 0, 100 - item.width),
                top: clamp(state.originTop + dyPercent, 0, 100 - item.height),
              }
            : item,
        ),
      )
    }
  }

  const handlePointerUp = (event: globalThis.PointerEvent) => {
    const state = pointerState.current
    if (!state) return
    if (state.type === "drag") {
      const activeItem = document.getElementById(state.itemId)
      activeItem?.releasePointerCapture(event.pointerId)
    }
    pointerState.current = null
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
  }

  const attachPointerListeners = () => {
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const addItemToCanvas = (item: PaletteItem, xPx?: number, yPx?: number) => {
    if (readOnly) return
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    const rect = canvasArea.getBoundingClientRect()
    const sizePx = getDecorationSizePx(item.category)
    
    const finalXPx = xPx !== undefined ? xPx : rect.width / 2 - sizePx / 2
    const finalYPx = yPx !== undefined ? yPx : rect.height / 2 - sizePx / 2

    const leftPercent = (finalXPx / rect.width) * 100
    const topPercent = (finalYPx / rect.height) * 100
    const widthPercent = (sizePx / rect.width) * 100
    const heightPercent = (sizePx / rect.height) * 100

    const id = `item-${nextId.current++}`

    setItems((prev) => [
      ...prev,
      {
        id,
        src: item.src,
        name: item.name,
        left: clamp(leftPercent, 0, 100 - widthPercent),
        top: clamp(topPercent, 0, 100 - heightPercent),
        width: widthPercent,
        height: heightPercent,
        view: selectedView,
      },
    ])
    setSelectedId(id)
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    if (readOnly) return
    event.dataTransfer.setData("text/plain", JSON.stringify(item))
    event.dataTransfer.effectAllowed = "copy"
  }

  const handlePaletteItemClick = (item: PaletteItem) => {
    if (readOnly) return
    if (isMobile) {
      setSelectedPaletteId(item.id)
      return
    }
    addItemToCanvas(item)
  }

  const handleCanvasClick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (readOnly) return
    if (selectedPaletteId) {
      const paletteItem = paletteItems.find((item) => item.id === selectedPaletteId)
      const canvasArea = canvasAreaRef.current
      if (paletteItem && canvasArea) {
        const rect = canvasArea.getBoundingClientRect()
        const sizePx = getDecorationSizePx(paletteItem.category)
        const xPx = event.clientX - rect.left - sizePx / 2
        const yPx = event.clientY - rect.top - sizePx / 2
        addItemToCanvas(paletteItem, xPx, yPx)
      }
      setSelectedPaletteId(null)
      return
    }

    if (!(event.target as HTMLElement).closest(".canvas-item")) {
      setSelectedId(null)
    }
  }

  const handleItemPointerDown = (event: ReactPointerEvent<HTMLDivElement>, itemId: string) => {
    if (readOnly) return
    if ((event.target as HTMLElement).closest(".controls")) return
    if (event.button !== 0) return

    const item = items.find((entry) => entry.id === itemId)
    const canvasArea = canvasAreaRef.current
    if (!item || !canvasArea) return

    setSelectedId(itemId)
    pointerState.current = {
      type: "drag",
      itemId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: item.left, // již uloženo v %
      originTop: item.top,   // již uloženo v %
    }

    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    attachPointerListeners()
  }

  const handleDelete = (itemId: string) => {
    if (readOnly) return
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setSelectedId((prev) => (prev === itemId ? null : prev))
  }

  // Generování náhledu z procent na fixní plátno pro uložení obrázku na backend
  const generatePreviewImage = async () => {
    if (typeof window === "undefined") return

    const canvas = document.createElement("canvas")
    canvas.width = 560
    canvas.height = 746
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    const backgroundSrc = images[selectedView === "front" ? 0 : 1] ?? images[0] ?? ""
    const viewItems = items.filter((item) => item.view === selectedView)

    try {
      const backgroundImage = await loadImage(backgroundSrc)
      ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height)
    } catch {
      ctx.fillStyle = "#f1f5f9"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    for (const item of viewItems) {
      try {
        const image = await loadImage(item.src)
        // Přepočet z % zpět na fixní pixely plátna canvasu (560x746) pro stabilní tisk/uložení
        const itemLeft = (item.left / 100) * canvas.width
        const itemTop = (item.top / 100) * canvas.height
        const itemWidth = (item.width / 100) * canvas.width
        const itemHeight = (item.height / 100) * canvas.height
        
        ctx.drawImage(image, itemLeft, itemTop, itemWidth, itemHeight)
      } catch {
        // ignorovat chybu obrázku dekorace
      }
    }

    const dataUrl = canvas.toDataURL("image/webp", 0.8)
    setPreviewImage(dataUrl)
    onPreviewChange?.({ previewImage: dataUrl, view: selectedView })
  }

  const viewItems = items.filter((item) => item.view === selectedView)
  const backgroundImage = images[selectedView === "front" ? 0 : 1] ?? images[0] ?? ""

  useEffect(() => {
    if (viewItems.length === 0) {
      setPreviewImage(null)
      onPreviewChange?.({ previewImage: null, view: selectedView })
      return
    }
    generatePreviewImage()
  }, [items, selectedView])

  useEffect(() => {
    if (readOnly) return
    const frontSrc = images[0] ?? ""
    const backSrc = images[1] ?? images[0] ?? ""

    const state: DragEditorState = {
      selectedView,
      background: { frontSrc, backSrc },
      items,
      pricing,
    }
    onEditorStateChange?.(state)
  }, [items, selectedView, images, onEditorStateChange, pricing, readOnly])

  useEffect(() => {
    if (readOnly || !onExportDataChange) return
    const frontSrc = images[0] ?? ""
    const backSrc = images[1] ?? images[0] ?? ""

    const exportData: EditorExportData = {
      frontBackground: frontSrc,
      backBackground: backSrc,
      frontItems: items
        .filter((i) => i.view === "front")
        .map((i) => ({
          id: i.id,
          src: i.src,
          name: i.name,
          leftPercent: i.left,
          topPercent: i.top,
          widthPercent: i.width,
          heightPercent: i.height,
          view: i.view,
        })),
      backItems: items
        .filter((i) => i.view === "back")
        .map((i) => ({
          id: i.id,
          src: i.src,
          name: i.name,
          leftPercent: i.left,
          topPercent: i.top,
          widthPercent: i.width,
          heightPercent: i.height,
          view: i.view,
        })),
      heartCount,
      pricing,
    }
    onExportDataChange(exportData)
  }, [items, heartCount, images, pricing, onExportDataChange, readOnly])

  return (
    <div className={`drag-editor${compact ? " compact" : ""}${readOnly ? " readonly-mode" : ""}`}>
      {!readOnly && (
        <div className="editor-header">
          <div>
            <h2>Personalizace plavek</h2>
            <p className="editor-subtitle">Na mobilu klepněte na dekoraci pro přidání, na položku v plátně pak přetahujte.</p>
          </div>
        </div>
      )}

      <div className="editor-layout">
        {!readOnly && (
          <aside className="panel">
            <div className="panel-header">
              <h3>Kategorie dekorací</h3>
            </div>
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={selectedCategory === category ? "category-tab active" : "category-tab"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="items-list">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`item-card ${selectedPaletteId === item.id ? "selected" : ""}`}
                  role="button"
                  tabIndex={0}
                  draggable={!isMobile}
                  onClick={() => handlePaletteItemClick(item)}
                  onDragStart={(event) => handleDragStart(event, item)}
                >
                  <img src={item.src} alt={item.name} />
                  <div>
                    <strong>{item.name}</strong>
                    {PRICING.SURCHARGES[item.name] !== undefined && (
                      <span className="item-price">(+{PRICING.SURCHARGES[item.name]} Kč)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Heart section */}
            <div className="heart-section">
              <div className="heart-header">
                <div className="heart-info">
                  <img src="/images/12.png" alt="Srdíčko" className="heart-icon" />
                  <div>
                    <strong>Srdíčko mezi prsa</strong>
                    <span className="heart-price">(+{PRICING.HEART} Kč)</span>
                  </div>
                </div>
                <div className="heart-controls">
                  <button
                    type="button"
                    className="heart-btn"
                    onClick={() => setHeartCount(Math.max(0, heartCount - 1))}
                    disabled={heartCount === 0}
                  >
                    –
                  </button>
                  <span className="heart-counter">{heartCount}</span>
                  <button
                    type="button"
                    className="heart-btn"
                    onClick={() => setHeartCount(heartCount + 1)}
                    disabled={heartCount >= 1}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Price widget */}
            <div className="price-widget">
              <h4>Cenová kalkulace</h4>
              <div className="price-line">
                <span>Základní cena</span>
                <span>{pricing.basePrice} Kč</span>
              </div>
              <div className="price-divider" />
              <div className="price-line total">
                <span>Celková cena</span>
                <span>{pricing.totalPrice} Kč</span>
              </div>
            </div>
          </aside>
        )}

        <section className="canvas-panel">
          <div className="panel-header">
            <span className="status-pill">{items.length} dekorací</span>
            {readOnly && <span className="admin-pill">Zobrazení pro výrobu</span>}
          </div>

          <div className="canvas-body">
            <div className="view-switcher">
              <button
                type="button"
                className={selectedView === "front" ? "active" : ""}
                onClick={() => {
                  setSelectedView("front")
                  setSelectedId(null)
                }}
              >
                Zepředu
              </button>
              <button
                type="button"
                className={selectedView === "back" ? "active" : ""}
                onClick={() => {
                  setSelectedView("back")
                  setSelectedId(null)
                }}
                disabled={images.length < 2}
              >
                Zezadu
              </button>
            </div>

            <div
              className={`drop-zone ${dragOver ? "dragover" : ""}`}
              onClick={handleCanvasClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div
                className="canvas-inner"
                style={{ backgroundImage: `url(${backgroundImage})` }}
              >
                <div ref={canvasAreaRef} className="canvas-area">
                  {viewItems.map((item) => (
                    <div
                      id={item.id}
                      key={item.id}
                      className={`canvas-item ${selectedId === item.id && !readOnly ? "selected" : ""}`}
                      style={{
                        left: `${item.left}%`,
                        top: `${item.top}%`,
                        width: `${item.width}%`,
                        height: `${item.height}%`,
                      }}
                      onPointerDown={(event) => handleItemPointerDown(event, item.id)}
                      onClick={() => !readOnly && setSelectedId(item.id)}
                    >
                      {!readOnly && (
                        <div className="controls">
                          <button
                            type="button"
                            className="delete-btn"
                            title="Smazat"
                            onClick={() => handleDelete(item.id)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      <img src={item.src} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .drag-editor.readonly-mode .editor-layout {
          grid-template-columns: 1fr;
        }
        .admin-pill {
          background: #f59e0b;
          color: white;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-size: 0.95rem;
        }
        .drag-editor {
          margin-top: 3rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(14, 165, 233, 0.18);
          border-radius: 32px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.75rem;
          flex-wrap: wrap;
        }
        .editor-header h2 {
          margin: 0;
          font-size: clamp(1.5rem, 2vw, 2rem);
        }
        .editor-subtitle {
          margin: 0.5rem 0 0;
          color: #475569;
          max-width: 40rem;
          line-height: 1.65;
        }
        .editor-layout {
          display: grid;
          grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
          gap: 1.5rem;
        }
        .panel,
        .canvas-panel {
          background: #ffffff;
          border-radius: 28px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
        }
        .panel-header,
        .canvas-panel .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.35rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .status-pill {
          background: rgba(14, 165, 233, 0.12);
          color: #0369a1;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-size: 0.95rem;
          white-space: nowrap;
        }
        .category-tabs {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1.5rem 1.5rem 0;
        }
        .category-tab {
          padding: 0.75rem 1rem;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: #f8fbff;
          color: #0f172a;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .category-tab.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }
        .items-list {
          display: grid;
          gap: 1rem;
          padding: 1rem 1.5rem 0.5rem;
        }
        .item-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: #f8fbff;
          padding: 0.95rem 1rem;
          cursor: grab;
        }
        .item-card img {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          object-fit: cover;
        }
        .heart-section {
          padding: 0.75rem 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .heart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        .heart-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .heart-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          object-fit: cover;
        }
        .heart-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .heart-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          cursor: pointer;
        }
        .heart-counter {
          min-width: 24px;
          text-align: center;
          font-weight: 600;
        }
        .price-widget {
          padding: 1rem 1.5rem;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .price-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          padding: 0.25rem 0;
        }
        .price-divider {
          height: 1px;
          background: #cbd5e1;
          margin: 0.5rem 0;
        }
        .price-line.total {
          font-weight: 600;
          font-size: 1rem;
        }
        .canvas-body {
          padding: 1.5rem;
          min-height: 640px;
        }
        .drop-zone {
          position: relative;
          width: 100%;
          min-height: 520px;
          border-radius: 28px;
          border: 2px dashed #cbd5e1;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .canvas-inner {
          position: relative;
          width: min(100%, 560px);
          aspect-ratio: 3 / 4;
          border-radius: 28px;
          overflow: hidden;
          background: #f1f5f9 no-repeat center/contain;
        }
        .canvas-area {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .canvas-item {
          position: absolute;
          border-radius: 22px;
          cursor: grab;
          touch-action: none;
        }
        .canvas-item.selected {
          outline: 2px solid rgba(14, 165, 233, 0.95);
          outline-offset: 8px;
        }
        .controls {
          position: absolute;
          top: 4px;
          left: 4px;
          opacity: 0;
          visibility: hidden;
          z-index: 2;
        }
        .canvas-item.selected .controls {
          opacity: 1;
          visibility: visible;
        }
        .view-switcher {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .view-switcher button {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 999px;
          padding: 0.75rem 1.15rem;
          cursor: pointer;
        }
        .view-switcher button.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }
        .controls button {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          cursor: pointer;
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 767px) {
          .drag-editor {
            margin-top: 1.5rem;
            padding: 1rem;
            border-radius: 24px;
          }

          .editor-layout {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          /* Order: canvas first, panel second */
          .canvas-panel {
            order: 0;
          }
          .panel {
            order: 1;
          }

          /* Canvas body - reduce padding */
          .canvas-body {
            padding: 0.75rem;
            min-height: auto;
          }

          /* Canvas inner - full width, maintain aspect ratio */
          .canvas-inner {
            width: 100%;
            max-width: 100%;
          }

          .drop-zone {
            min-height: 320px;
          }

          /* Panel decorations - horizontal scroll */
          .panel .panel-header h3 {
            font-size: 0.9rem;
          }

          .items-list {
            display: flex;
            flex-direction: row;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            overflow-x: auto;
            overflow-y: hidden;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }

          .items-list::-webkit-scrollbar {
            height: 4px;
          }
          .items-list::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          .item-card {
            flex: 0 0 auto;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            padding: 0.5rem 0.75rem;
            width: 90px;
            scroll-snap-align: start;
            cursor: pointer;
          }

          .item-card img {
            width: 48px;
            height: 48px;
          }

          .item-card strong {
            font-size: 0.7rem;
            text-align: center;
            line-height: 1.1;
          }

          .item-card .item-price {
            font-size: 0.65rem;
          }

          /* Category tabs - horizontal scroll */
          .category-tabs {
            flex-wrap: nowrap;
            overflow-x: auto;
            gap: 0.5rem;
            padding: 0.75rem 1rem 0;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .category-tabs::-webkit-scrollbar {
            display: none;
          }

          .category-tab {
            flex: 0 0 auto;
            font-size: 0.8rem;
            padding: 0.5rem 0.75rem;
            white-space: nowrap;
          }

          /* Heart section - compact */
          .heart-section {
            padding: 0.5rem 1rem;
          }
          .heart-icon {
            width: 36px;
            height: 36px;
          }
          .heart-info strong {
            font-size: 0.85rem;
          }

          /* Price widget - compact */
          .price-widget {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}
