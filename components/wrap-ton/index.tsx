import { tonRawBlockchainApi } from "@/services";
import { FC, HTMLAttributes, useEffect, useState } from "react";
import { Step } from "semantic-ui-react";
import ProcessTransfer from "../process-transfer";
import SendTon from "../send-ton";

// const apiRoot = "http://128.199.139.200:3000/ton-explorer";
// const apiRoot = "https://localhost:3000";

interface WrapTonProps extends HTMLAttributes<HTMLDivElement> {}

const WrapTon: FC<WrapTonProps> = ({ children }) => {
  const [testHash, setTestHash] = useState<string>(
    // "d8131b494f4cc8ce94cc192034eb7af6cc713846dc54379f741cb864c3ae78e5"
    "87bc60dd122271e3a7b14ee86a1f999f33d7529199908b8230bbb8e48253c90c"
  );
  const [step, setStep] = useState<number>(1);

  useEffect(() => {
    tonRawBlockchainApi
      .getTransactions({
        account: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
      })
      .then(console.log);
  }, []);

  return (
    <div>
      <Step.Group fluid widths={3}>
        <Step active={step === 0} completed={step > 0}>
          {/* <Icon name="truck" /> */}
          <Step.Content>
            <Step.Title>Send TON</Step.Title>
            <Step.Description>To wrap</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step === 1} disabled={step < 1} completed={step > 1}>
          {/* <Icon name="payment" /> */}
          <Step.Content>
            <Step.Title>Process transfer</Step.Title>
            <Step.Description>Relayers</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step === 2} disabled={step < 2}>
          {/* <Icon name="info" /> */}
          <Step.Content>
            <Step.Title>Take your WTON</Step.Title>
          </Step.Content>
        </Step>
      </Step.Group>

      {step === 0 && (
        <SendTon
          setTxHash={(h) => {
            setTestHash(h);
            setStep(1);
          }}
        />
      )}
      {step === 1 && <ProcessTransfer txHash={testHash} />}
    </div>
  );
};

export default WrapTon;
