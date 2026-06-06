"use client"

import { useState, useCallback, useEffect } from "react"
import type { DragEditorState } from "@/lib/editor-state"

interface AdminEditorViewProps {
  editorState: DragEditorState | null
}

type ViewMode = "front" | "back"

export function AdminEditorView({ editorState }: AdminEditorViewProps) {
  const [selectedView, setSelectedView] = useState<ViewMode>("front")
  const [canvasScale, setCanvasScale] = useState(1)
  const canvasRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const updateScale = () => {
      const parent = node.parentElement
      if (!parent) return
      const parentWidth = parent.clientWidth - 48
      const scale = Math.min(1, parentWidth / 560)
      setCanvasScale(scale)
    }
    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  if (!editorState) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Editor state není k dispozici.
      </div>
    )
  }

  const backgroundSrc = selectedView === "front"
    ? editorState.background.frontSrc
    : editorState.background.backSrc || editorState.background.frontSrc

  const viewItems = editorState.items.filter((item) => item.view === selectedView)

  return (
    <div className="admin-editor-view">
      <div className="admin-editor-header">
        <h2>Náhled konfigurace</h2>
        <span className="status-pill">
          {viewItems.length} dekorací · {selectedView === "front" ? "Zepředu" : "Zezadu"}
        </span>
        {editorState.pricing && (
          <span className="status-pill price-pill">
            {editorState.pricing.totalPrice} Kč
          </span>
        )}
      </div>

      <div className="admin-canvas-body" ref={canvasRef}>
        <div className="admin-view-switcher">
          <button
            type="button"
            className={selectedView === "front" ? "active" : ""}
            onClick={() => setSelectedView("front")}
          >
            Zepředu
          </button>
          <button
            type="button"
            className={selectedView === "back" ? "active" : ""}
            onClick={() => setSelectedView("back")}
            disabled={!editorState.background.backSrc}
          >
            Zezadu
          </button>
        </div>

        <div className="admin-drop-zone">
          <div
            className="admin-canvas-inner"
            style={{
              backgroundImage: `url(${backgroundSrc})`,
              transform: `scale(${canvasScale})`,
              transformOrigin: "top center",
            }}
          >
            <div className="admin-canvas-area">
              {viewItems.map((item) => (
                <div
                  key={item.id}
                  className="admin-canvas-item"
                  style={{
                    left: `${item.left}%`,
                    top: `${item.top}%`,
                    width: `${item.width}%`,
                    height: `${item.height}%`,
                  }}
                >
                  <img
                    src={item.src}
                    alt={item.name}
                    className="admin-decoration-image"
                    draggable={false}
                  />
                </div>
              ))}
            </div>

            {viewItems.length === 0 && (
              <div className="admin-empty-hint">
                Žádné dekorace na této straně
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-info-bar">
        <span>Dekorace: {editorState.items.length} celkem</span>
        <span>
          {editorState.items.filter((i) => i.view === "front").length} zepředu ·{" "}
          {editorState.items.filter((i) => i.view === "back").length} zezadu
        </span>
      </div>

      <style jsx global>{`
        .admin-editor-view {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(14, 165, 233, 0.18);
          border-radius: 32px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .admin-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.35rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-editor-header h2 {
          margin: 0;
          font-size: 1.05rem;
        }

        .status-pill {
          background: rgba(14, 165, 233, 0.12);
          color: #0369a1;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-size: 0.95rem;
          white-space: nowrap;
        }

        .admin-canvas-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .admin-view-switcher {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .admin-view-switcher button {
          border: 1px solid #cbd5e1;
          color: #0f172a;
          background: #ffffff;
          border-radius: 999px;
          padding: 0.75rem 1.15rem;
          cursor: pointer;
          transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
          font-size: 0.95rem;
        }

        .admin-view-switcher button.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }

        .admin-view-switcher button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .admin-drop-zone {
          position: relative;
          width: 100%;
          min-height: 520px;
          border-radius: 28px;
          border: 2px dashed #cbd5e1;
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: hidden;
        }

        .admin-canvas-inner {
          position: relative;
          width: min(100%, 560px);
          aspect-ratio: 3 / 4;
          border-radius: 28px;
          overflow: hidden;
          background: #f1f5f9 no-repeat center/contain;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
          flex-shrink: 0;
        }

        .admin-canvas-area {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .admin-canvas-item {
          position: absolute;
          border-radius: 22px;
          pointer-events: none;
          user-select: none;
        }

        .admin-decoration-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
        }

        .admin-empty-hint {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 1rem;
          pointer-events: none;
        }

        .admin-info-bar {
          padding: 1rem 1.15rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          color: #475569;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .admin-editor-header {
            padding: 1rem 1.1rem;
          }

          .admin-editor-header h2 {
            font-size: 1rem;
          }

          .status-pill {
            padding: 0.45rem 0.75rem;
            font-size: 0.9rem;
          }

          .admin-canvas-body {
            padding: 1rem;
          }

          .admin-view-switcher {
            gap: 0.5rem;
            margin-bottom: 0.75rem;
          }

          .admin-view-switcher button {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }

          .admin-drop-zone {
            min-height: 380px;
            border-radius: 20px;
          }

          .admin-canvas-inner {
            width: 100%;
            max-width: 100%;
            border-radius: 20px;
          }

          .admin-info-bar {
            padding: 0.75rem 0.85rem;
            font-size: 0.85rem;
          }
        }

        @media (max-width: 480px) {
          .admin-editor-header {
            padding: 0.75rem 0.85rem;
          }

          .admin-editor-header h2 {
            font-size: 0.9rem;
          }

          .status-pill {
            padding: 0.35rem 0.6rem;
            font-size: 0.8rem;
          }

          .admin-canvas-body {
            padding: 0.75rem;
          }

          .admin-view-switcher {
            gap: 0.3rem;
            margin-bottom: 0.5rem;
          }

          .admin-view-switcher button {
            padding: 0.5rem 0.8rem;
            font-size: 0.8rem;
          }

          .admin-drop-zone {
            min-height: 300px;
            border-radius: 16px;
          }

          .admin-canvas-inner {
            border-radius: 16px;
          }

          .admin-info-bar {
            padding: 0.5rem 0.6rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}
