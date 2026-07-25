declare module 'qrcode-generator' {
  interface QRCode {
    addData(data: string): void;
    make(): void;
    getModuleCount(): number;
    isDark(row: number, col: number): boolean;
    createDataURL(cellSize?: number, margin?: number): string;
    createSvgTag(cellSize?: number, margin?: number, alt?: string): string;
    createTableTag(cellSize?: number, margin?: number): string;
    createASCII(): string;
    renderTo2dContext(context: CanvasRenderingContext2D, cellSize?: number): void;
  }

  function qrcode(typeNumber: number, errorCorrectionLevel: string): QRCode;

  export default qrcode;
}
