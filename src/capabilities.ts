import { SlipByteError } from "./errors.js";

const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;
const UNSAFE_METADATA_TEXT = /[\u0000-\u001F\u007F]/u;

export type CapabilitySupport = "native" | "fallback" | "unsupported";

export type PrinterCapability =
  | "text"
  | "cut"
  | "drawer"
  | "qr"
  | "barcode"
  | "raster"
  | "status";

export type PrinterCapabilities = Readonly<
  Record<PrinterCapability, CapabilitySupport>
>;

export type DeviceProfile = Readonly<{
  id: string;
  protocol: string;
  capabilities: PrinterCapabilities;
  textEncodings?: readonly string[];
  notes?: readonly string[];
}>;

export type CapabilityResolution = Readonly<{
  capability: PrinterCapability;
  support: CapabilitySupport;
  usable: boolean;
  usesFallback: boolean;
}>;

export function defineDeviceProfile(profile: DeviceProfile): DeviceProfile {
  const candidate = profile as Partial<DeviceProfile> | null;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profile must be an object.",
      { receivedType: Array.isArray(candidate) ? "array" : typeof candidate },
    );
  }

  if (typeof candidate.id !== "string") {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a text id.",
      { receivedType: typeof candidate.id },
    );
  }

  const id = candidate.id.trim();
  if (!id || UNSAFE_IDENTIFIER_TEXT.test(id)) {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a safe non-empty id.",
    );
  }

  if (typeof candidate.protocol !== "string") {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a text protocol identifier.",
      { receivedType: typeof candidate.protocol },
    );
  }

  const protocol = candidate.protocol.trim();
  if (!protocol || UNSAFE_IDENTIFIER_TEXT.test(protocol)) {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a safe non-empty protocol identifier.",
    );
  }

  if (
    candidate.capabilities === null ||
    typeof candidate.capabilities !== "object" ||
    Array.isArray(candidate.capabilities)
  ) {
    throw new SlipByteError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a capabilities object.",
      {
        profileId: id,
        receivedType: Array.isArray(candidate.capabilities)
          ? "array"
          : typeof candidate.capabilities,
      },
    );
  }

  for (const capability of CAPABILITIES) {
    const support = candidate.capabilities[capability];
    if (!isCapabilitySupport(support)) {
      throw new SlipByteError(
        "INVALID_DEVICE_PROFILE",
        "Every device capability must be native, fallback, or unsupported.",
        {
          profileId: id,
          capability,
          receivedType: Array.isArray(support) ? "array" : typeof support,
        },
      );
    }
  }

  let textEncodings: readonly string[] | undefined;
  if (candidate.textEncodings !== undefined) {
    if (!Array.isArray(candidate.textEncodings)) {
      throw new SlipByteError(
        "INVALID_DEVICE_PROFILE",
        "textEncodings must be an array when provided.",
        { profileId: id, receivedType: typeof candidate.textEncodings },
      );
    }

    const seenTextEncodings = new Set<string>();
    textEncodings = candidate.textEncodings.map((encoding, index) => {
      if (typeof encoding !== "string") {
        throw new SlipByteError(
          "INVALID_DEVICE_PROFILE",
          "textEncodings entries must be text identifiers.",
          { profileId: id, encodingIndex: index, receivedType: typeof encoding },
        );
      }

      const normalized = encoding.trim();
      if (!normalized || UNSAFE_IDENTIFIER_TEXT.test(normalized)) {
        throw new SlipByteError(
          "INVALID_DEVICE_PROFILE",
          "textEncodings entries must be safe non-empty text identifiers.",
          { profileId: id, encodingIndex: index },
        );
      }

      if (seenTextEncodings.has(normalized)) {
        throw new SlipByteError(
          "INVALID_DEVICE_PROFILE",
          "textEncodings entries must be unique after normalization.",
          { profileId: id, encodingIndex: index },
        );
      }
      seenTextEncodings.add(normalized);

      return normalized;
    });
  }

  let notes: readonly string[] | undefined;
  if (candidate.notes !== undefined) {
    if (!Array.isArray(candidate.notes)) {
      throw new SlipByteError(
        "INVALID_DEVICE_PROFILE",
        "Device profile notes must be an array when provided.",
        { profileId: id, receivedType: typeof candidate.notes },
      );
    }

    notes = candidate.notes.map((note, index) => {
      if (typeof note !== "string") {
        throw new SlipByteError(
          "INVALID_DEVICE_PROFILE",
          "Device profile notes must contain text values.",
          { profileId: id, noteIndex: index, receivedType: typeof note },
        );
      }

      if (UNSAFE_METADATA_TEXT.test(note)) {
        throw new SlipByteError(
          "INVALID_DEVICE_PROFILE",
          "Device profile notes contain an unsafe control character.",
          { profileId: id, noteIndex: index },
        );
      }

      return note;
    });
  }

  return Object.freeze({
    id,
    protocol,
    capabilities: Object.freeze({ ...candidate.capabilities }),
    ...(textEncodings ? { textEncodings: Object.freeze([...textEncodings]) } : {}),
    ...(notes ? { notes: Object.freeze([...notes]) } : {}),
  });
}

export function resolveCapability(
  profile: DeviceProfile,
  capability: PrinterCapability,
): CapabilityResolution {
  const support = profile.capabilities[capability];

  return Object.freeze({
    capability,
    support,
    usable: support !== "unsupported",
    usesFallback: support === "fallback",
  });
}

export function requireCapability(
  profile: DeviceProfile,
  capability: PrinterCapability,
): CapabilityResolution {
  const resolution = resolveCapability(profile, capability);

  if (!resolution.usable) {
    throw new SlipByteError(
      "UNSUPPORTED_CAPABILITY",
      `Device profile ${profile.id} does not support ${capability}.`,
      {
        profileId: profile.id,
        protocol: profile.protocol,
        capability,
      },
    );
  }

  return resolution;
}

const CAPABILITIES: readonly PrinterCapability[] = Object.freeze([
  "text",
  "cut",
  "drawer",
  "qr",
  "barcode",
  "raster",
  "status",
]);

function isCapabilitySupport(value: unknown): value is CapabilitySupport {
  return value === "native" || value === "fallback" || value === "unsupported";
}
