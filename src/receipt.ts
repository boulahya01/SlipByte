import { SlipByteError } from "./errors.js";
import type {
  Alignment,
  ReceiptDocument,
  ReceiptNode,
} from "./types.js";

const UNSAFE_CONTROL_CHARACTER = /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/u;

export class ReceiptBuilder {
  #nodes: ReceiptNode[] = [];

  text(
    value: string,
    options: { align?: Alignment; bold?: boolean } = {},
  ): this {
    assertSafeText(value, "text");

    this.#nodes.push({
      type: "text",
      value,
      align: options.align ?? "left",
      bold: options.bold ?? false,
    });

    return this;
  }

  title(value: string): this {
    return this.text(value, { align: "center", bold: true });
  }

  item(name: string, quantity: number, unitPrice: number): this {
    assertSafeText(name, "item name");

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new SlipByteError(
        "INVALID_QUANTITY",
        "Receipt item quantity must be a finite number greater than zero.",
        { quantity },
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new SlipByteError(
        "INVALID_AMOUNT",
        "Receipt item unit price must be a finite number greater than or equal to zero.",
        { unitPrice },
      );
    }

    this.#nodes.push({ type: "item", name, quantity, unitPrice });
    return this;
  }

  total(label: string, amount: number): this {
    assertSafeText(label, "total label");

    if (!Number.isFinite(amount) || amount < 0) {
      throw new SlipByteError(
        "INVALID_AMOUNT",
        "Receipt total amount must be a finite number greater than or equal to zero.",
        { amount },
      );
    }

    this.#nodes.push({ type: "total", label, amount });
    return this;
  }

  divider(): this {
    this.#nodes.push({ type: "divider" });
    return this;
  }

  feed(lines = 1): this {
    if (!Number.isInteger(lines) || lines < 1) {
      throw new SlipByteError(
        "INVALID_FEED_LINES",
        "Feed lines must be a positive integer.",
        { lines },
      );
    }

    this.#nodes.push({ type: "feed", lines });
    return this;
  }

  cut(): this {
    this.#nodes.push({ type: "cut" });
    return this;
  }

  toDocument(): ReceiptDocument {
    return Object.freeze({
      nodes: Object.freeze(this.#nodes.map((node) => Object.freeze({ ...node }))),
    });
  }
}

export function receipt(): ReceiptBuilder {
  return new ReceiptBuilder();
}

function assertSafeText(value: string, field: string): void {
  if (typeof value !== "string" || !value.trim()) {
    throw new SlipByteError(
      "INVALID_TEXT",
      `Receipt ${field} must be non-empty text.`,
      { field, receivedType: typeof value },
    );
  }

  const match = value.match(UNSAFE_CONTROL_CHARACTER);
  if (match) {
    throw new SlipByteError(
      "INVALID_TEXT",
      `Receipt ${field} contains a control character that is not allowed in normal text.`,
      {
        field,
        codePoint: match[0]?.codePointAt(0),
      },
    );
  }
}
