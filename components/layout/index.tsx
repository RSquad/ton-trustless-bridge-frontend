import { TonConnectButton } from "@tonconnect/ui-react";
import { Web3Button } from "@web3modal/react";
import Link from "next/link";
import { FC, HTMLAttributes } from "react";
import { Container, Menu, Segment } from "semantic-ui-react";

interface LayoutProps extends HTMLAttributes<HTMLDivElement> {}

const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-full flex-col">
      <div style={{ flex: "1 0 auto" }}>
        <Menu className="h-16">
          <Container>
            <Menu.Item as={Link} href="#" header>
              TON Trustless Bridge
            </Menu.Item>
            <Menu.Item as={Link} href="#">
              Blocks
            </Menu.Item>
            <Menu.Item as={Link} href="#">
              Transactions
            </Menu.Item>
            <div className="ml-auto my-auto">
              <Web3Button />
            </div>
            <TonConnectButton className="ml-6 my-auto" />
          </Container>
        </Menu>

        <Container className="pt-11" text>
          {children}
        </Container>
      </div>

      <div style={{ flex: "0 0 auto" }}></div>
      <Segment inverted vertical>
        <Container textAlign="center">Developed by RSquad</Container>
      </Segment>
    </div>
  );
};

export default Layout;
