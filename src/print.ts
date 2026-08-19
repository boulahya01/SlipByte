import type { DeviceProfile } from "./capabilities.js";
import { encodeEscPos, type EscPosEncoderOptions } from "./escpos.js";
import { layoutReceipt, type LayoutOptions } from "./layout.js";
import { sendTcp, type TcpConnector, type TcpTransportOptions } from "./tcp.js";
import type { ReceiptDocument } from "./types.js";

export type EscPosTcpPrintOptions = Readonly<{
  profile: DeviceProfile;
  transport: TcpTransportOptions;
  layout?: LayoutOptions;
  encoder?: EscPosEncoderOptions;
}>;

/**
 * Print one receipt through the existing layout, ESC/POS encoder, and TCP
 * transport contracts. Device capabilities and encoding policy remain explicit
 * through the supplied profile and encoder options.
 */
export async function printEscPosTcp(
  document: ReceiptDocument,
  options: EscPosTcpPrintOptions,
  connector?: TcpConnector,
): Promise<void> {
  const layout = layoutReceipt(document, options.layout);
  const bytes = encodeEscPos(layout, options.profile, options.encoder);

  if (connector === undefined) {
    await sendTcp(bytes, options.transport);
    return;
  }

  await sendTcp(bytes, options.transport, connector);
}
