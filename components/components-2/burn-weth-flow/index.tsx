import { bridgeAbi } from "@/artifacts/eth/bridge/bridge";
import ProcessTransfer from "@/components/process-transfer";
import TakeWton from "@/components/take-wton";
import { TxReq } from "@/types";
import { FC, HTMLAttributes, SetStateAction, useState } from "react";
import { Container, Tab } from "semantic-ui-react";
import { useContract, useProvider, useSigner } from "wagmi";
import LoadByTonTxForm from "../load-by-ton-tx-form";
import SendToTonForm from "../send-to-ton-form";
import { useBurnTonTx } from "./burnWethTx";

interface BurnWethFlowProps extends HTMLAttributes<HTMLDivElement> {
  step: number;
  setStep: (value: SetStateAction<number>) => void;
  baseCoin: string;
}

const BurnWethFlow: FC<BurnWethFlowProps> = ({ setStep, step, baseCoin }) => {
  const [testHash, setTestHash] = useState<TxReq | undefined>();
  const [ethTxHash, setEthTxHash] = useState<string>();
  const { onFormSubmit } = useBurnTonTx(setTestHash);

  const provider = useSigner();
  const provider_api = useProvider();
  const bridgeContract = useContract({
    address: process.env.NEXT_PUBLIC_ETH_BRIDGE_ADDR,
    abi: bridgeAbi,
    signerOrProvider: provider.data,
  });

  return (
    <>
      {/* <button onClick={() => fn()}>TEST ME</button> */}
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
              {
                menuItem: "Use existing TON transaction",
                render: () => (
                  <LoadByTonTxForm
                    setTxHash={(...args) => {
                      setTestHash(...args);
                      setStep(1);
                    }}
                  />
                ),
              },
            ]}
          />
        </Container>
      )}
      {step === 1 && (
        <ProcessTransfer
          txHash={testHash}
          onComplete={(hash) => {
            setStep(2);
            setEthTxHash(hash);
          }}
        />
      )}
      {step === 2 && (
        <TakeWton
          baseCoin={baseCoin}
          txHash={ethTxHash}
          resetStep={() => {
            setStep(0);
            setTestHash(undefined);
          }}
        />
      )}
    </>
  );
};

export default BurnWethFlow;
