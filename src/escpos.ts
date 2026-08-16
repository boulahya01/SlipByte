import {
  defineDeviceProfile,
  resolveCapability,
  type DeviceProfile,
  type PrinterCapability,
} from "./capabilities.js";
import { OpenReceiptError } from "./errors.js";
import type { LayoutDocument } from "./layout.js";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;

export type EscPosTextEncoder = Readonly<{
  id: string;
  encode: (text: string) => Uint8Array;
}>;

export type EscPosTextEncodingConfig = Readonly<{
  profileId: string;
  encodingId: string;
  codePage: number;
  encoder: EscPosTextEncoder;
}>;

export type EscPosCutFallback = Readonly<{
  type: "feed";
  lines: number;
}>;

export type EscPosEncoderOptions = Readonly<{
  textEncoder?: EscPosTextEncoder;
  textEncoding?: EscPosTextEncodingConfig;
  cutFallback?: EscPosCutFallback;
}>;

export const ESC_POS_ASCII_TEXT_ENCODER: EscPosTextEncoder = Object.freeze({
  id: "ascii",
  encode(text: string): Uint8Array {
    const bytes = new Uint8Array(text.length);

    for (let index = 0; index < text.length; index += 1) {
      const codePoint = text.charCodeAt(index);
      if (codePoint < 0x20 || codePoint > 0x7e) {
        throw new OpenReceiptError(
          "TEXT_ENCODING_FAILED",
          "The default ESC/POS text encoder only accepts printable ASCII.",
          { encoderId: "ascii", characterIndex: index },
        );
      }
      bytes[index] = codePoint;
    }

    return bytes;
  },
});

export function encodeEscPos(
  layout: LayoutDocument,
  profile: DeviceProfile,
  options: EscPosEncoderOptions = {},
): Uint8Array {
  const resolvedProfile = defineDeviceProfile(profile);
  if (resolvedProfile.protocol !== "escpos") {
    throw new OpenReceiptError(
      "UNSUPPORTED_PROTOCOL",
      'The ESC/POS encoder requires a device profile with protocol "escpos".',
      { profileId: resolvedProfile.id, protocol: resolvedProfile.protocol },
    );
  }

  if (options.textEncoder !== undefined && options.textEncoding !== undefined) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "Configure either textEncoder or textEncoding, not both.",
    );
  }

  const textEncoding = resolveTextEncodingConfig(
    resolvedProfile,
    options.textEncoding,
  );
  const textEncoder = textEncoding?.encoder ?? resolveTextEncoder(
    options.textEncoder ?? ESC_POS_ASCII_TEXT_ENCODER,
  );
  const cutFallback = resolveCutFallback(options.cutFallback);
  const bytes: number[] = [ESC, 0x40];
  let bold = false;
  let selectedTextEncoding = false;

  for (const node of layout.nodes) {
    switch (node.type) {
      case "line": {
        requireNativeCapability(resolvedProfile, "text");

        if (textEncoding && !selectedTextEncoding) {
          bytes.push(ESC, 0x74, textEncoding.codePage);
          selectedTextEncoding = true;
        }

        if (node.bold !== bold) {
          bytes.push(ESC, 0x45, node.bold ? 1 : 0);
          bold = node.bold;
        }

        bytes.push(...encodeText(node.value, textEncoder, node.sourceNodeIndex));
        bytes.push(LF);
        break;
      }
      case "feed":
        appendFeed(bytes, node.lines);
        break;
      case "cut": {
        const cut = resolveCapability(resolvedProfile, "cut");
        if (cut.support === "native") {
          bytes.push(GS, 0x56, 0x00);
          break;
        }

        if (cut.support === "fallback" && cutFallback) {
          appendFeed(bytes, cutFallback.lines);
          break;
        }

        throw new OpenReceiptError(
          "UNSUPPORTED_CAPABILITY",
          cut.support === "fallback"
            ? "The device profile marks cut as fallback, but no explicit ESC/POS cut fallback was configured."
            : "The device profile does not support cutting.",
          {
            profileId: resolvedProfile.id,
            protocol: resolvedProfile.protocol,
            capability: "cut",
            support: cut.support,
          },
        );
      }
    }
  }

  if (bold) {
    bytes.push(ESC, 0x45, 0);
  }

  return Uint8Array.from(bytes);
}

function requireNativeCapability(
  profile: DeviceProfile,
  capability: PrinterCapability,
): void {
  const resolution = resolveCapability(profile, capability);
  if (resolution.support === "native") return;

  throw new OpenReceiptError(
    "UNSUPPORTED_CAPABILITY",
    `The ESC/POS encoder requires native ${capability} support for this operation.`,
    {
      profileId: profile.id,
      protocol: profile.protocol,
      capability,
      support: resolution.support,
    },
  );
}

function resolveTextEncodingConfig(
  profile: DeviceProfile,
  value: EscPosTextEncodingConfig | undefined,
): EscPosTextEncodingConfig | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "textEncoding must be an object when provided.",
      { receivedType: Array.isArray(value) ? "array" : typeof value },
    );
  }

  const profileId = requireSafeIdentifier(value.profileId, "textEncoding.profileId");
  const encodingId = requireSafeIdentifier(value.encodingId, "textEncoding.encodingId");

  if (profileId !== profile.id) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS text encoding configuration belongs to a different device profile.",
      { profileId: profile.id },
    );
  }

  if (!(profile.textEncodings ?? []).includes(encodingId)) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS text encoding must be declared by the device profile.",
      { profileId: profile.id },
    );
  }

  if (!Number.isInteger(value.codePage) || value.codePage < 0 || value.codePage > 255) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS text encoding codePage must be an integer from 0 through 255.",
      { profileId: profile.id },
    );
  }

  const encoder = resolveTextEncoder(value.encoder);
  if (encoder.id !== encodingId) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS text encoder id must match textEncoding.encodingId.",
      { profileId: profile.id },
    );
  }

  return Object.freeze({
    profileId,
    encodingId,
    codePage: value.codePage,
    encoder,
  });
}

function resolveTextEncoder(encoder: EscPosTextEncoder): EscPosTextEncoder {
  if (
    typeof encoder !== "object" ||
    encoder === null ||
    typeof encoder.id !== "string" ||
    !encoder.id.trim() ||
    UNSAFE_IDENTIFIER_TEXT.test(encoder.id) ||
    typeof encoder.encode !== "function"
  ) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "textEncoder must provide a safe non-empty id and an encode(text) function.",
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
      `${field} must be safe non-empty text.`,
      { field, receivedType: typeof value },
    );
  }

  return value.trim();
}

function resolveCutFallback(
  fallback: EscPosCutFallback | undefined,
): EscPosCutFallback | undefined {
  if (fallback === undefined) return undefined;

  if (
    fallback.type !== "feed" ||
    !Number.isInteger(fallback.lines) ||
    fallback.lines < 1
  ) {
    throw new OpenReceiptError(
      "INVALID_ENCODER_OPTION",
      "ESC/POS cutFallback must be a feed fallback with a positive integer line count.",
    );
  }

  return Object.freeze({ type: "feed", lines: fallback.lines });
}

function encodeText(
  text: string,
  encoder: EscPosTextEncoder,
  sourceNodeIndex: number,
): number[] {
  let encoded: unknown;

  try {
    encoded = encoder.encode(text);
  } catch (cause) {
    if (cause instanceof OpenReceiptError && cause.code === "TEXT_ENCODING_FAILED") {
      throw cause;
    }

    throw new OpenReceiptError(
      "TEXT_ENCODING_FAILED",
      "The configured ESC/POS text encoder failed.",
      { encoderId: encoder.id, sourceNodeIndex },
    );
  }

  if (!(encoded instanceof Uint8Array)) {
    throw new OpenReceiptError(
      "TEXT_ENCODING_FAILED",
      "The configured ESC/POS text encoder must return Uint8Array bytes.",
      { encoderId: encoder.id, sourceNodeIndex },
    );
  }

  return [...encoded];
}

function appendFeed(bytes: number[], lines: number): void {
  let remaining = lines;
  while (remaining > 0) {
    const chunk = Math.min(remaining, 255);
    bytes.push(ESC, 0x64, chunk);
    remaining -= chunk;
  }
}
