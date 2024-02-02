export enum BridgeOpCodes {
  WRAP = 0xf0a28992,
  BURN = 0x595f07bc,

  CONFIRM_RECEIPT = 0xe4c557c2,
}

export enum JettonOpCodes {
  TRANSFER = 0xf8a7ea5,
  TRANSFER_NOTIFICATION = 0x7362d09c,
  INTERNAL_TRANSFER = 0x178d4519,
  EXCESSES = 0xd53276db,
  BURN = 0x595f07bc,
  BURN_NOTIFICATION = 0x7bdd97de,
  MINT = 21,
}
