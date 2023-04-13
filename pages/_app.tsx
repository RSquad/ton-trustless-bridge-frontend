import { Layout } from "@/components";
import "@/styles/globals.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import type { AppProps } from "next/app";
import "semantic-ui-css/semantic.min.css";

import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { useEffect, useState } from "react";
import { WagmiConfig, configureChains, createClient } from "wagmi";
import { bscTestnet } from "wagmi/chains";

// 2. Configure wagmi client
const chains = [
  // localhost,
  // mainnet,
  // polygon,
  // avalanche,
  // arbitrum,
  bscTestnet,
  // bsc,
  // optimism,
  // gnosis,
  // fantom,
];

const { provider } = configureChains(chains, [
  w3mProvider({
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  }),
]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({
    version: 1,
    chains,
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  }),
  provider,
});

// 3. Configure modal ethereum client
const ethereumClient = new EthereumClient(wagmiClient, chains);

const App = ({ Component, pageProps }: AppProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);
  return (
    <>
      {ready ? (
        <WagmiConfig client={wagmiClient}>
          <TonConnectUIProvider
            manifestUrl={process.env.NEXT_PUBLIC_TON_CONNECT_V2_MANIFEST_URL!}
          >
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </TonConnectUIProvider>
        </WagmiConfig>
      ) : null}
      <Web3Modal
        projectId={process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!}
        ethereumClient={ethereumClient}
      />
    </>
  );
};

export default App;
