// 0x3b93c826e9a85eb2235f8e3042b80b279d642f3d02a674f11bd44b6566c7f20c

import { BridgeOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { tonRawBlockchainApi } from "@/services";
import { sleep } from "@/utils";
import { IReceiptJSON, Receipt } from "@/utils/evm-data/receipt";
import { Base64 } from "@tonconnect/protocol";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { FC, HTMLAttributes, useEffect, useState } from "react";
import { Button, Container, Dimmer, List, Loader } from "semantic-ui-react";
import { Address, Cell, beginCell, toNano } from "ton-core";
import { useProvider } from "wagmi";

export const Opcodes = {
  run_ssz: 0x86f1bcc5,
  run_verify_receipt: 0x44b4412c,

  type__bool: 0xf43a7aa,
  type__uint: 0xcc771d29,

  type__byteVector: 0x8f2cdfd8,
  type__bytelist: 0x31ffdd28,
  type__container: 0x81706e6d,
  type__list: 0x1e0a6920,
  type__vector: 0x8bf90db0,
  type__empty: 0x409f47cb,
  type__bitlist: 0x501abea0,
  type__bitVector: 0xa8cd9c9c,
};

export function SSZUintToCell(
  {
    value,
    size,
    isInf = false,
  }: { value: number; size: number; isInf?: boolean },
  tail?: Cell
) {
  let builder = beginCell()
    .storeUint(Opcodes.type__uint, 32)
    .storeBit(isInf)
    .storeUint(size, 16)
    .storeUint(value, size * 8);

  if (tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

export function getSSZContainer(body: Cell, tail?: Cell) {
  const builder = beginCell()
    .storeUint(Opcodes.type__container, 32)
    .storeRef(body);

  if (tail) {
    builder.storeRef(tail);
  }

  return builder.endCell();
}

export function SSZRootToCell(value: string, tail?: Cell) {
  return SSZByteVectorTypeToCell(value, 32, 1, tail);
}

function splitIntoRootChunks(longChunk: any) {
  const chunkCount = Math.ceil(longChunk.length / 32);
  const chunks = new Array(chunkCount);
  for (let i = 0; i < chunkCount; i++) {
    const chunk = new Uint8Array(32);
    chunk.set(longChunk.slice(i * 32, (i + 1) * 32));
    chunks[i] = chunk;
  }
  return chunks;
}

export function SSZByteVectorTypeToCell(
  value: string,
  size: number,
  maxChunks: number,
  tail?: Cell
) {
  const signatureString = value.startsWith("0x")
    ? value.replace("0x", "")
    : value;
  const uint8Arr = Uint8Array.from(Buffer.from(signatureString, "hex"));

  const chunks = splitIntoRootChunks(uint8Arr)
    .reverse()
    .map((chunk: any) => beginCell().storeBuffer(Buffer.from(chunk)))
    .reduce((acc, memo, index) => {
      if (index === 0) {
        return memo.endCell();
      }

      return memo.storeRef(acc).endCell();
    }, undefined as any as Cell);

  // console.log('value', value);
  // console.log('uint8arr', uint8Arr);
  // console.log('chunks:',chunks);

  let builder = beginCell()
    .storeUint(Opcodes.type__byteVector, 32)
    .storeUint(maxChunks, 32)
    .storeUint(size, 64)
    .storeRef(chunks);

  if (tail) {
    builder = builder.storeRef(tail);
  }

  return builder.endCell();
}

export function transformBeaconToCell(beacon: any) {
  const beaconContainerCell = getSSZContainer(
    SSZUintToCell(
      { value: beacon.slot, size: 8, isInf: true },
      SSZUintToCell(
        { value: beacon.proposerIndex, size: 8, isInf: false },
        SSZRootToCell(
          beacon.parentRoot,
          SSZRootToCell(beacon.stateRoot, SSZRootToCell(beacon.bodyRoot))
        )
      )
    )
  );
  return beaconContainerCell;
}

function initOptimisticBoc(beacon: Cell) {
  return Base64.encode(
    beginCell()
      .storeUint(0x17fd941d, 32)
      .storeUint(0, 64)
      .storeRef(beacon)
      .endCell()
      .toBoc()
  );
}

function initOp2(beacon: Cell) {
  return beginCell()
    .storeUint(0x17fd941d, 32)
    .storeUint(0, 64)
    .storeRef(beacon)
    .endCell();
}

const apiRoot = process.env.NEXT_PUBLIC_TRUSTLESS_BACKEND_URL;

const fetch_retry = async (
  url: string,
  options: RequestInit = {},
  n: number = 10
): Promise<any> => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (n === 1) throw err;
    await sleep(5000);
    return await fetch_retry(url, options, n - 1);
  }
};

interface ProcessTransferEthProps extends HTMLAttributes<HTMLDivElement> {
  txHash?: string;
  onComplete: (hash: string) => void;
}

async function fetchBeaconData(txHash: string, repeats = 0): Promise<any> {
  await sleep(2000);

  return fetch(`${apiRoot}/beacon/getethvalidation/${txHash}`)
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        throw new Error("Something went wrong");
      }
    })
    .catch((error) => {
      if (repeats >= 10) {
        throw error;
      }
      return sleep(5000).then(() => fetchBeaconData(txHash, repeats + 1));
    });
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
  const [pending, setPending] = useState(true);

  const [finality, setFinality] = useState<string>();
  const [optimistics, setOptimistics] = useState<string[]>([]);
  const [execution, setExecution] = useState<string>();
  const [receiptProof, setReceiptProof] = useState<string>();

  const updateDate = () => {
    setPending(true);
    return fetchBeaconData(txHash || "0x000").then(
      ({ finalityData, optimisticsData, executionData, receiptData }) => {
        setFinality(finalityData.isVerified ? undefined : finalityData.boc);
        setOptimistics(
          optimisticsData.bocs.filter((boc: string, index: number) => {
            if (optimisticsData.isVerified[index]) {
              return false;
            }
            return true;
          })
        );
        setExecution(executionData.isVerified ? undefined : executionData.boc);
        setReceiptProof(receiptData.boc);
        setPending(false);
      }
    );
  };

  const checkReceipt = async () => {
    if (!txHash) {
      return;
    }
    const rec_res = await provider_api.getTransactionReceipt(txHash);
    rec_res.cumulativeGasUsed = rec_res.cumulativeGasUsed._hex as any;
    console.log(rec_res);

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

  const verifyFinality = async () => {
    if (!finality) {
      return;
    }

    const tonTx = await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!,
          amount: toNano("0.07").toString(),
          payload: finality,
        },
      ],
    });

    await updateDate();
  };

  const verifyOptimistics = async () => {
    if (!optimistics.length) {
      return;
    }

    for (let i = 0; i < optimistics.length; i++) {
      const { transactions: beforeTxs } =
        await tonRawBlockchainApi.blockchain.getBlockchainAccountTransactions(
          Address.parse(
            process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!
          ).toRawString(),
          { limit: 1 }
        );
      const lastTx = beforeTxs[0];
      const lastTxHash = lastTx.hash;

      const tonTx = await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!,
            amount: toNano("0.07").toString(),
            payload: optimistics[i],
          },
        ],
      });

      let txHash = lastTxHash;
      while (txHash == lastTxHash) {
        await sleep(5000);
        let txs =
          await tonRawBlockchainApi.blockchain.getBlockchainAccountTransactions(
            Address.parse(
              process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!
            ).toRawString(),
            { limit: 1 }
          );
        txHash = txs.transactions[0].hash;
      }
    }
    await updateDate();
  };

  const verifyExecution = async () => {
    if (!execution) {
      return;
    }
    const tonTx = await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!,
          amount: toNano("0.17").toString(),
          payload: execution,
        },
      ],
    });
    await updateDate();
  };

  const verifyReceipt = async () => {
    if (!receiptProof) {
      return;
    }
    const tonTx = await tonConnectUI.sendTransaction({
      validUntil: Date.now() + 1000000,
      messages: [
        {
          address: process.env.NEXT_PUBLIC_TON_VALIDATOR_ADDR!,
          amount: toNano("0.325").toString(),
          payload: receiptProof,
        },
      ],
    });

    onComplete(tonTx.boc);
  };

  useEffect(() => {
    updateDate();
  }, []);

  return (
    <Container className="p-8 border border-1 rounded segment min-h-[120px]">
      <Dimmer active={pending} inverted>
        <Loader inverted>Waiting for finality update...</Loader>
      </Dimmer>
      <List verticalAlign="middle" relaxed>
        {finality && (
          <List.Item>
            <List.Content>
              <Button
                onClick={() => {
                  verifyFinality();
                }}
              >
                Verify Finality update
              </Button>
            </List.Content>
          </List.Item>
        )}
        {optimistics.length > 0 && (
          <List.Item>
            <List.Content>
              <Button
                onClick={() => {
                  verifyOptimistics();
                }}
              >
                Verify {optimistics.length} Optimistic updates
              </Button>
            </List.Content>
          </List.Item>
        )}
        {!!execution && (
          <List.Item>
            <List.Content>
              <Button
                onClick={() => {
                  verifyExecution();
                }}
              >
                Verify Execution update
              </Button>
            </List.Content>
          </List.Item>
        )}
        {!!receiptProof && (
          <List.Item>
            <List.Content>
              <Button
                onClick={() => {
                  verifyReceipt();
                }}
              >
                Verify Receipt
              </Button>
            </List.Content>
          </List.Item>
        )}
      </List>

      <Button
        onClick={() => {
          checkReceipt();
        }}
      >
        Validate ETH transaction (fast)
      </Button>
    </Container>
  );
};

export default ProcessTransferEth;
