import { JettonOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { TxReq } from "@/types";
import { Base64 } from "@tonconnect/protocol";
import { Dispatch, SetStateAction } from "react";
import { Address, Dictionary, beginCell, toNano } from "ton-core";

export const buildBurnTonTx = (
  account: Address,
  address: bigint,
  tonsToWrap: bigint
) => {
  const toAddress: Address = Address.parse(
    process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!
  ); // TON Adapter address
  const senderAddress: Address = account; // TON sender address

  return Base64.encode(
    beginCell()
      .storeUint(JettonOpCodes.TRANSFER, 32)
      .storeUint(0, 64)
      .storeCoins(toNano(tonsToWrap))
      .storeAddress(toAddress)
      .storeAddress(senderAddress)
      .storeDict(Dictionary.empty())
      .storeCoins(toNano("0.05"))
      .storeUint(0, 1)
      .storeRef(
        beginCell()
          .storeCoins(toNano(tonsToWrap))
          .storeUint(address, 256)
          .storeAddress(senderAddress)
          .endCell()
      )
      .endCell()
      .toBoc()
  );
};

export const useBurnTonTx = (
  setTxHash: Dispatch<SetStateAction<TxReq | undefined>>
) => {
  return {};
};
