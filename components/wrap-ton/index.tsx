import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import { BridgeOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { tonRawBlockchainApi } from "@/services";
import { TonBlock, TonTransaction } from "@/types";
import { Base64 } from "@tonconnect/protocol";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import axios from "axios";
import { useFormik } from "formik";
import { FC, HTMLAttributes, useEffect, useMemo, useState } from "react";
import { Button, Container, Form, Input, Step } from "semantic-ui-react";
import { Address, beginCell, toNano } from "ton-core";
import { Transaction } from "tonapi-sdk-js";
import { useAccount, useContract, useSigner } from "wagmi";

const apiRoot = "http://128.199.139.200:3000/ton-explorer";

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

export const sleep = (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

interface WrapTonProps extends HTMLAttributes<HTMLDivElement> {}

const WrapTon: FC<WrapTonProps> = ({ children }) => {
  const myTonAddrRaw = useTonAddress(false);
  const myEvmAccount = useAccount();
  const [tonConnectUI] = useTonConnectUI();
  const [connectionRestored, setConnectionRestored] = useState(false);
  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => setConnectionRestored(true));
  }, []);

  useEffect(() => {
    tonRawBlockchainApi
      .getTransactions({
        account: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
      })
      .then(console.log);
  }, []);

  const sendWrap = async (ethAddr: bigint, tonsToWrap: bigint) => {
    try {
      await tonConnectUI.sendTransaction({
        validUntil: Date.now() + 1000000,
        messages: [
          {
            address: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
            amount: (toNano(tonsToWrap) + toNano("0.2")).toString(),
            payload: Base64.encode(
              beginCell()
                .storeUint(BridgeOpCodes.WRAP, 32)
                .storeUint(0, 64)
                .storeUint(ethAddr, 256)
                .storeUint(tonsToWrap, 256)
                .storeUint(0, 1)
                .endCell()
                .toBoc()
            ),
          },
        ],
      });
    } catch (err) {
      console.error("sendWrap error: ", err);
    }
  };

  const formik = useFormik({
    initialValues: {
      tonsToWrap: "",
      ethAddr: "",
    },
    onSubmit: async ({ ethAddr, tonsToWrap }, { setSubmitting }) => {
      const { transactions: beforeTxs } =
        await tonRawBlockchainApi.getTransactions({
          account: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
        });
      try {
        await sendWrap(BigInt(ethAddr), BigInt(tonsToWrap));
        let found = false;
        let attempts = 0;
        while (!found && attempts < 10) {
          const txs = (
            await tonRawBlockchainApi.getTransactions({
              account: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
            })
          ).transactions.filter(
            (tx: Transaction) =>
              !beforeTxs.find((beforeTx) => beforeTx.hash === tx.hash)
          );
          if (txs.length) {
            const tx = txs.find((tx) => {
              const addr = tx.inMsg?.source?.address;
              if (!addr) return false;
              return Address.parse(addr).equals(Address.parse(myTonAddrRaw));
            });
            if (tx) {
              found = true;
              setTestHash(tx.hash);
              console.log(tx); // !!!!!
            }
          }
          attempts += 1;
          await sleep(2000);
        }
        setSubmitting(false);
      } catch (err) {
        console.log(err);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    formik.setFieldValue("ethAddr", myEvmAccount.address);
  }, [myEvmAccount.address]);

  const provider = useSigner();
  const bridgeContract = useContract({
    // address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    address: "0x18A9e708B17A477BFF625db0F65C6f10B41d73ca",
    abi: bridgeAbi,
    signerOrProvider: provider.data,
  });

  const [testHash, setTestHash] = useState<string>(
    "d8131b494f4cc8ce94cc192034eb7af6cc713846dc54379f741cb864c3ae78e5"
  );
  const [currentTx, setCurrentTx] = useState<TonTransaction>();
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

  const validateBlock = async (block: TonBlock) => {
    // if (this.disabledValidating) {
    //   return;
    // }
    // this.disabledValidating = true;
    // this.updateSelectedByBlock(block, true);

    if (block.workchain === -1) {
      const res = await axios.post(
        "http://128.199.139.200:3000/validator/checkmcblock",
        {
          id: block.id,
        }
      );
      console.log(res.data);

      // this.explorerService
      //   .checkMcBlockByValidators(block.seqno)
      //   .subscribe((res) => {
      //     this.disabledValidating = false;
      //     this.updateSelectedByBlock(block, false, true);
      //   });
    } else {
      const res = await axios.post(
        "http://128.199.139.200:3000/validator/checkshard",
        { id: block.id }
      );
      console.log(res.data);
      // this.explorerService.checkShardBlock(block.id).subscribe(() => {
      //   this.disabledValidating = false;
      //   this.updateSelectedByBlock(block, false, true);
      // });
    }
  };

  const validate = async (tx: TonTransaction) => {
    // if (this.disabledValidating) {
    //   return;
    // }
    // this.disabledValidating = true;
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
    // this.explorerService.checkTransaction(tx).subscribe((value: any) => {
    //   console.log('tx:', value);
    //   if (this.contractService.bridgeContract) {
    //     this.contractService.bridgeContract
    //       .readTransaction(
    //         Buffer.from(value.txBoc, 'hex'),
    //         Buffer.from(value.boc, 'hex'),
    //         value.adapter
    //       )
    //       .then(() => {
    //         // this.isDone = true;
    //         // this.disabledValidating = false;});
    //   } else {
    //     console.log('bridge contract not initialized');
    //     // this.disabledValidating = false;
    //   }
    // });
  };

  useEffect(() => {
    fetch(`${apiRoot}/findtx/${testHash}`)
      .then((v) => v.json())
      .then((txs: TonTransaction[]) => {
        console.log(txs);
        const tx = txs[0];

        if (!tx) {
          console.log("Error: tx not found. Try to find it later");
        }

        setCurrentTx(tx);
      });
  }, [testHash]);

  return (
    <div>
      <Step.Group fluid widths={3}>
        <Step active>
          {/* <Icon name="truck" /> */}
          <Step.Content>
            <Step.Title>Send TON</Step.Title>
            <Step.Description>To wrap</Step.Description>
          </Step.Content>
        </Step>

        <Step disabled>
          {/* <Icon name="payment" /> */}
          <Step.Content>
            <Step.Title>Process transfer</Step.Title>
            <Step.Description>Relayers</Step.Description>
          </Step.Content>
        </Step>

        <Step disabled>
          {/* <Icon name="info" /> */}
          <Step.Content>
            <Step.Title>Take your WTON</Step.Title>
          </Step.Content>
        </Step>
      </Step.Group>

      <Container className="p-8 border border-1 rounded">
        <Form onSubmit={formik.handleSubmit} loading={formik.isSubmitting}>
          <Form.Field required>
            <label>Enter sum</label>
            <Input
              placeholder="Sum"
              name="tonsToWrap"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.tonsToWrap}
            />
          </Form.Field>
          <Form.Field required>
            <label>Enter address</label>
            <Input
              placeholder="Address EVM"
              name="ethAddr"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.ethAddr}
            />
          </Form.Field>
          <Container>
            <Button type="submit" primary>
              Submit
            </Button>
            <Button type="reset">Reset</Button>
          </Container>
        </Form>
      </Container>

      <Container className="p-8 border border-1 rounded">
        {mcBlock && (
          <div>
            {isMcBlockReady ? (
              "✅"
            ) : (
              <Button
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
    </div>
  );
};

export default WrapTon;
