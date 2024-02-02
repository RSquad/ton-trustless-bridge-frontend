// 0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c

import { BridgeOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { IReceiptJSON, Receipt } from "@/utils/evm-data/receipt";
import { Base64 } from "@tonconnect/protocol";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { FC, HTMLAttributes } from "react";
import { Button, Container, Dimmer, Loader } from "semantic-ui-react";
import { Cell, beginCell, toNano } from "ton-core";
import { useProvider } from "wagmi";

interface ProcessTransferEthProps extends HTMLAttributes<HTMLDivElement> {
  txHash?: string;
  onComplete: (hash: string) => void;
}

// curl --data \
//   '{
//     "method": "proof_getTransactionReceipt",
//     "params": [
//       "0xffbb40166a93097ad35d26d7c59d26c3c1e0f181a9b116bf275b05b5c69457db",
//       true
//     ],
//     "id": 1,
//     "jsonrpc": "2.0"
//   }' \
//   -H "Content-Type: application/json"  \
//   -X POST 159.223.222.96:8545

async function getReceipt() {
  const res = await fetch("http://159.223.222.96:8545", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // body: '{\n    "method": "proof_getTransactionReceipt",\n    "params": [\n      "0xffbb40166a93097ad35d26d7c59d26c3c1e0f181a9b116bf275b05b5c69457db",\n      true\n    ],\n    "id": 1,\n    "jsonrpc": "2.0"\n  }',
    body: JSON.stringify({
      method: "proof_getTransactionReceipt",
      params: [
        "0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c",
        true,
      ],
      id: 1,
      jsonrpc: "2.0",
    }),
  });

  return res;
}

export const buildSendReceiptTx = (receipt: Cell) => {
  return Base64.encode(
    beginCell()
      .storeUint(BridgeOpCodes.CONFIRM_RECEIPT, 32)
      .storeUint(0, 64)
      .storeRef(receipt)
      .storeUint(0, 1)
      .endCell()
      .toBoc()
  );
};

const ProcessTransferEth: FC<ProcessTransferEthProps> = ({
  txHash,
  onComplete,
}) => {
  const provider_api = useProvider();
  const [tonConnectUI] = useTonConnectUI();

  const checkReceipt = async () => {
    if (!txHash) {
      return;
    }
    const rec_res = await provider_api.getTransactionReceipt(txHash);
    rec_res.cumulativeGasUsed = rec_res.cumulativeGasUsed._hex as any;

    const r = Receipt.fromJSON(
      JSON.parse(JSON.stringify(rec_res)) as unknown as IReceiptJSON
    );
    const cell = r.toCell();

    const tonTx = await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
          amount: toNano("0.2").toString(),
          payload: buildSendReceiptTx(cell),
        },
      ],
    });

    onComplete(tonTx.boc);
  };

  return (
    <Container className="p-8 border border-1 rounded segment min-h-[120px]">
      <Dimmer active={false} inverted>
        <Loader inverted>Waiting for transaction...</Loader>
      </Dimmer>
      <Button
        onClick={() => {
          checkReceipt();
        }}
      >
        Validate ETH transaction
      </Button>
    </Container>
  );
};

export default ProcessTransferEth;
