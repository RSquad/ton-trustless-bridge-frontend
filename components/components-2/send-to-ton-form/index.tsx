import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useFormik } from "formik";
import { FC, HTMLAttributes, useEffect, useState } from "react";
import { Button, Container, Form, Input } from "semantic-ui-react";
import { useAccount } from "wagmi";

const pairs: { [key: string]: string } = {
  TON: "EVM",
  wTON: "TVM",
  ETH: "TVM",
  wETH: "EVM",
};

interface SendToTonProps extends HTMLAttributes<HTMLDivElement> {
  onFormSubmit: (address: string, amount: string) => Promise<void>;
  baseCoin: string;
}

const SendToTonForm: FC<SendToTonProps> = ({ onFormSubmit, baseCoin }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [connectionRestored, setConnectionRestored] = useState(false);
  const myEvmAccount = useAccount();
  const myTonAddrRaw = useTonAddress(false);

  const formik = useFormik({
    initialValues: {
      tonsToWrap: "",
      ethAddr: "",
    },
    onSubmit: async ({ ethAddr, tonsToWrap }, { setSubmitting }) => {
      try {
        await onFormSubmit(ethAddr, tonsToWrap);
        setSubmitting(false);
      } catch (error) {
        console.log(error);
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    tonConnectUI.connectionRestored.then(() => setConnectionRestored(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (["TON", "wETH"].includes(baseCoin)) {
      formik.setFieldValue("ethAddr", myEvmAccount.address);
    } else {
      formik.setFieldValue("ethAddr", myTonAddrRaw);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEvmAccount.address, myTonAddrRaw, baseCoin]);

  return (
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
          placeholder={"Address " + pairs[baseCoin]}
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
  );
};

export default SendToTonForm;
