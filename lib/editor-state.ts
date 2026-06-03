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

export type DragEditorState = {
  selectedView: ViewMode
  background: {
    frontSrc: string
    backSrc: string
  }
  items: DragDecorationItem[]
}
