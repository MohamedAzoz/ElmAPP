/** Tools available in the PDF editor */
export type EditorTool = 'select' | 'text' | 'draw' | 'highlight' | 'image' | 'shape';

/** Export destination for the PDF */
export type ExportTarget = 'local' | 'drive';

/** Shape types for the shape tool */
export type ShapeType = 'rectangle' | 'circle' | 'line';

/** Text alignment options */
export type TextAlign = 'left' | 'center' | 'right';

/** Represents a single annotation overlay on the PDF */
export interface Annotation {
  id: string;
  type: EditorTool;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  color: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: TextAlign;
  shapeType?: ShapeType;
  opacity?: number;
  isSelected?: boolean;
}

/** Represents a file entry from Google Drive */
export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
  iconLink?: string;
  size?: string;
  mimeType?: string;
}

/** Toolbar button definition */
export interface ToolbarButton {
  tool: EditorTool;
  icon: string;
  label: string;
  tooltip: string;
}

/** Editor state snapshot for undo/redo */
export interface EditorState {
  annotations: Annotation[];
  currentPage: number;
}

/** Page info for thumbnail rendering */
export interface PageInfo {
  pageNumber: number;
  thumbnail?: string;
  isActive: boolean;
}

/** Properties for the selected annotation/element */
export interface ElementProperties {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: TextAlign;
  opacity: number;
}

/** File source dialog result */
export interface FileSourceResult {
  source: 'local' | 'drive';
  file?: File;
  driveFile?: DriveFile;
}
