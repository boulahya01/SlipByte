import { OpenReceiptError } from "./errors.js";
import { defineRasterImage, type RasterImage, type RasterTextRenderer } from "./raster.js";

export type CanvasTextDirection = "ltr" | "rtl" | "inherit";

export type CanvasRasterTextOptions = Readonly<{
  id?: string;
  font: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  direction?: CanvasTextDirection;
  threshold?: number;
}>;

export type CanvasImageDataLike = Readonly<{
  width: number;
  height: number;
  data: ArrayLike<number>;
}>;

export type Canvas2DContextLike = {
  font: string;
  fillStyle: string;
  textBaseline: string;
  direction?: CanvasTextDirection;
  fillRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  getImageData(x: number, y: number, width: number, height: number): CanvasImageDataLike;
};

export type CanvasSurfaceLike = Readonly<{
  getContext(kind: "2d"): Canvas2DContextLike | null;
}>;

export type CanvasSurfaceFactory = (
  width: number,
  height: number,
) => CanvasSurfaceLike;

export function createCanvasRasterTextRenderer(
  createSurface: CanvasSurfaceFactory,
  options: CanvasRasterTextOptions,
): RasterTextRenderer {
  if (typeof createSurface !== "function") {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      "Canvas raster renderer requires a surface factory function.",
      { receivedType: typeof createSurface },
    );
  }

  const resolved = resolveOptions(options);

  return Object.freeze({
    id: resolved.id,
    render(text: string): RasterImage {
      let surface: CanvasSurfaceLike;
      try {
        surface = createSurface(resolved.width, resolved.height);
      } catch {
        throw renderFailure("Canvas surface creation failed.", resolved.id);
      }

      if (!surface || typeof surface.getContext !== "function") {
        throw renderFailure("Canvas surface factory returned an invalid surface.", resolved.id);
      }

      const context = surface.getContext("2d");
      if (!context) {
        throw renderFailure("Canvas surface does not provide a 2D context.", resolved.id);
      }

      try {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, resolved.width, resolved.height);
        context.font = resolved.font;
        context.fillStyle = "#000000";
        context.textBaseline = "top";
        if ("direction" in context) context.direction = resolved.direction;
        context.fillText(text, resolved.x, resolved.y);
      } catch {
        throw renderFailure("Canvas text drawing failed.", resolved.id);
      }

      let imageData: CanvasImageDataLike;
      try {
        imageData = context.getImageData(0, 0, resolved.width, resolved.height);
      } catch {
        throw renderFailure("Canvas pixel readback failed.", resolved.id);
      }

      return rgbaToRaster(imageData, resolved.threshold, resolved.id);
    },
  });
}

function resolveOptions(options: CanvasRasterTextOptions): Required<CanvasRasterTextOptions> {
  if (typeof options !== "object" || options === null || Array.isArray(options)) {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      "Canvas raster renderer options must be an object.",
      { receivedType: Array.isArray(options) ? "array" : typeof options },
    );
  }

  const id = options.id === undefined ? "canvas-2d" : requireSafeText(options.id, "id");
  const font = requireSafeText(options.font, "font");
  const width = requirePositiveInteger(options.width, "width");
  const height = requirePositiveInteger(options.height, "height");
  const x = options.x === undefined ? 0 : requireFiniteNumber(options.x, "x");
  const y = options.y === undefined ? 0 : requireFiniteNumber(options.y, "y");
  const direction = options.direction ?? "inherit";
  if (direction !== "ltr" && direction !== "rtl" && direction !== "inherit") {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      "Canvas text direction must be ltr, rtl, or inherit.",
    );
  }
  const threshold = options.threshold === undefined ? 127 : requireByte(options.threshold, "threshold");

  return Object.freeze({ id, font, width, height, x, y, direction, threshold });
}

function rgbaToRaster(
  imageData: CanvasImageDataLike,
  threshold: number,
  rendererId: string,
): RasterImage {
  if (
    typeof imageData !== "object" ||
    imageData === null ||
    !Number.isInteger(imageData.width) ||
    imageData.width < 1 ||
    !Number.isInteger(imageData.height) ||
    imageData.height < 1
  ) {
    throw renderFailure("Canvas returned invalid image data dimensions.", rendererId);
  }

  const expectedRgbaLength = imageData.width * imageData.height * 4;
  if (!Number.isSafeInteger(expectedRgbaLength)) {
    throw renderFailure("Canvas image data dimensions are too large.", rendererId);
  }

  if (!imageData.data || imageData.data.length !== expectedRgbaLength) {
    throw new OpenReceiptError(
      "RASTER_RENDER_FAILED",
      "Canvas returned invalid RGBA pixel data.",
      { rendererId, expectedLength: expectedRgbaLength },
    );
  }

  const bytesPerRow = Math.ceil(imageData.width / 8);
  const packed = new Array<number>(bytesPerRow * imageData.height).fill(0);

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const rgbaIndex = (y * imageData.width + x) * 4;
      const red = Number(imageData.data[rgbaIndex] ?? 255);
      const green = Number(imageData.data[rgbaIndex + 1] ?? 255);
      const blue = Number(imageData.data[rgbaIndex + 2] ?? 255);
      const alpha = Number(imageData.data[rgbaIndex + 3] ?? 0);

      if (![red, green, blue, alpha].every(isByte)) {
        throw renderFailure("Canvas returned invalid RGBA channel data.", rendererId);
      }

      const luminance = Math.round((red * 299 + green * 587 + blue * 114) / 1000);
      const effectiveLuminance = Math.round((luminance * alpha + 255 * (255 - alpha)) / 255);
      if (effectiveLuminance <= threshold) {
        const byteIndex = y * bytesPerRow + Math.floor(x / 8);
        packed[byteIndex] = (packed[byteIndex] ?? 0) | (0x80 >> (x % 8));
      }
    }
  }

  return defineRasterImage({ width: imageData.width, height: imageData.height, data: packed });
}

function requireSafeText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim() || /[\u0000-\u001F\u007F]/u.test(value)) {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      `Canvas raster renderer ${field} must be safe non-empty text.`,
      { field, receivedType: typeof value },
    );
  }
  return value.trim();
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      `Canvas raster renderer ${field} must be a positive integer.`,
      { field, receivedType: typeof value },
    );
  }
  return value;
}

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      `Canvas raster renderer ${field} must be finite.`,
      { field, receivedType: typeof value },
    );
  }
  return value;
}

function requireByte(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255) {
    throw new OpenReceiptError(
      "INVALID_RASTER_RENDERER",
      `Canvas raster renderer ${field} must be an integer from 0 through 255.`,
      { field, receivedType: typeof value },
    );
  }
  return value;
}

function isByte(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

function renderFailure(message: string, rendererId: string): OpenReceiptError {
  return new OpenReceiptError("RASTER_RENDER_FAILED", message, { rendererId });
}
