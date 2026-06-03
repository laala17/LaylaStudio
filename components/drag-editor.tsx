"use client"

import { useEffect, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react"

interface PaletteItem {
  id: string
  src: string
  name: string
  category: string
}

interface CanvasItem {
  id: string
  src: string
  name: string
  left: number
  top: number
  width: number
  height: number
  view: ViewMode
}

type PointerState =
  | {
      type: "drag"
      itemId: string
      startX: number
      startY: number
      originLeft: number
      originTop: number
    }
  | null

const paletteItems: PaletteItem[] = [
  {
    id: "velka-masle-1",
    src: "/images/1.png",
    name: "Velká mašle",
    category: "Velké mašle",
  },
  {
    id: "velka-masle-2",
    src: "/images/2.png",
    name: "Velká mašle",
    category: "Velké mašle",
  },
  {
    id: "velka-masle-4",
    src: "/images/4.png",
    name: "Velká mašle",
    category: "Velké mašle",
  },
  {
    id: "velka-masle-5",
    src: "/images/5.png",
    name: "Velká mašle",
    category: "Velké mašle",
  },
  {
    id: "velka-masle-6",
    src: "/images/6.png",
    name: "Velká mašle",
    category: "Velké mašle",
  },
  {
    id: "mala-masle-7",
    src: "/images/7.png",
    name: "Malá mašle",
    category: "Malé mašle",
  },
  {
    id: "mala-masle-8",
    src: "/images/8.png",
    name: "Malá mašle",
    category: "Malé mašle",
  },
  {
    id: "mala-masle-9",
    src: "/images/9.png",
    name: "Malá mašle",
    category: "Malé mašle",
  },
  {
    id: "mala-masle-15",
    src: "/images/15.png",
    name: "Malá mašle",
    category: "Malé mašle",
  },
  {
    id: "koralky-10",
    src: "/images/10.png",
    name: "Korálky",
    category: "Korálky",
  },
  {
    id: "koralky-11",
    src: "/images/11.png",
    name: "Korálky",
    category: "Korálky",
  },
]

type ViewMode = "front" | "back"

type DragEditorPreview = {
  previewImage: string | null
  view: ViewMode
}

interface DragEditorProps {
  compact?: boolean
  images?: string[]
  onPreviewChange?: (preview: DragEditorPreview) => void
}

export function DragEditor({ compact = false, images = [], onPreviewChange }: DragEditorProps) {
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<CanvasItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedView, setSelectedView] = useState<ViewMode>("front")
  const [selectedCategory, setSelectedCategory] = useState<string>("Velké mašle")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const pointerState = useRef<PointerState>(null)
  const nextId = useRef(1)

  const categories = Array.from(new Set(paletteItems.map((item) => item.category)))
  const filteredItems = paletteItems.filter((item) => item.category === selectedCategory)

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 767px)").matches)
    }

    updateIsMobile()
    const mql = window.matchMedia("(max-width: 767px)")
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mql.addEventListener?.("change", listener)
    mql.addListener?.(listener)

    return () => {
      mql.removeEventListener?.("change", listener)
      mql.removeListener?.(listener)
    }
  }, [])

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)

    const data = event.dataTransfer.getData("text/plain")
    if (!data) return

    const parsed = JSON.parse(data)
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    const rect = canvasArea.getBoundingClientRect()
    const x = event.clientX - rect.left - 48
    const y = event.clientY - rect.top - 48
    const id = `item-${nextId.current++}`

    setItems((prev) => [
      ...prev,
      {
        id,
        src: parsed.src,
        name: parsed.name,
        left: clamp(x, 0, rect.width - 96),
        top: clamp(y, 0, rect.height - 96),
        width: 96,
        height: 96,
        view: selectedView,
      },
    ])
    setSelectedId(id)
  }

  const handlePointerMove = (event: globalThis.PointerEvent) => {
    const state = pointerState.current
    if (!state) return
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    if (state.type === "drag") {
      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY
      setItems((prev) =>
        prev.map((item) =>
          item.id === state.itemId
            ? {
                ...item,
                left: clamp(state.originLeft + dx, 0, canvasArea.clientWidth - item.width),
                top: clamp(state.originTop + dy, 0, canvasArea.clientHeight - item.height),
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

  const addItemToCanvas = (item: PaletteItem, x?: number, y?: number) => {
    const canvasArea = canvasAreaRef.current
    if (!canvasArea) return

    const rect = canvasArea.getBoundingClientRect()
    const left = x !== undefined ? x : rect.width / 2 - 48
    const top = y !== undefined ? y : rect.height / 2 - 48
    const id = `item-${nextId.current++}`

    setItems((prev) => [
      ...prev,
      {
        id,
        src: item.src,
        name: item.name,
        left: clamp(left, 0, rect.width - 96),
        top: clamp(top, 0, rect.height - 96),
        width: 96,
        height: 96,
        view: selectedView,
      },
    ])
    setSelectedId(id)
  }

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, item: PaletteItem) => {
    event.dataTransfer.setData("text/plain", JSON.stringify(item))
    event.dataTransfer.effectAllowed = "copy"
  }

  const handlePaletteItemClick = (item: PaletteItem) => {
    if (isMobile) {
      setSelectedPaletteId(item.id)
      return
    }

    addItemToCanvas(item)
  }

  const handleCanvasClick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (selectedPaletteId) {
      const paletteItem = paletteItems.find((item) => item.id === selectedPaletteId)
      const canvasArea = canvasAreaRef.current
      if (paletteItem && canvasArea) {
        const rect = canvasArea.getBoundingClientRect()
        const x = event.clientX - rect.left - 48
        const y = event.clientY - rect.top - 48
        addItemToCanvas(paletteItem, x, y)
      }
      setSelectedPaletteId(null)
      return
    }

    if (!(event.target as HTMLElement).closest(".canvas-item")) {
      setSelectedId(null)
    }
  }

  const handleItemPointerDown = (event: ReactPointerEvent<HTMLDivElement>, itemId: string) => {
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
      originLeft: item.left,
      originTop: item.top,
    }

    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    attachPointerListeners()
  }

  

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    setSelectedId((prev) => (prev === itemId ? null : prev))
  }

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
        ctx.drawImage(image, item.left, item.top, item.width, item.height)
      } catch {
        // ignore failed decoration images
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

  return (
    <div className={`drag-editor${compact ? " compact" : ""}`}>
      <div className="editor-header">
        <div>
          <h2>Personalizace plavek</h2>
          <p className="editor-subtitle">Na mobilu klepněte na dekoraci pro přidání, na položku v plátně pak přetahujte.</p>
        </div>
      </div>

      <div className="editor-layout">
        <aside className="panel">
          <div className="panel-header">
            <div>
              <h3>Kategorie dekorací</h3>
            </div>
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handlePaletteItemClick(item)
                  }
                }}
                onDragStart={(event) => handleDragStart(event, item)}
              >
                <img src={item.src} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                </div>
              </div>
            ))}
          </div>
          <div className="mobile-hint">
            {isMobile ? (
              selectedPaletteId ? (
                <p>Klepněte do plátna v místě, kde chcete dekoraci umístit.</p>
              ) : (
                <p>Klepněte na dekoraci pro výběr, pak klepněte na plátno.</p>
              )
            ) : (
              <p>Klikněte a přetáhněte dekoraci do plátna, nebo klepněte pro rychlé vložení.</p>
            )}
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="panel-header">
            <span className="status-pill">{items.length} dekorací</span>
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
                      className={`canvas-item ${selectedId === item.id ? "selected" : ""}`}
                      style={{
                        left: item.left,
                        top: item.top,
                        width: item.width,
                        height: item.height,
                      }}
                      onPointerDown={(event) => handleItemPointerDown(event, item.id)}
                      onClick={() => setSelectedId(item.id)}
                    >
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
                      <img src={item.src} alt={item.name} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      <style jsx global>{`
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

        .editor-helper {
          background: rgba(14, 165, 233, 0.12);
          color: #0369a1;
          padding: 0.85rem 1rem;
          border-radius: 16px;
          font-size: 0.95rem;
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

        .panel-header h3,
        .canvas-panel h3 {
          margin: 0;
          font-size: 1.05rem;
        }

        .panel-header p,
        .canvas-panel p {
          margin: 0.35rem 0 0;
          color: #64748b;
          line-height: 1.5;
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
          transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
        }

        .category-tab.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }

        .items-list {
          display: grid;
          gap: 1rem;
          padding: 1rem 1.5rem 1.5rem;
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
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
          touch-action: manipulation;
          user-select: none;
        }

        .item-card.selected {
          border-color: #0ea5e9;
          background: #e0f2fe;
        }

        .item-card:hover,
        .item-card:focus-visible {
          transform: translateY(-1px);
          border-color: #38bdf8;
          background: #eff8ff;
          outline: none;
        }

        .item-card img {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          object-fit: cover;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        }

        .item-card strong {
          display: block;
          color: #0f172a;
          font-size: 0.97rem;
          text-align: left;
        }

        .canvas-body {
          padding: 1.5rem;
          min-height: 640px;
        }

        .mobile-hint {
          padding: 0 1.5rem 1rem;
          color: #475569;
          font-size: 0.95rem;
        }

        .mobile-hint p {
          margin: 0;
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
          transition: border-color 200ms ease, background 200ms ease;
        }

        .drop-zone.dragover {
          border-color: #0ea5e9;
          background: rgba(14, 165, 233, 0.08);
        }

        .canvas-inner {
          position: relative;
          width: min(100%, 560px);
          aspect-ratio: 3 / 4;
          border-radius: 28px;
          overflow: hidden;
          background: #f1f5f9 no-repeat center/contain;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
          transition: background 300ms ease, box-shadow 300ms ease;
        }

        .canvas-item {
          position: absolute;
          border-radius: 22px;
          cursor: grab;
          touch-action: none;
          user-select: none;
          transform-origin: center;
          transition: transform 180ms ease;
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
          transform-origin: center;
          transition: transform 180ms ease;
        }

        .canvas-item.selected {
          outline: 2px solid rgba(14, 165, 233, 0.95);
          outline-offset: 8px;
        }

        .canvas-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
          box-shadow: 0 18px 44px rgba(15, 23, 42, 0.16);
          pointer-events: none;
          transform-origin: center;
        }

        .controls {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 0.55rem;
          opacity: 0;
          visibility: hidden;
          transition: opacity 180ms ease, visibility 180ms ease;
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
          color: #0f172a;
          background: #ffffff;
          border-radius: 999px;
          padding: 0.75rem 1.15rem;
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
        }

        .view-switcher button.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }

        .view-switcher button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .controls button {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          border: none;
          background: rgba(255, 255, 255, 0.98);
          color: #0f172a;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
          cursor: pointer;
        }

        

        .info-bar {
          margin-top: 1.35rem;
          padding: 1rem 1.15rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          color: #475569;
          font-size: 0.95rem;
        }

        .drag-editor.compact {
          margin-top: 2rem;
          padding: 1rem;
          border-radius: 26px;
        }

        .drag-editor.compact .editor-header {
          gap: 0.75rem;
        }

        .drag-editor.compact .editor-header h2 {
          font-size: clamp(1.25rem, 2vw, 1.6rem);
        }

        .drag-editor.compact .editor-helper {
          font-size: 0.9rem;
          padding: 0.75rem 0.95rem;
        }

        .drag-editor.compact .editor-layout {
          grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
          gap: 1rem;
        }

        .drag-editor.compact .panel-header,
        .drag-editor.compact .canvas-panel .panel-header {
          padding: 1rem 1.1rem;
        }

        .drag-editor.compact .items-list {
          gap: 0.85rem;
          padding: 1rem;
        }

        .drag-editor.compact .item-card {
          padding: 0.85rem 0.9rem;
        }

        .drag-editor.compact .item-card img {
          width: 48px;
          height: 48px;
        }

        .drag-editor.compact .canvas-body {
          padding: 1rem;
          min-height: 460px;
        }

        .drag-editor.compact .drop-zone {
          min-height: 420px;
        }

        .drag-editor.compact .canvas-inner {
          width: min(100%, 460px);
        }

        .drag-editor.compact .status-pill {
          padding: 0.45rem 0.75rem;
          font-size: 0.9rem;
        }

        .drag-editor.compact .controls {
          top: 10px;
          left: 10px;
        }

        .drag-editor.compact .controls button {
          width: 28px;
          height: 28px;
          font-size: 0.9rem;
        }

        

        @media (max-width: 1024px) {
          .editor-layout {
            grid-template-columns: 1fr;
          }

          .canvas-body {
            padding: 1.25rem;
          }
        }

        @media (max-width: 820px) {
          .canvas-inner {
            width: 100%;
            max-width: 100%;
          }

          .drop-zone {
            min-height: 460px;
          }
        }

        @media (max-width: 768px) {
          .drag-editor {
            padding: 1rem;
            border-radius: 22px;
            margin-top: 1.5rem;
          }

          .editor-header {
            margin-bottom: 1.25rem;
          }

          .editor-header h2 {
            font-size: 1.5rem;
          }

          .editor-subtitle {
            font-size: 0.9rem;
            line-height: 1.5;
          }

          .editor-layout {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .panel {
            min-height: auto;
            overflow: visible;
          }

          .panel-header h3 {
            font-size: 1rem;
          }

          .category-tabs {
            padding: 1rem 1rem 0;
            gap: 0.5rem;
            justify-content: flex-start;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .category-tab {
            padding: 0.6rem 0.85rem;
            font-size: 0.9rem;
            white-space: nowrap;
            flex-shrink: 0;
          }

          .items-list {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 0.5rem;
            padding: 0.75rem 1rem 1rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .item-card {
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            width: 72px;
            min-width: 72px;
            padding: 0.5rem 0.4rem;
            gap: 0.3rem;
            border-radius: 16px;
          }

          .item-card img {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
          }

          .item-card strong {
            font-size: 0.7rem;
            text-align: center;
            line-height: 1.2;
          }

          .mobile-hint {
            padding: 0 1rem 0.75rem;
            font-size: 0.85rem;
          }

          .canvas-body {
            padding: 1rem;
            min-height: auto;
          }

          .view-switcher {
            margin-bottom: 0.75rem;
            gap: 0.5rem;
          }

          .view-switcher button {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }

          .drop-zone {
            min-height: auto;
            border-radius: 20px;
            padding: 0.75rem;
          }

          .canvas-inner {
            width: auto;
            height: min(58vh, 460px);
            max-width: 100%;
            aspect-ratio: 3 / 4;
            border-radius: 20px;
          }

          .canvas-item {
            border-radius: 16px;
          }

          .controls {
            top: 8px;
            left: 8px;
            gap: 0.4rem;
          }

          .controls button {
            width: 28px;
            height: 28px;
            font-size: 0.85rem;
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
          }

          .status-pill {
            font-size: 0.9rem;
            padding: 0.5rem 0.8rem;
          }

          .info-bar {
            margin-top: 0.75rem;
            padding: 0.75rem 0.85rem;
            font-size: 0.85rem;
            gap: 0.5rem;
          }
        }

        @media (max-width: 600px) {
          .drag-editor {
            padding: 0.75rem;
          }

          .editor-header {
            margin-bottom: 1rem;
            gap: 0.5rem;
          }

          .editor-header h2 {
            font-size: 1.25rem;
          }

          .editor-subtitle {
            font-size: 0.85rem;
          }

          .panel,
          .canvas-panel {
            border-radius: 18px;
          }

          .panel-header h3,
          .canvas-panel h3 {
            font-size: 0.95rem;
          }

          .category-tabs {
            padding: 0.75rem 0.75rem 0;
            gap: 0.4rem;
          }

          .category-tab {
            padding: 0.5rem 0.75rem;
            font-size: 0.85rem;
            border-radius: 999px;
          }

          .items-list {
            gap: 0.6rem;
            padding: 0.6rem 0.75rem 0.75rem;
          }

          .item-card {
            padding: 0.65rem 0.75rem;
            gap: 0.65rem;
            border-radius: 16px;
          }

          .item-card img {
            width: 44px;
            height: 44px;
          }

          .item-card strong {
            font-size: 0.85rem;
          }

          .mobile-hint {
            padding: 0 0.75rem 0.6rem;
            font-size: 0.8rem;
            line-height: 1.4;
          }

          .canvas-body {
            padding: 0.75rem;
          }

          .view-switcher {
            margin-bottom: 0.6rem;
            gap: 0.4rem;
          }

          .view-switcher button {
            padding: 0.55rem 0.9rem;
            font-size: 0.85rem;
            border-radius: 999px;
          }

          .drop-zone {
            min-height: auto;
            border-radius: 18px;
            padding: 0.6rem;
            border-width: 2px;
          }

          .canvas-inner {
            height: min(54vh, 420px);
            border-radius: 18px;
            aspect-ratio: 3 / 4;
          }

          .canvas-item img {
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
          }

          .controls {
            top: 6px;
            left: 6px;
            gap: 0.35rem;
          }

          .controls button {
            width: 26px;
            height: 26px;
            font-size: 0.8rem;
            border-radius: 10px;
          }

          .info-bar {
            margin-top: 0.6rem;
            padding: 0.6rem 0.7rem;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .drag-editor {
            padding: 0.6rem;
            border-radius: 16px;
          }

          .editor-header {
            margin-bottom: 0.9rem;
          }

          .editor-header h2 {
            font-size: 1.1rem;
          }

          .editor-subtitle {
            font-size: 0.8rem;
            line-height: 1.4;
          }

          .panel,
          .canvas-panel {
            border-radius: 16px;
          }

          .panel-header {
            padding: 1rem 0.85rem;
          }

          .category-tabs {
            padding: 0.6rem 0.6rem 0;
            gap: 0.35rem;
          }

          .category-tab {
            padding: 0.45rem 0.65rem;
            font-size: 0.8rem;
          }

          .items-list {
            gap: 0.5rem;
            padding: 0.5rem 0.6rem 0.6rem;
          }

          .item-card {
            padding: 0.6rem 0.65rem;
            gap: 0.6rem;
          }

          .item-card img {
            width: 40px;
            height: 40px;
            min-width: 40px;
          }

          .item-card strong {
            font-size: 0.8rem;
          }

          .mobile-hint {
            padding: 0 0.6rem 0.5rem;
            font-size: 0.75rem;
          }

          .canvas-body {
            padding: 0.6rem;
            min-height: auto;
          }

          .view-switcher {
            margin-bottom: 0.5rem;
            gap: 0.3rem;
          }

          .view-switcher button {
            padding: 0.5rem 0.8rem;
            font-size: 0.8rem;
          }

          .drop-zone {
            min-height: auto;
            border-radius: 16px;
            padding: 0.5rem;
          }

          .canvas-inner {
            height: min(52vh, 380px);
            border-radius: 16px;
          }

          .controls {
            top: 5px;
            left: 5px;
            gap: 0.3rem;
          }

          .controls button {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
            border-radius: 8px;
          }

          .info-bar {
            margin-top: 0.5rem;
            padding: 0.5rem 0.6rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
