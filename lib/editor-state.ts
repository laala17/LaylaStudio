export type ViewMode = "front" | "back"

export type DragDecorationItem = {
  id: string
  src: string
  name: string
  left: number
  top: number
  width: number
  height: number
  view: ViewMode
}

export type DragDecorationItemPercent = {
  id: string
  src: string
  name: string
  /** left as percentage of canvas width (0–100) */
  leftPercent: number
  /** top as percentage of canvas height (0–100) */
  topPercent: number
  /** width as percentage of canvas width (0–100) */
  widthPercent: number
  /** height as percentage of canvas height (0–100) */
  heightPercent: number
  view: ViewMode
}

export const PRICING = {
  BASE_PRICE: 500,
  SURCHARGES: {
    "Velká mašle": 5,
    "Malá mašle": 3,
    "Korálky": 3,
  } as Record<string, number>,
  HEART: 5,
} as const

export type DiscountInfo = {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  discountAmount: number
}

export type PricingBreakdown = {
  basePrice: number
  decorationsSurcharge: number
  heartSurcharge: number
  heartCount: number
  discount: DiscountInfo | null
  totalPrice: number
  decorationCounts: Record<string, number>
}

export function computePricing(
  items: DragDecorationItem[],
  heartCount: number,
  basePrice: number = PRICING.BASE_PRICE,
  discount?: DiscountInfo | null,
): PricingBreakdown {
  const decorationCounts: Record<string, number> = {}

  for (const item of items) {
    const name = item.name
    decorationCounts[name] = (decorationCounts[name] || 0) + 1
  }

  let decorationsSurcharge = 0
  for (const [name, count] of Object.entries(decorationCounts)) {
    const price = PRICING.SURCHARGES[name]
    if (price !== undefined) {
      decorationsSurcharge += price * count
    }
  }

  const heartSurcharge = heartCount * PRICING.HEART
  const subtotal = basePrice + decorationsSurcharge + heartSurcharge

  // Calculate discount
  let discountInfo: DiscountInfo | null = null
  if (discount && discount.code) {
    let discountAmount = 0
    if (discount.discountType === "percentage") {
      discountAmount = Math.round(subtotal * (discount.discountValue / 100))
    } else {
      // Fixed amount discount (cannot exceed subtotal)
      discountAmount = Math.min(discount.discountValue, subtotal)
    }
    discountInfo = {
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountAmount,
    }
  }

  const totalPrice = subtotal - (discountInfo?.discountAmount ?? 0)

  return {
    basePrice,
    decorationsSurcharge,
    heartSurcharge,
    heartCount,
    discount: discountInfo,
    totalPrice,
    decorationCounts,
  }
}

/** Convert a pixel-based item to percentage-based using given canvas dimensions */
export function toPercentItem(
  item: DragDecorationItem,
  canvasWidth: number,
  canvasHeight: number,
): DragDecorationItemPercent {
  return {
    id: item.id,
    src: item.src,
    name: item.name,
    leftPercent: canvasWidth > 0 ? (item.left / canvasWidth) * 100 : 0,
    topPercent: canvasHeight > 0 ? (item.top / canvasHeight) * 100 : 0,
    widthPercent: canvasWidth > 0 ? (item.width / canvasWidth) * 100 : 0,
    heightPercent: canvasHeight > 0 ? (item.height / canvasHeight) * 100 : 0,
    view: item.view,
  }
}

/** Convert a percentage-based item back to pixels for a given container size */
export function fromPercentItem(
  item: DragDecorationItemPercent,
  containerWidth: number,
  containerHeight: number,
): { left: number; top: number; width: number; height: number } {
  return {
    left: (item.leftPercent / 100) * containerWidth,
    top: (item.topPercent / 100) * containerHeight,
    width: (item.widthPercent / 100) * containerWidth,
    height: (item.heightPercent / 100) * containerHeight,
  }
}

/**
 * Export clean JSON data from editor state, with positions in percentages.
 * This is the data structure suitable for storing in an order.
 */
export type EditorExportData = {
  frontBackground: string
  backBackground: string
  frontItems: DragDecorationItemPercent[]
  backItems: DragDecorationItemPercent[]
  heartCount: number
  pricing: PricingBreakdown
}

export function getEditorData(
  state: DragEditorState,
  heartCount: number,
  canvasWidth: number,
  canvasHeight: number,
): EditorExportData {
  return {
    frontBackground: state.background.frontSrc,
    backBackground: state.background.backSrc,
    frontItems: state.items
      .filter((i) => i.view === "front")
      .map((i) => toPercentItem(i, canvasWidth, canvasHeight)),
    backItems: state.items
      .filter((i) => i.view === "back")
      .map((i) => toPercentItem(i, canvasWidth, canvasHeight)),
    heartCount,
    pricing: state.pricing,
  }
}

export type DragEditorState = {
  selectedView: ViewMode
  background: {
    frontSrc: string
    backSrc: string
  }
  items: DragDecorationItem[]
  pricing: PricingBreakdown
}
