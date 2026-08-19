import {
  defineDeviceProfile,
  resolveCapability,
  type DeviceProfile,
} from "./capabilities.js";
import { SlipByteError } from "./errors.js";

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
    throw new SlipByteError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "Text representation input must be a string.",
      { receivedType: typeof text },
    );
  }

  const resolvedProfile = defineDeviceProfile(profile);
  const resolvedOptions = resolveOptions(options);
  const candidates = resolveNativeCandidates(resolvedOptions.nativeCandidates);
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const allowRasterFallback = resolveRasterFallbackOption(
    resolvedOptions.allowRasterFallback,
  );
  const textCapability = resolveCapability(resolvedProfile, "text");

  if (textCapability.support === "native") {
    for (const encodingId of resolvedProfile.textEncodings ?? []) {
      const candidate = candidatesById.get(encodingId);
      if (!candidate) continue;

      const candidateIndex = candidates.indexOf(candidate);
      let supported: unknown;

      try {
        supported = candidate.canRepresent(text);
      } catch {
        throw new SlipByteError(
          "TEXT_REPRESENTATION_FAILED",
          "A native text representation probe failed.",
          { candidateIndex },
        );
      }

      if (typeof supported !== "boolean") {
        throw new SlipByteError(
          "INVALID_TEXT_REPRESENTATION_OPTION",
          "Native text representation probes must return a boolean.",
          { candidateIndex, receivedType: typeof supported },
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
    const rasterCapability = resolveCapability(resolvedProfile, "raster");
    if (rasterCapability.usable) {
      return Object.freeze({
        kind: "raster",
        usesCapabilityFallback: rasterCapability.usesFallback,
      });
    }
  }

  throw new SlipByteError(
    "UNSUPPORTED_TEXT_REPRESENTATION",
    "The configured device representation policy cannot safely represent this text.",
    {
      nativeTextSupport: textCapability.support,
      rasterFallbackAllowed: allowRasterFallback,
    },
  );
}

function resolveOptions(value: TextRepresentationOptions): TextRepresentationOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SlipByteError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "Text representation options must be an object.",
      { receivedType: Array.isArray(value) ? "array" : typeof value },
    );
  }
  return value;
}

function resolveNativeCandidates(
  value: readonly NativeTextRepresentationCandidate[] | undefined,
): readonly NativeTextRepresentationCandidate[] {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new SlipByteError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "nativeCandidates must be an array when provided.",
      { receivedType: typeof value },
    );
  }

  const seenIds = new Set<string>();
  const candidates = value.map((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null) {
      throw new SlipByteError(
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
      throw new SlipByteError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidate ids must be safe non-empty text.",
        { candidateIndex: index },
      );
    }

    if (typeof candidate.canRepresent !== "function") {
      throw new SlipByteError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidates must provide canRepresent(text).",
        { candidateIndex: index },
      );
    }

    const id = candidate.id.trim();
    if (seenIds.has(id)) {
      throw new SlipByteError(
        "INVALID_TEXT_REPRESENTATION_OPTION",
        "Native text representation candidate ids must be unique.",
        { candidateIndex: index },
      );
    }
    seenIds.add(id);

    return Object.freeze({
      id,
      canRepresent: candidate.canRepresent,
    });
  });

  return Object.freeze(candidates);
}

function resolveRasterFallbackOption(value: boolean | undefined): boolean {
  if (value === undefined) return false;
  if (typeof value !== "boolean") {
    throw new SlipByteError(
      "INVALID_TEXT_REPRESENTATION_OPTION",
      "allowRasterFallback must be a boolean when provided.",
      { receivedType: typeof value },
    );
  }
  return value;
}
