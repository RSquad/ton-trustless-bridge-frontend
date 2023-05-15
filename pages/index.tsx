import WrapTon from "@/components/wrap-ton";
import { Header, Message } from "semantic-ui-react";

const Home = () => {
  return (
    <>
      <Header as="h1">Welcome to TON Trustless Bridge</Header>
      <p>
        TON Trustless Bridge is a bridge between TON and Ethereum blockchains
        without the use of oracles and off-chain validation. This is achieved by
        implementing a fully functional lightweight client of one blockchain on
        a virtual machine of another blockchain. Thus, all validation of
        transactions and data is carried out directly in the blockchain, which
        guarantees a high level of security and decentralization.
      </p>
      <Message warning>(Use Sepolia and TON Testnet for testing)</Message>
      <WrapTon />
    </>
  );
};

export default Home;
