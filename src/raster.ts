import { SlipByteError } from "./errors.js";

const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;

export type RasterImage = Readonly<{
  width: number;
  height: number;
  data: readonly number[];
}>;

export type RasterTextRenderer = Readonly<{
  id: string;
  render: (text: string) => unknown;
}>;

export function defineRasterImage(value: unknown): RasterImage {
  const candidate = value as Partial<RasterImage> | null;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new SlipByteError(
      "INVALID_RASTER_IMAGE",
      "Raster image must be an object.",
      { receivedType: Array.isArray(candidate) ? "array" : typeof candidate },
    );
  }

  const width = requirePositiveInteger(candidate.width, "width");
  const height = requirePositiveInteger(candidate.height, "height");
  const bytesPerRow = Math.ceil(width / 8);
  const expectedLength = bytesPerRow * height;

  if (!Number.isSafeInteger(expectedLength)) {
    throw new SlipByteError(
      "INVALID_RASTER_IMAGE",
      "Raster image dimensions are too large.",
      { width, height },
    );
  }

  if (!Array.isArray(candidate.data) && !(candidate.data instanceof Uint8Array)) {
    throw new SlipByteError(
      "INVALID_RASTER_IMAGE",
      "Raster image data must be an array or Uint8Array of packed bytes.",
      { receivedType: typeof candidate.data },
    );
  }

  const data = Array.from(candidate.data as readonly number[]);
  if (data.length !== expectedLength) {
    throw new SlipByteError(
      "INVALID_RASTER_IMAGE",
      "Raster image data length does not match its dimensions.",
      { width, height, expectedLength, receivedLength: data.length },
    );
  }

  for (let index = 0; index < data.length; index += 1) {
    const byte = data[index];
    if (
      typeof byte !== "number" ||
      !Number.isInteger(byte) ||
      byte < 0 ||
      byte > 255
    ) {
      throw new SlipByteError(
        "INVALID_RASTER_IMAGE",
        "Raster image data entries must be bytes.",
        { byteIndex: index, receivedType: typeof byte },
      );
    }
  }

  const unusedBits = bytesPerRow * 8 - width;
  if (unusedBits > 0) {
    const paddingMask = (1 << unusedBits) - 1;
    for (let row = 0; row < height; row += 1) {
      const lastByteIndex = row * bytesPerRow + bytesPerRow - 1;
      const lastByte = data[lastByteIndex] ?? 0;
      if ((lastByte & paddingMask) !== 0) {
        throw new SlipByteError(
          "INVALID_RASTER_IMAGE",
          "Unused padding bits in raster rows must be zero.",
          { row },
        );
      }
    }
  }

  return Object.freeze({
    width,
    height,
    data: Object.freeze([...data]),
  });
}

export function renderTextToRaster(
  text: string,
  renderer: RasterTextRenderer,
): RasterImage {
  if (typeof text !== "string") {
    throw new SlipByteError(
      "INVALID_RASTER_RENDERER",
      "Raster text input must be a string.",
      { receivedType: typeof text },
    );
  }

  const resolvedRenderer = resolveRasterRenderer(renderer);
  let rendered: unknown;

  try {
    rendered = resolvedRenderer.render(text);
  } catch {
    throw new SlipByteError(
      "RASTER_RENDER_FAILED",
      "The configured raster text renderer failed.",
      { rendererId: resolvedRenderer.id },
    );
  }

  try {
    return defineRasterImage(rendered);
  } catch (error) {
    if (error instanceof SlipByteError && error.code === "INVALID_RASTER_IMAGE") {
      throw new SlipByteError(
        "RASTER_RENDER_FAILED",
        "The configured raster text renderer returned an invalid raster image.",
        { rendererId: resolvedRenderer.id },
      );
    }
    throw error;
  }
}

function resolveRasterRenderer(renderer: RasterTextRenderer): RasterTextRenderer {
  if (
    typeof renderer !== "object" ||
    renderer === null ||
    Array.isArray(renderer) ||
    typeof renderer.id !== "string" ||
    !renderer.id.trim() ||
    UNSAFE_IDENTIFIER_TEXT.test(renderer.id) ||
    typeof renderer.render !== "function"
  ) {
    throw new SlipByteError(
      "INVALID_RASTER_RENDERER",
      "Raster text renderer must provide a safe non-empty id and render(text) function.",
    );
  }

  return Object.freeze({ id: renderer.id.trim(), render: renderer.render });
}

function requirePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new SlipByteError(
      "INVALID_RASTER_IMAGE",
      `Raster image ${field} must be a positive integer.`,
      { field, receivedType: typeof value },
    );
  }

  return value;
}
