import { OpenReceiptError } from "./errors.js";

const UNSAFE_IDENTIFIER_TEXT = /[\u0000-\u001F\u007F]/u;

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
  if (!profile.id.trim()) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a non-empty id.",
      { profile },
    );
  }

  if (!profile.protocol.trim()) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a non-empty protocol identifier.",
      { profileId: profile.id },
    );
  }

  for (const capability of CAPABILITIES) {
    const support = profile.capabilities[capability];
    if (!isCapabilitySupport(support)) {
      throw new OpenReceiptError(
        "INVALID_DEVICE_PROFILE",
        "Every device capability must be native, fallback, or unsupported.",
        { profileId: profile.id, capability, support },
      );
    }
  }

  let textEncodings: readonly string[] | undefined;
  if (profile.textEncodings !== undefined) {
    if (!Array.isArray(profile.textEncodings)) {
      throw new OpenReceiptError(
        "INVALID_DEVICE_PROFILE",
        "textEncodings must be an array when provided.",
        { profileId: profile.id, receivedType: typeof profile.textEncodings },
      );
    }

    textEncodings = profile.textEncodings.map((encoding, index) => {
      if (typeof encoding !== "string") {
        throw new OpenReceiptError(
          "INVALID_DEVICE_PROFILE",
          "textEncodings entries must be text identifiers.",
          { profileId: profile.id, encodingIndex: index, receivedType: typeof encoding },
        );
      }

      const normalized = encoding.trim();
      if (!normalized || UNSAFE_IDENTIFIER_TEXT.test(normalized)) {
        throw new OpenReceiptError(
          "INVALID_DEVICE_PROFILE",
          "textEncodings entries must be safe non-empty text identifiers.",
          { profileId: profile.id, encodingIndex: index },
        );
      }

      return normalized;
    });
  }

  return Object.freeze({
    id: profile.id,
    protocol: profile.protocol,
    capabilities: Object.freeze({ ...profile.capabilities }),
    ...(textEncodings ? { textEncodings: Object.freeze([...textEncodings]) } : {}),
    ...(profile.notes ? { notes: Object.freeze([...profile.notes]) } : {}),
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
    throw new OpenReceiptError(
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
