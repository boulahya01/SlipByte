import { OpenReceiptError } from "./errors.js";
import type {
  Alignment,
  ReceiptDocument,
  ReceiptNode,
} from "./types.js";

export class ReceiptBuilder {
  #nodes: ReceiptNode[] = [];

  text(
    value: string,
    options: { align?: Alignment; bold?: boolean } = {},
  ): this {
    const normalized = value.trim();
    if (!normalized) {
      throw new OpenReceiptError(
        "INVALID_TEXT",
        "Receipt text cannot be empty.",
        { value },
      );
    }

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
    if (!name.trim()) {
      throw new OpenReceiptError(
        "INVALID_TEXT",
        "Receipt item name cannot be empty.",
        { name },
      );
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new OpenReceiptError(
        "INVALID_QUANTITY",
        "Receipt item quantity must be a finite number greater than zero.",
        { quantity },
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new OpenReceiptError(
        "INVALID_AMOUNT",
        "Receipt item unit price must be a finite number greater than or equal to zero.",
        { unitPrice },
      );
    }

    this.#nodes.push({ type: "item", name, quantity, unitPrice });
    return this;
  }

  total(label: string, amount: number): this {
    if (!label.trim()) {
      throw new OpenReceiptError(
        "INVALID_TEXT",
        "Receipt total label cannot be empty.",
        { label },
      );
    }

    if (!Number.isFinite(amount) || amount < 0) {
      throw new OpenReceiptError(
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
      throw new OpenReceiptError(
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
