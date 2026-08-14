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
  if (!input || typeof input !== "object" || !input.id?.trim()) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profiles require a non-empty id.",
      { profile: input },
    );
  }

  const capabilities = input.capabilities ?? [];
  if (!Array.isArray(capabilities)) {
    throw new OpenReceiptError(
      "INVALID_DEVICE_PROFILE",
      "Device profile capabilities must be an array.",
      { profileId: input.id },
    );
  }

  const seen = new Set<string>();
  const normalized = capabilities.map((capability, index) => {
    if (!capability || typeof capability !== "object") {
      throw invalidCapability(input.id, index, capability);
    }

    const id = capability.id?.trim();
    if (!id || !isCapabilitySupport(capability.support)) {
      throw invalidCapability(input.id, index, capability);
    }

    if (seen.has(id)) {
      throw new OpenReceiptError(
        "INVALID_DEVICE_PROFILE",
        `Device profile contains duplicate capability "${id}".`,
        { profileId: input.id, capabilityId: id },
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
    id: input.id.trim(),
    capabilities: Object.freeze(normalized),
  });
}

export function resolveCapability(
  profile: DeviceProfile,
  capabilityId: string,
): CapabilityResolution {
  const id = capabilityId.trim();
  if (!id) {
    throw new OpenReceiptError(
      "INVALID_CAPABILITY",
      "Capability ids must be non-empty strings.",
      { capabilityId },
    );
  }

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
    "Capabilities require a non-empty id and a valid support value.",
    { profileId, index, capability },
  );
}
