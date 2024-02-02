import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import { parseEther } from "ethers/lib/utils.js";
import { Dispatch, SetStateAction } from "react";
import { Address } from "ton-core";
import { useContract, useProvider, useSigner } from "wagmi";

export const useSendEthTx = (
  setEthHash: Dispatch<SetStateAction<string | undefined>>
) => {
  const provider = useSigner();
  const provider_api = useProvider();
  const bridgeContract = useContract({
    address: process.env.NEXT_PUBLIC_ETH_BRIDGE_ADDR,
    abi: bridgeAbi,
    signerOrProvider: provider.data,
  });

  const onFormSubmit = async (tonAddr: string, ethsToWrap: string) => {
    if (!bridgeContract) {
      return;
    }
    const addrHash = Address.parse(tonAddr).hash.toString("hex");
    const txRes = await bridgeContract.swapETH(
      `0x${addrHash}`,
      process.env.NEXT_PUBLIC_ETH_ADAPTER_ADDR,
      { value: parseEther(ethsToWrap) }
    );

    await txRes.wait();
    setEthHash(txRes.hash);

    const rec_res = await provider_api.getTransactionReceipt(txRes.hash);
    console.log("rec_res", rec_res);
  };

  return {
    onFormSubmit,
  };
};
