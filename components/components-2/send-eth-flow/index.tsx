import TakeWton from "@/components/take-wton";
import { TxReq } from "@/types";
import { FC, HTMLAttributes, SetStateAction, useState } from "react";
import { Container, Tab } from "semantic-ui-react";
import ProcessTransferEth from "../process-transfer-eth";
import SendToTonForm from "../send-to-ton-form";
import { useSendEthTx } from "./sendEthTx";

interface SendETHFlowProps extends HTMLAttributes<HTMLDivElement> {
  step: number;
  setStep: (value: SetStateAction<number>) => void;
  baseCoin: string;
}

const SendETHFlow: FC<SendETHFlowProps> = ({ setStep, step, baseCoin }) => {
  const [testHash, setTestHash] = useState<TxReq | undefined>();
  const [ethTxHash, setEthTxHash] = useState<string>();
  const { onFormSubmit } = useSendEthTx(setEthTxHash);

  return (
    <>
      {step === 0 && (
        <Container className="p-8 border border-1 rounded">
          <Tab
            menu={{ secondary: true, pointing: true }}
            panes={[
              {
                menuItem: "Send " + baseCoin,
                render: () => (
                  <SendToTonForm
                    baseCoin={baseCoin}
                    onFormSubmit={async (address, amount) => {
                      await onFormSubmit(address, amount);
                      setStep(1);
                    }}
                  />
                ),
              },
              // {
              //   menuItem: "Use existing TON transaction",
              //   render: () => (
              //     <LoadByTonTxForm
              //       setTxHash={(...args) => {
              //         setTestHash(...args);
              //         setStep(1);
              //       }}
              //     />
              //   ),
              // },
            ]}
          />
        </Container>
      )}
      {step === 1 && (
        <ProcessTransferEth
          txHash={
            ethTxHash ||
            "0x11914d9f106d372a7ffc295dfd0db47cadfa6c354be311d4a3ac231f2c0bff4f"
          }
          onComplete={(hash) => {
            setStep(2);
            setEthTxHash(hash);
          }}
        />
      )}
      {step === 2 && (
        <TakeWton
          txHash={ethTxHash}
          baseCoin={baseCoin}
          resetStep={() => {
            setStep(0);
            setTestHash(undefined);
            setEthTxHash(undefined);
          }}
        />
      )}
    </>
  );
};

export default SendETHFlow;
