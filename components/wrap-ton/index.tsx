import { tonRawBlockchainApi } from "@/services";
import { TxReq } from "@/types";
import { FC, HTMLAttributes, useEffect, useState } from "react";
import { Icon, Step } from "semantic-ui-react";
import ProcessTransfer from "../process-transfer";
import SendTon from "../send-ton";
import TakeWton from "../take-wton";

// const apiRoot = "http://128.199.139.200:3000/ton-explorer";
// const apiRoot = "https://localhost:3000";

interface WrapTonProps extends HTMLAttributes<HTMLDivElement> {}

const WrapTon: FC<WrapTonProps> = ({ children }) => {
  const [testHash, setTestHash] = useState<TxReq | undefined>();
  // {
  //   workchain: 0,
  //   lt: 10555732000003,
  //   hash: "2cf147759d1fff6a88c657ddd0541ed39042695f9d87b72c48f3fc7ff3b07595",
  // }
  // {
  //   workchain: 0,
  //   lt: 9882134000003,
  //   hash: "799e850f35b13f4c52abc8d5fd5a954b844d4f1e5362bfff23f202015e6416e3",
  // }
  // "5914ec5a7a02ec2b7cdc302270cfaf190ebf6c5490a0a6ce20ec187696c1fd1d"
  // "3e387bf554e35b25d5923402f9937b73d92f97055649e69a78d5025af6788652"
  // "d8131b494f4cc8ce94cc192034eb7af6cc713846dc54379f741cb864c3ae78e5"
  // "87bc60dd122271e3a7b14ee86a1f999f33d7529199908b8230bbb8e48253c90c"

  // {"2cf147759d1fff6a88c657ddd0541ed39042695f9d87b72c48f3fc7ff3b07595" 0 10555732000003}
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    tonRawBlockchainApi
      .getTransactions({
        account: process.env.NEXT_PUBLIC_TON_BRIDGE_ADDR!,
      })
      .then(console.log);
  }, []);

  return (
    <>
      <Step.Group fluid widths={3}>
        <Step active={step === 0} completed={step > 0}>
          <Icon name="send" />
          <Step.Content>
            <Step.Title>Send TON</Step.Title>
            <Step.Description>To wrap</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step === 1} disabled={step < 1} completed={step > 1}>
          <Icon name="payment" />
          <Step.Content>
            <Step.Title>Process transfer</Step.Title>
            <Step.Description>Relayers</Step.Description>
          </Step.Content>
        </Step>

        <Step active={step === 2} completed={step === 2} disabled={step < 2}>
          <Icon name="info" />
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
      {step === 1 && (
        <ProcessTransfer
          txHash={testHash}
          onComplete={() => {
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <TakeWton
          resetStep={() => {
            setStep(0);
            setTestHash(undefined);
          }}
        />
      )}
    </>
  );
};

export default WrapTon;
