import {
  defineDeviceProfile,
  resolveCapability,
  type DeviceProfile,
} from "./capabilities.js";
import { OpenReceiptError } from "./errors.js";
import { defineRasterImage, type RasterImage } from "./raster.js";

const GS = 0x1d;
const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;

export type EscPosRasterEncoder = Readonly<{
  id: string;
  encode: (image: RasterImage) => Uint8Array;
}>;

export type EscPosRasterConfig = Readonly<{
  profileId: string;
  encoder: EscPosRasterEncoder;
}>;

export const ESC_POS_GS_V0_RASTER_ENCODER: EscPosRasterEncoder = Object.freeze({
  id: "gs-v-0",
  encode(image: RasterImage): Uint8Array {
    const resolvedImage = defineRasterImage(image);
    const bytesPerRow = Math.ceil(resolvedImage.width / 8);

    if (bytesPerRow > 65_535 || resolvedImage.height > 65_535) {
      throw new OpenReceiptError(
        "RASTER_ENCODING_FAILED",
        "Raster image exceeds the addressable GS v 0 dimensions.",
        { width: resolvedImage.width, height: resolvedImage.height },
      );
    }

    return Uint8Array.from([
      GS,
      0x76,
      0x30,
      0x00,
      bytesPerRow & 0xff,
      (bytesPerRow >> 8) & 0xff,
      resolvedImage.height & 0xff,
      (resolvedImage.height >> 8) & 0xff,
      ...resolvedImage.data,
    ]);
  },
});

export function encodeEscPosRaster(
  image: RasterImage,
  profile: DeviceProfile,
  config: EscPosRasterConfig,
): Uint8Array {
  const resolvedProfile = defineDeviceProfile(profile);
  if (resolvedProfile.protocol !== "escpos") {
    throw new OpenReceiptError(
      "UNSUPPORTED_PROTOCOL",
      'The ESC/POS raster adapter requires a device profile with protocol "escpos".',
      { profileId: resolvedProfile.id, protocol: resolvedProfile.protocol },
    );
  }

  const rasterCapability = resolveCapability(resolvedProfile, "raster");
  if (!rasterCapability.usable) {
    throw new OpenReceiptError(
      "UNSUPPORTED_CAPABILITY",
      "The device profile does not support raster output.",
      {
        profileId: resolvedProfile.id,
        protocol: resolvedProfile.protocol,
        capability: "raster",
        support: rasterCapability.support,
      },
    );
  }

  const resolvedImage = defineRasterImage(image);
  const resolvedConfig = resolveRasterConfig(resolvedProfile, config);
  let encoded: unknown;

  try {
    encoded = resolvedConfig.encoder.encode(resolvedImage);
  } catch (error) {
    if (error instanceof OpenReceiptError && error.code === "RASTER_ENCODING_FAILED") {
      throw error;
    }

    throw new OpenReceiptError(
      "RASTER_ENCODING_FAILED",
      "The configured ESC/POS raster encoder failed.",
      {
        profileId: resolvedProfile.id,
        rasterEncoderId: resolvedConfig.encoder.id,
      },
    );
  }

  if (!(encoded instanceof Uint8Array)) {
    throw new OpenReceiptError(
      "RASTER_ENCODING_FAILED",
      "The configured ESC/POS raster encoder must return Uint8Array bytes.",
      {
        profileId: resolvedProfile.id,
        rasterEncoderId: resolvedConfig.encoder.id,
      },
    );
  }

  return Uint8Array.from(encoded);
}

function resolveRasterConfig(
  profile: DeviceProfile,
  config: EscPosRasterConfig,
): EscPosRasterConfig {
  if (typeof config !== "object" || config === null || Array.isArray(config)) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS raster config must be an object.",
      { receivedType: Array.isArray(config) ? "array" : typeof config },
    );
  }

  const profileId = requireSafeIdentifier(config.profileId, "profileId");
  if (profileId !== profile.id) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS raster configuration belongs to a different device profile.",
      { profileId: profile.id },
    );
  }

  const encoder = resolveRasterEncoder(config.encoder);
  return Object.freeze({ profileId, encoder });
}

function resolveRasterEncoder(encoder: EscPosRasterEncoder): EscPosRasterEncoder {
  if (
    typeof encoder !== "object" ||
    encoder === null ||
    Array.isArray(encoder) ||
    typeof encoder.id !== "string" ||
    !encoder.id.trim() ||
    UNSAFE_IDENTIFIER_TEXT.test(encoder.id) ||
    typeof encoder.encode !== "function"
  ) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS raster encoder must provide a safe non-empty id and encode(image) function.",
    );
  }

  return Object.freeze({ id: encoder.id.trim(), encode: encoder.encode });
}

function requireSafeIdentifier(value: unknown, field: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    UNSAFE_IDENTIFIER_TEXT.test(value)
  ) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      `ESC/POS raster ${field} must be safe non-empty text.`,
      { field, receivedType: typeof value },
    );
  }

  return value.trim();
}
