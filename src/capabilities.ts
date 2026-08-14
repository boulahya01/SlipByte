import { OpenReceiptError } from "./errors.js";

export type CapabilitySupport =
  | "native"
  | "fallback"
  | "unsupported"
  | "unknown";

export type DeviceCapability = Readonly<{
  id: string;
  support: CapabilitySupport;
  evidence?: string;
}>;

export type DeviceProfile = Readonly<{
  id: string;
  capabilities: readonly DeviceCapability[];
}>;

export type CapabilityResolution = Readonly<{
  id: string;
  support: CapabilitySupport;
  evidence?: string;
}>;

export function defineDeviceProfile(input: {
  id: string;
  capabilities?: readonly DeviceCapability[];
}): DeviceProfile {
  const candidate = input as
    | { id?: unknown; capabilities?: unknown }
    | null
    | undefined;

  if (
    candidate === null ||
    candidate === undefined ||
    typeof candidate !== "object" ||
    typeof candidate.id !== "string" ||
    !candidate.id.trim()
  ) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a non-empty string id.",
      { profile: input },
    );
  }

  const profileId = candidate.id.trim();
  const capabilities = candidate.capabilities ?? [];
  if (!Array.isArray(capabilities)) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profile capabilities must be an array.",
      { profileId },
    );
  }

  const seen = new Set<string>();
  const normalized = capabilities.map((rawCapability, index) => {
    const capability = rawCapability as
      | { id?: unknown; support?: unknown; evidence?: unknown }
      | null;

    if (
      capability === null ||
      typeof capability !== "object" ||
      typeof capability.id !== "string" ||
      !capability.id.trim() ||
      !isCapabilitySupport(capability.support) ||
      (capability.evidence !== undefined &&
        typeof capability.evidence !== "string")
    ) {
      throw invalidCapability(profileId, index, rawCapability);
    }

    const id = capability.id.trim();
    if (seen.has(id)) {
      throw new OpenReceiptError(
        "INVALID_DEVICE_PROFILE",
        `Device profile contains duplicate capability "${id}".`,
        { profileId, capabilityId: id },
      );
    }
    seen.add(id);

    const evidence = capability.evidence?.trim();
    return Object.freeze({
      id,
      support: capability.support,
      ...(evidence ? { evidence } : {}),
    });
  });

  return Object.freeze({
    id: profileId,
    capabilities: Object.freeze(normalized),
  });
}

export function resolveCapability(
  profile: DeviceProfile,
  capabilityId: string,
): CapabilityResolution {
  if (typeof capabilityId !== "string" || !capabilityId.trim()) {
    throw new OpenReceiptError(
      "INVALID_CAPABILITY",
      "Capability ids must be non-empty strings.",
      { capabilityId },
    );
  }

  const id = capabilityId.trim();
  const capability = profile.capabilities.find((entry) => entry.id === id);
  if (!capability) {
    return Object.freeze({ id, support: "unknown" });
  }

  return Object.freeze({ ...capability });
}

export function requireCapability(
  profile: DeviceProfile,
  capabilityId: string,
): CapabilityResolution {
  const resolution = resolveCapability(profile, capabilityId);

  if (resolution.support === "unsupported" || resolution.support === "unknown") {
    throw new OpenReceiptError(
      "UNSUPPORTED_CAPABILITY",
      resolution.support === "unknown"
        ? `Capability "${resolution.id}" is not known for device profile "${profile.id}".`
        : `Capability "${resolution.id}" is not supported by device profile "${profile.id}".`,
      {
        profileId: profile.id,
        capabilityId: resolution.id,
        support: resolution.support,
        evidence: resolution.evidence,
      },
    );
  }

  return resolution;
}

function isCapabilitySupport(value: unknown): value is CapabilitySupport {
  return (
    value === "native" ||
    value === "fallback" ||
    value === "unsupported" ||
    value === "unknown"
  );
}

function invalidCapability(
  profileId: string,
  index: number,
  capability: unknown,
): OpenReceiptError {
  return new OpenReceiptError(
    "INVALID_CAPABILITY",
    "Capabilities require a non-empty string id, a valid support value, and optional string evidence.",
    { profileId, index, capability },
  );
}
