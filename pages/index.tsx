import BurnWethFlow from "@/components/components-2/burn-weth-flow";
import BurnwTonFlow from "@/components/components-2/burn-wton-flow";
import CurrencySelect from "@/components/components-2/currency-select";
import SendETHFlow from "@/components/components-2/send-eth-flow";
import SendTonFlow from "@/components/components-2/send-ton-flow";
import StepFormHeader from "@/components/components-2/step-form-header";
import { useState } from "react";
import { Header, Message } from "semantic-ui-react";

const jettonAddr = process.env.NEXT_PUBLIC_TON_JETTON_ADDR!;
const tokenWTON = process.env.NEXT_PUBLIC_ETH_WTON_ADDR!;

const Home = () => {
  const [baseCoin, setBaseCoin] = useState<string>("ETH");
  const [step, setStep] = useState<number>(0);

  return (
    <>
      <Header as="h1">Welcome to TON Teleport</Header>
      <p>
        TON Teleport is a bridge between TON and Ethereum blockchains without
        the use of oracles and off-chain validation. This is achieved by
        implementing a fully functional lightweight client of one blockchain on
        a virtual machine of another blockchain. Thus, all validation of
        transactions and data is carried out directly in the blockchain, which
        guarantees a high level of security and decentralization.
      </p>
      <Message warning>(Use Sepolia and TON Testnet for testing)</Message>
      <p>
        WTON address:{" "}
        <a
          href={`https://sepolia.etherscan.io/token/${tokenWTON}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {tokenWTON}
        </a>
      </p>
      <p>
        WETH address:{" "}
        <a
          href={`https://testnet.tonscan.org/address/${jettonAddr}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {jettonAddr}
        </a>
      </p>
      <CurrencySelect baseCoin={baseCoin} setBaseCoin={setBaseCoin} />
      <StepFormHeader baseCoin={baseCoin} step={step} />
      {baseCoin === "TON" && (
        <SendTonFlow step={step} setStep={setStep} baseCoin={baseCoin} />
      )}
      {baseCoin === "ETH" && (
        <SendETHFlow step={step} setStep={setStep} baseCoin={baseCoin} />
      )}
      {baseCoin === "wETH" && (
        <BurnWethFlow step={step} setStep={setStep} baseCoin={baseCoin} />
      )}
      {baseCoin === "wTON" && (
        <BurnwTonFlow step={step} setStep={setStep} baseCoin={baseCoin} />
      )}
    </>
  );
};

export default Home;
