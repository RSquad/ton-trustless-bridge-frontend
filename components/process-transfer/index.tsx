import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import { TonBlock, TonTransaction, TxReq } from "@/types";
import { sleep } from "@/utils";
import axios from "axios";
import { FC, HTMLAttributes, useEffect, useMemo, useState } from "react";
import {
  Button,
  Container,
  Dimmer,
  Icon,
  List,
  Loader,
} from "semantic-ui-react";
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

function fetchTx(txHash: TxReq): Promise<TonTransaction> {
  return fetch(
    `${apiRoot}/ton-explorer/findtx/${txHash.hash}?workchain=${txHash.workchain}&lt=${txHash.lt}`
  )
    .then((v) => v.json())
    .then((txs: TonTransaction[]) => {
      console.log(txs);
      const tx = txs[0];

      if (!tx) {
        throw Error("tx not found. Try to find it later " + txHash);
        // console.log("Error: tx not found. Try to find it later");
      }

      return tx;
    });
  // .catch((err) => {
  //   console.log(err);
  //   return sleep(5000).then(() => fetchTx(txHash));
  // });
}

interface ProcessTransferProps extends HTMLAttributes<HTMLDivElement> {
  txHash?: TxReq;
  onComplete: () => void;
}

const ProcessTransfer: FC<ProcessTransferProps> = ({
  children,
  txHash,
  onComplete,
}) => {
  const [currentTx, setCurrentTx] = useState<TonTransaction>();
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(0);
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
    if (txHash && !currentTx) {
      fetchTx(txHash)
        .then((tx) => {
          setCurrentTx(tx);
        })
        .catch((e) => {
          return sleep(5000).then(() => {
            setCount((v) => v + 1);
          });
        });
    }
  }, [txHash, currentTx, count]);

  const validateBlock = async (block: TonBlock) => {
    if (pending || !txHash) {
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
        apiRoot + "/validator/checktx",
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
      const txRes = await bridgeContract.readTransaction(
        Buffer.from(txValidateParams.txBoc, "hex"),
        Buffer.from(txValidateParams.boc, "hex"),
        txValidateParams.adapter
      );
      console.log("tx completed");
      onComplete();
    } catch (error) {
      console.log(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Container className="p-8 border border-1 rounded segment min-h-[120px]">
      <Dimmer active={!currentTx} inverted>
        <Loader inverted>Waiting for transaction...</Loader>
      </Dimmer>

      <List verticalAlign="middle" relaxed>
        {mcBlock && (
          <List.Item>
            <List.Content>
              <Icon
                name={isMcBlockReady ? "check" : "warning circle"}
                color={isMcBlockReady ? "green" : "yellow"}
              />
              Masterchain block
            </List.Content>
          </List.Item>
        )}
        {shardBlock && (
          <List.Item>
            <List.Content>
              {/* <Icon name="wait" color="yellow" /> */}
              <Icon
                name={isShardBlockReady ? "check" : "warning circle"}
                color={isShardBlockReady ? "green" : "yellow"}
              />
              Shardchain block
            </List.Content>
          </List.Item>
        )}
        {currentTx && (
          <List.Item>
            <List.Content>
              <Icon name="warning circle" color="yellow" />
              Transaction
            </List.Content>
          </List.Item>
        )}
      </List>

      {mcBlock && !isMcBlockReady && (
        <Button
          primary
          loading={pending}
          onClick={() => {
            validateBlock(mcBlock);
          }}
        >
          Validate Masterchain block
        </Button>
      )}
      {shardBlock && isMcBlockReady && !isShardBlockReady && (
        <Button
          primary
          loading={pending}
          onClick={() => {
            validateBlock(shardBlock);
          }}
        >
          Validate Shardchain block
        </Button>
      )}
      {currentTx && isTxReadyForValidate && (
        <Button
          primary
          loading={pending}
          onClick={() => {
            validate(currentTx);
          }}
        >
          Validate Transaction
        </Button>
      )}
    </Container>
  );
};

export default ProcessTransfer;
