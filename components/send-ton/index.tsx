import { BridgeOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { tonRawBlockchainApi } from "@/services";
import { TxReq } from "@/types";
import { sleep } from "@/utils";
import { Base64 } from "@tonconnect/protocol";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useFormik } from "formik";
import {
  Dispatch,
  FC,
  HTMLAttributes,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Button, Container, Form, Input } from "semantic-ui-react";
import { Address, beginCell, toNano } from "ton-core";
import { Transaction } from "tonapi-sdk-js";
import { useAccount } from "wagmi";

interface SendTonProps extends HTMLAttributes<HTMLDivElement> {
  setTxHash: Dispatch<SetStateAction<TxReq | undefined>>;
}

const SendTon: FC<SendTonProps> = ({ children, setTxHash }) => {
  const myTonAddrRaw = useTonAddress(false);
  const myEvmAccount = useAccount();
  const [tonConnectUI] = useTonConnectUI();
  const [connectionRestored, setConnectionRestored] = useState(false);

  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => setConnectionRestored(true));
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

  useEffect(() => {
    formik.setFieldValue("ethAddr", myEvmAccount.address);
  }, [myEvmAccount.address]);

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
              const addr = Address.parse(tx.account.address);
              const lt = tx.lt;
              const workchain = addr.workChain;
              setTxHash({ hash: tx.hash, lt, workchain });
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

  return (
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
  );
};

export default SendTon;
