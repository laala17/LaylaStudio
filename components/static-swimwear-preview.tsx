"use client"

import { useState } from "react"
import type { EditorExportData } from "@/lib/editor-state"

interface StaticSwimwearPreviewProps {
  exportData: EditorExportData
  /** Intrinsic canvas width used for scaling calculations */
  intrinsicWidth?: number
  /** Intrinsic canvas height used for scaling calculations */
  intrinsicHeight?: number
  /** Display size class */
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: { width: 140, height: 187 },
  md: { width: 200, height: 267 },
  lg: { width: 280, height: 373 },
}

/**
 * Renders a static, read-only preview of a swimsuit with decorations placed
 * at the correct percentage positions. Used in cart, checkout, and admin views.
 *
 * Items are rendered with pointer-events: none — fully read-only.
 */
export function StaticSwimwearPreview({
  exportData,
  intrinsicWidth = 560,
  intrinsicHeight = 746,
  size = "md",
}: StaticSwimwearPreviewProps) {
  const [showFront, setShowFront] = useState(true)

  const dims = sizeMap[size]
  const scaleX = dims.width / intrinsicWidth
  const scaleY = dims.height / intrinsicHeight

  const backgroundSrc = showFront
    ? exportData.frontBackground
    : exportData.backBackground || exportData.frontBackground

  const items = showFront ? exportData.frontItems : exportData.backItems

  return (
    <div className="static-swimwear-preview">
      <div
        className="preview-canvas"
        style={{ width: dims.width, height: dims.height }}
      >
        <div
          className="preview-background"
          style={{ backgroundImage: `url(${backgroundSrc})` }}
        />
        <div className="preview-items">
          {items.map((item) => (
            <div
              key={item.id}
              className="preview-item"
              style={{
                left: (item.leftPercent / 100) * dims.width,
                top: (item.topPercent / 100) * dims.height,
                width: (item.widthPercent / 100) * dims.width,
                height: (item.heightPercent / 100) * dims.height,
              }}
            >
              <img
                src={item.src}
                alt={item.name}
                className="preview-item-img"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="preview-side-switcher">
        <button
          type="button"
          className={`preview-side-btn ${showFront ? "active" : ""}`}
          onClick={() => setShowFront(true)}
        >
          Přední
        </button>
        <button
          type="button"
          className={`preview-side-btn ${!showFront ? "active" : ""}`}
          onClick={() => setShowFront(false)}
        >
          Zadní
        </button>
      </div>

      <style jsx>{`
        .static-swimwear-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-canvas {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #f1f5f9;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.14);
          flex-shrink: 0;
        }

        .preview-background {
          position: absolute;
          inset: 0;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }

        .preview-items {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .preview-item {
          position: absolute;
          pointer-events: none;
          user-select: none;
        }

        .preview-item-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          user-select: none;
        }

        .preview-side-switcher {
          display: flex;
          gap: 0.35rem;
        }

        .preview-side-btn {
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
        }

        .preview-side-btn.active {
          background: #0ea5e9;
          border-color: #0ea5e9;
          color: #ffffff;
        }
      `}</style>
    </div>
  )
}

/**
 * Renders a detailed list of surcharges from export data.
 */
export function SurchargeList({ exportData }: { exportData: EditorExportData }) {
  const { pricing } = exportData
  const allItems = [...exportData.frontItems, ...exportData.backItems]
  const decorationCounts: Record<string, number> = {}

  for (const item of allItems) {
    decorationCounts[item.name] = (decorationCounts[item.name] || 0) + 1
  }

  return (
    <div className="surcharge-list text-xs text-muted-foreground space-y-1">
      {Object.entries(decorationCounts).length === 0 && exportData.heartCount === 0 && (
        <p>Bez příplatků</p>
      )}
      {Object.entries(decorationCounts).map(([name, count]) => (
        <p key={name}>
          {count}× {name} na plátně
        </p>
      ))}
      {exportData.heartCount > 0 && (
        <p>{exportData.heartCount}× Srdíčko mezi prsa</p>
      )}
    </div>
  )
}
