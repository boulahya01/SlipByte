import type { CapabilitySupport, PrinterCapability } from "./capabilities.js";
import { OpenReceiptError } from "./errors.js";

export type CompatibilityEvidenceSource =
  | "hardware-test"
  | "manufacturer-documentation"
  | "vendor-documentation"
  | "community-report";

export type CapabilityEvidence = Readonly<{
  profileId: string;
  capability: PrinterCapability;
  support: CapabilitySupport;
  source: CompatibilityEvidenceSource;
  reference: string;
  observedAt?: string;
  notes?: readonly string[];
}>;

export type CapabilityEvidenceQuery = Readonly<{
  profileId: string;
  capability: PrinterCapability;
}>;

export function defineCapabilityEvidence(evidence: unknown): CapabilityEvidence {
  const candidate = evidence as Partial<CapabilityEvidence> | null;

  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw invalidEvidence("Compatibility evidence must be an object.", {
      receivedType: Array.isArray(candidate) ? "array" : typeof candidate,
    });
  }

  const profileId = requireText(candidate.profileId, "profileId");

  if (!isPrinterCapability(candidate.capability)) {
    throw invalidEvidence("Compatibility evidence capability is invalid.", {
      profileId,
      field: "capability",
      receivedType: typeof candidate.capability,
    });
  }

  if (!isCapabilitySupport(candidate.support)) {
    throw invalidEvidence("Compatibility evidence support state is invalid.", {
      profileId,
      field: "support",
      receivedType: typeof candidate.support,
    });
  }

  if (!isEvidenceSource(candidate.source)) {
    throw invalidEvidence("Compatibility evidence source is invalid.", {
      profileId,
      field: "source",
      receivedType: typeof candidate.source,
    });
  }

  const reference = requireText(candidate.reference, "reference");
  const observedAt = optionalText(candidate.observedAt, "observedAt");
  const notes = optionalTextList(candidate.notes, "notes");

  return Object.freeze({
    profileId,
    capability: candidate.capability,
    support: candidate.support,
    source: candidate.source,
    reference,
    ...(observedAt ? { observedAt } : {}),
    ...(notes ? { notes: Object.freeze(notes) } : {}),
  });
}

export function findCapabilityEvidence(
  evidence: unknown,
  query: unknown,
): readonly CapabilityEvidence[] {
  if (!Array.isArray(evidence)) {
    throw invalidEvidence("Compatibility evidence collection must be an array.", {
      receivedType: typeof evidence,
    });
  }

  const candidate = query as Partial<CapabilityEvidenceQuery> | null;
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw invalidEvidence("Compatibility evidence query must be an object.", {
      receivedType: Array.isArray(candidate) ? "array" : typeof candidate,
    });
  }

  const profileId = requireText(candidate.profileId, "profileId");
  if (!isPrinterCapability(candidate.capability)) {
    throw invalidEvidence("Compatibility evidence query capability is invalid.", {
      profileId,
      field: "capability",
      receivedType: typeof candidate.capability,
    });
  }

  const matches = evidence
    .map((record) => defineCapabilityEvidence(record))
    .filter(
      (record) =>
        record.profileId === profileId && record.capability === candidate.capability,
    );

  return Object.freeze(matches);
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidEvidence(`Compatibility evidence ${field} must be non-empty text.`, {
      field,
      receivedType: typeof value,
    });
  }
  return value.trim();
}

function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return requireText(value, field);
}

function optionalTextList(
  value: unknown,
  field: string,
): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw invalidEvidence(`Compatibility evidence ${field} must be an array of text.`, {
      field,
      receivedType: typeof value,
    });
  }

  return value.map((entry, index) => {
    if (typeof entry !== "string" || !entry.trim()) {
      throw invalidEvidence(`Compatibility evidence ${field} entries must be non-empty text.`, {
        field,
        index,
        receivedType: typeof entry,
      });
    }
    return entry.trim();
  });
}

function isEvidenceSource(value: unknown): value is CompatibilityEvidenceSource {
  return (
    value === "hardware-test" ||
    value === "manufacturer-documentation" ||
    value === "vendor-documentation" ||
    value === "community-report"
  );
}

function isPrinterCapability(value: unknown): value is PrinterCapability {
  return (
    value === "text" ||
    value === "cut" ||
    value === "drawer" ||
    value === "qr" ||
    value === "barcode" ||
    value === "raster" ||
    value === "status"
  );
}

function isCapabilitySupport(value: unknown): value is CapabilitySupport {
  return value === "native" || value === "fallback" || value === "unsupported";
}

function invalidEvidence(
  message: string,
  details: Record<string, unknown> = {},
): OpenReceiptError {
  return new OpenReceiptError("INVALID_COMPATIBILITY_EVIDENCE", message, details);
}
