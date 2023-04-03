import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import { TonBlock, TonTransaction } from "@/types";
import { sleep } from "@/utils";
import axios from "axios";
import { FC, HTMLAttributes, useEffect, useMemo, useState } from "react";
import { Button, Container } from "semantic-ui-react";
import { useContract, useSigner } from "wagmi";

const apiRoot = process.env.NEXT_PUBLIC_TRUSTLESS_BACKEND_URL;

function selectedMcBlock(tx: TonTransaction) {
  if (!tx) {
    return undefined;
  }
  if (tx.mcParent?.workchain === -1) {
    return tx.mcParent;
  }
  if (tx.mcParent?.workchain === 0 && tx.mcParent?.mcParent?.workchain) {
    return tx.mcParent?.mcParent;
  }
  return undefined;
}

function selectedShardBlock(tx: TonTransaction) {
  if (!tx) {
    return undefined;
  }
  if (tx.mcParent?.workchain === 0) {
    return tx.mcParent;
  }
  return undefined;
}

function fetchTx(txHash: string): Promise<TonTransaction> {
  return fetch(`${apiRoot}/ton-explorer/findtx/${txHash}`)
    .then((v) => v.json())
    .then((txs: TonTransaction[]) => {
      console.log(txs);
      const tx = txs[0];

      if (!tx) {
        throw Error("tx not found. Try to find it later " + txHash);
        // console.log("Error: tx not found. Try to find it later");
      }

      return tx;
    })
    .catch((err) => {
      console.log(err);
      return sleep(5000).then(() => fetchTx(txHash));
    });
}

interface ProcessTransferProps extends HTMLAttributes<HTMLDivElement> {
  txHash: string;
}

const ProcessTransfer: FC<ProcessTransferProps> = ({ children, txHash }) => {
  const [currentTx, setCurrentTx] = useState<TonTransaction>();
  const [pending, setPending] = useState(false);
  const mcBlock = useMemo(() => {
    if (!currentTx) {
      return undefined;
    }
    return selectedMcBlock(currentTx);
  }, [currentTx]);
  const shardBlock = useMemo(() => {
    if (!currentTx) {
      return undefined;
    }
    return selectedShardBlock(currentTx);
  }, [currentTx]);

  const isMcBlockReady = !mcBlock || mcBlock?.checked;
  const isShardBlockReady = !shardBlock || shardBlock?.checked;
  const isTxReadyForValidate = isMcBlockReady && isShardBlockReady;

  const provider = useSigner();
  const bridgeContract = useContract({
    // address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    // address: "0x18A9e708B17A477BFF625db0F65C6f10B41d73ca",
    address: process.env.NEXT_PUBLIC_ETH_BRIDGE_ADDR,
    abi: bridgeAbi,
    signerOrProvider: provider.data,
  });

  useEffect(() => {
    fetchTx(txHash).then((tx) => {
      setCurrentTx(tx);
    });
  }, [txHash]);

  const validateBlock = async (block: TonBlock) => {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      if (block.workchain === -1) {
        const res = await axios.post(apiRoot + "/validator/checkmcblock", {
          id: block.id,
        });
      } else {
        const res = await axios.post(apiRoot + "/validator/checkshard", {
          id: block.id,
        });
      }
      await fetchTx(txHash).then((tx) => {
        setCurrentTx(tx);
      });
    } catch (error) {
    } finally {
      setPending(false);
    }
  };

  const validate = async (tx: TonTransaction) => {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const { data: txValidateParams } = await axios.post(
        "http://128.199.139.200:3000/validator/checktx",
        tx
      );
      console.log(txValidateParams);
      if (!bridgeContract) {
        return;
      }
      console.log("building tx...");
      console.log({
        txBloc: Buffer.from(txValidateParams.txBoc, "hex"),
        boc: Buffer.from(txValidateParams.boc, "hex"),
        adapter: txValidateParams.adapter,
      });
      await bridgeContract.readTransaction(
        Buffer.from(txValidateParams.txBoc, "hex"),
        Buffer.from(txValidateParams.boc, "hex"),
        txValidateParams.adapter
      );
      console.log("tx completed");
    } catch (error) {
    } finally {
      setPending(false);
    }
  };

  return (
    <Container className="p-8 border border-1 rounded">
      {mcBlock && (
        <div>
          {isMcBlockReady ? (
            "✅"
          ) : (
            <Button
              loading={pending}
              onClick={() => {
                validateBlock(mcBlock);
              }}
            >
              Validate
            </Button>
          )}{" "}
          McBlock
        </div>
      )}
      {shardBlock && (
        <div>
          {isShardBlockReady ? (
            "✅"
          ) : (
            <Button
              loading={pending}
              onClick={() => {
                validateBlock(shardBlock);
              }}
            >
              Validate
            </Button>
          )}{" "}
          ShardBlock
        </div>
      )}
      {currentTx && (
        <div>
          {isTxReadyForValidate && (
            <Button
              loading={pending}
              onClick={() => {
                validate(currentTx);
              }}
            >
              Validate
            </Button>
          )}{" "}
          Transaction
        </div>
      )}
    </Container>
  );
};

export default ProcessTransfer;
