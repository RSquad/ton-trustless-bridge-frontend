import { JettonOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { tonClient, tonRawBlockchainApi } from "@/services";
import { TxReq } from "@/types";
import { sleep } from "@/utils";
import { Base64 } from "@tonconnect/protocol";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { parseEther } from "ethers/lib/utils.js";
import { Dispatch, SetStateAction } from "react";
import { Address, Dictionary, beginCell, toNano } from "ton-core";
import { TupleItemSlice } from "ton-core/dist/tuple/tuple";
import { Transaction } from "tonapi-sdk-js";

export const buildBurnTonTx = (
  account: Address,
  address: bigint,
  tonsToWrap: string
) => {
  const toAddress: Address = Address.parse(
    process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!
  ); // TON Adapter address
  const senderAddress: Address = account; // TON sender address

  return Base64.encode(
    beginCell()
      .storeUint(JettonOpCodes.TRANSFER, 32)
      .storeUint(0, 64)
      .storeCoins(parseEther(tonsToWrap).toBigInt())
      .storeAddress(toAddress)
      .storeAddress(senderAddress)
      .storeDict(Dictionary.empty())
      .storeCoins(toNano("0.05"))
      .storeUint(0, 1)
      .storeRef(
        beginCell()
          .storeCoins(parseEther(tonsToWrap).toBigInt())
          .storeUint(address, 256)
          .storeAddress(senderAddress)
          .endCell()
      )
      .endCell()
      .toBoc()
  );
};

// async function getWalletAddress(
//   provider: ContractProvider,
//   address: Address
// ): Promise<Address> {
//   const result = await provider.get("get_wallet_address", [
//     {
//       type: "slice",
//       cell: beginCell().storeAddress(address).endCell(),
//     } as TupleItemSlice,
//   ]);

//   return result.stack.readAddress();
// }

export const useBurnTonTx = (
  setTxHash: Dispatch<SetStateAction<TxReq | undefined>>
) => {
  const [tonConnectUI] = useTonConnectUI();
  const myTonAddrRaw = useTonAddress(false);

  const sendWrap = async (ethAddr: bigint, tonsToWrap: string) => {
    try {
      let jettonWalletDataResult = await tonClient.callGetMethod(
        Address.parse(process.env.NEXT_PUBLIC_TON_JETTON_ADDR!),
        "get_wallet_address",
        [
          {
            type: "slice",
            cell: beginCell()
              .storeAddress(Address.parse(myTonAddrRaw))
              .endCell(),
          } as TupleItemSlice,
        ]
      );

      const jettonWalletAddress = jettonWalletDataResult.stack.readAddress();

      console.log(jettonWalletAddress.toString());

      await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: jettonWalletAddress.toString(),
            // address: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
            amount: toNano("0.2").toString(),
            payload: buildBurnTonTx(
              Address.parse(myTonAddrRaw),
              ethAddr,
              tonsToWrap
            ),
          },
        ],
      });
    } catch (err) {
      console.error("sendWrap error: ", err);
    }
  };

  const onFormSubmit = async (ethAddr: string, tonsToWrap: string) => {
    const { transactions: beforeTxs } =
      await tonRawBlockchainApi.blockchain.getBlockchainAccountTransactions(
        Address.parse(process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!).toRawString(),
        { limit: 20 }
      );
    await sendWrap(BigInt(ethAddr), tonsToWrap);
    let found = false;
    let attempts = 0;
    while (!found && attempts < 10) {
      const txs = (
        await tonRawBlockchainApi.blockchain.getBlockchainAccountTransactions(
          Address.parse(process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!).toRawString(),
          { limit: 20 }
        )
      ).transactions.filter(
        (tx: Transaction) =>
          !beforeTxs.find((beforeTx) => beforeTx.hash === tx.hash)
      );
      if (txs.length) {
        const tx = txs.find((tx) => {
          const addr = tx.in_msg?.source?.address;
          if (!addr) return false;
          const dest = tx.out_msgs.filter((out) => !out.destination);
          console.log(tx, dest);
          if (!dest.length) return false;
          // addr === bridge ton wallet
          return Address.parse(addr).equals(
            Address.parse(process.env.NEXT_PUBLIC_TON_BRIDGE_JWALLET!)
          );
        });
        if (tx) {
          found = true;
          const addr = Address.parse(tx.account.address);
          const lt = tx.lt;
          const workchain = addr.workChain;
          setTxHash({ hash: tx.hash, lt, workchain });
          console.log(tx); // !!!!!
        }
      }
      attempts += 1;
      await sleep(4000);
    }
  };
  return { onFormSubmit };
};
