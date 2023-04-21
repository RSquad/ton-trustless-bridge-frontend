import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import { validatorAbi } from "@/artifacts/eth/validator/validator";
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
  onComplete: (hash: string) => void;
}

const ProcessTransfer: FC<ProcessTransferProps> = ({
  children,
  txHash,
  onComplete,
}) => {
  const [currentTx, setCurrentTx] = useState<TonTransaction>();
  const [pending, setPending] = useState(false);
  const [count, setCount] = useState(0);
  const [mcBlockSteps, setMcBlockSteps] = useState({ current: 0, max: 0 });
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
    address: process.env.NEXT_PUBLIC_ETH_BRIDGE_ADDR,
    abi: bridgeAbi,
    signerOrProvider: provider.data,
  });

  const validatorContract = useContract({
    address: process.env.NEXT_PUBLIC_ETH_VALIDATOR_ADDR,
    abi: validatorAbi,
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
    if (!validatorContract) {
      console.log("no contract");
      return;
    }
    if (pending || !txHash) {
      console.log("no tx hash");
      return;
    }
    setPending(true);
    try {
      if (block.workchain === -1) {
        const {
          data: { signatures, blockData },
        } = await axios.post(apiRoot + "/validator/checkmcblock", {
          id: block.id,
        });
        if (signatures && blockData) {
          setMcBlockSteps({
            current: 0,
            max: Math.ceil(signatures.length / 5) + 1,
          });
          try {
            for (let i = 0; i < signatures.length; i += 5) {
              const subArr = signatures.slice(i, i + 5);
              while (subArr.length < 5) {
                subArr.push(signatures[0]);
              }

              await validatorContract
                .verifyValidators(
                  "0x" + blockData.id.root_hash,
                  `0x${blockData.id.file_hash}`,
                  subArr.map((c: any) => ({
                    node_id: `0x${c.node_id}`,
                    r: `0x${c.r}`,
                    s: `0x${c.s}`,
                  })) as any[5]
                )
                .then((tx: any) => (tx as any).wait());

              setMcBlockSteps((state) => ({
                ...state,
                current: state.current + 1,
              }));
            }

            await validatorContract
              .addCurrentBlockToVerifiedSet("0x" + blockData.id.root_hash)
              .then((tx: any) => (tx as any).wait());

            setMcBlockSteps((state) => ({
              ...state,
              current: state.current + 1,
            }));

            await axios.post(apiRoot + "/validator/checkmcblock", {
              id: block.id,
            });
          } catch (error: any) {
            console.error(error.message);
          } finally {
          }
        }
      } else {
        const {
          data: { bocProof },
        } = await axios.post(apiRoot + "/validator/checkshard", {
          id: block.id,
        });

        try {
          await validatorContract
            .parseShardProofPath(Buffer.from(bocProof, "base64"))
            .then((tx: any) => (tx as any).wait());

          await axios.post(apiRoot + "/validator/checkshard", {
            id: block.id,
          });
        } catch (error: any) {
          console.error(error.message);
        } finally {
        }
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
      console.log("tx completed", txRes);

      onComplete(txRes.hash);
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
              Masterchain block{" "}
              {mcBlockSteps.max
                ? `(${mcBlockSteps.current}/${mcBlockSteps.max})`
                : ""}
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
