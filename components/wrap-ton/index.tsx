import { BridgeOpCodes } from "@/artifacts/ton/bridge/op-codes";
import { Base64 } from "@tonconnect/protocol";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useFormik } from "formik";
import { FC, HTMLAttributes, useEffect, useState } from "react";
import { Button, Container, Form, Input, Step } from "semantic-ui-react";
import { beginCell, toNano } from "ton-core";
import { useAccount } from "wagmi";

interface WrapTonProps extends HTMLAttributes<HTMLDivElement> {}

const WrapTon: FC<WrapTonProps> = ({ children }) => {
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

  const formik = useFormik({
    initialValues: {
      tonsToWrap: "",
      ethAddr: "",
    },
    onSubmit: async ({ ethAddr, tonsToWrap }, { setSubmitting }) => {
      await sendWrap(BigInt(ethAddr), BigInt(tonsToWrap));
      setSubmitting(false);
    },
  });

  useEffect(() => {
    formik.setFieldValue("ethAddr", myEvmAccount.address);
  }, [myEvmAccount.address]);

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
    </div>
  );
};

export default WrapTon;
