import { resolveCapability, type DeviceProfile } from "./capabilities.js";
import { OpenReceiptError } from "./errors.js";

const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;

export type NativeTextRepresentationCandidate = Readonly<{
  id: string;
  canRepresent: (text: string) => boolean;
}>;

export type TextRepresentationOptions = Readonly<{
  nativeCandidates?: readonly NativeTextRepresentationCandidate[];
  allowRasterFallback?: boolean;
}>;

export type NativeTextRepresentationSelection = Readonly<{
  kind: "native";
  encodingId: string;
}>;

export type RasterTextRepresentationSelection = Readonly<{
  kind: "raster";
  usesCapabilityFallback: boolean;
}>;

export type TextRepresentationSelection =
  | NativeTextRepresentationSelection
  | RasterTextRepresentationSelection;

export function selectTextRepresentation(
  text: string,
  profile: DeviceProfile,
  options: TextRepresentationOptions = {},
): TextRepresentationSelection {
  if (typeof text !== "string") {
    throw new OpenReceiptError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "Text representation input must be a string.",
      { receivedType: typeof text },
    );
  }

  const candidates = resolveNativeCandidates(options.nativeCandidates);
  const allowRasterFallback = resolveRasterFallbackOption(
    options.allowRasterFallback,
  );
  const textCapability = resolveCapability(profile, "text");

  if (textCapability.support === "native") {
    for (const [index, candidate] of candidates.entries()) {
      let supported: unknown;

      try {
        supported = candidate.canRepresent(text);
      } catch {
        throw new OpenReceiptError(
          "TEXT_REPRESENTATION_FAILED",
          "A native text representation probe failed.",
          { candidateIndex: index },
        );
      }

      if (typeof supported !== "boolean") {
        throw new OpenReceiptError(
          "INVALID_TEXT_REPRESENTATION_OPTION",
          "Native text representation probes must return a boolean.",
          { candidateIndex: index, receivedType: typeof supported },
        );
      }

      if (supported) {
        return Object.freeze({
          kind: "native",
          encodingId: candidate.id,
        });
      }
    }
  }

  if (allowRasterFallback) {
    const rasterCapability = resolveCapability(profile, "raster");
    if (rasterCapability.usable) {
      return Object.freeze({
        kind: "raster",
        usesCapabilityFallback: rasterCapability.usesFallback,
      });
    }
  }

  throw new OpenReceiptError(
    "UNSUPPORTED_TEXT_REPRESENTATION",
    "The configured device representation policy cannot safely represent this text.",
    {
      nativeTextSupport: textCapability.support,
      rasterFallbackAllowed: allowRasterFallback,
    },
  );
}

function resolveNativeCandidates(
  value: readonly NativeTextRepresentationCandidate[] | undefined,
): readonly NativeTextRepresentationCandidate[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new OpenReceiptError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "nativeCandidates must be an array when provided.",
      { receivedType: typeof value },
    );
  }

  const candidates = value.map((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null) {
      throw new OpenReceiptError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidates must be objects.",
        { candidateIndex: index, receivedType: typeof candidate },
      );
    }

    if (
      typeof candidate.id !== "string" ||
      !candidate.id.trim() ||
      UNSAFE_IDENTIFIER_TEXT.test(candidate.id)
    ) {
      throw new OpenReceiptError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidate ids must be safe non-empty text.",
        { candidateIndex: index },
      );
    }

    if (typeof candidate.canRepresent !== "function") {
      throw new OpenReceiptError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidates must provide canRepresent(text).",
        { candidateIndex: index },
      );
    }

    return Object.freeze({
      id: candidate.id.trim(),
      canRepresent: candidate.canRepresent,
    });
  });

  return Object.freeze(candidates);
}

function resolveRasterFallbackOption(value: boolean | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") {
    throw new OpenReceiptError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "allowRasterFallback must be a boolean when provided.",
      { receivedType: typeof value },
    );
  }
  return value;
}
