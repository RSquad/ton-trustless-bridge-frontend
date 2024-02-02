import { Dispatch, FC, HTMLAttributes, SetStateAction } from "react";
import { Container, Dropdown } from "semantic-ui-react";

const options = [
  { key: "TON", text: "TON", value: "TON" },
  { key: "wTON", text: "wTON", value: "wTON" },
  { key: "ETH", text: "ETH", value: "ETH" },
  { key: "wETH", text: "wETH", value: "wETH" },
];

export const pairs: { [key: string]: string } = {
  TON: "wTON",
  wTON: "TON",
  ETH: "wETH",
  wETH: "ETH",
};

interface CurrencySelectProps extends HTMLAttributes<HTMLDivElement> {
  baseCoin: string;
  setBaseCoin: Dispatch<SetStateAction<string>>;
}

const CurrencySelect: FC<CurrencySelectProps> = ({ baseCoin, setBaseCoin }) => {
  return (
    <Container>
      <Dropdown
        value={baseCoin}
        onChange={(e, { value }) => {
          setBaseCoin(value as string);
        }}
        className="button"
        options={options}
      />
      <span>→</span>
      <Dropdown
        disabled
        className="button"
        value={pairs[baseCoin]}
        options={options}
      />
    </Container>
  );
};

export default CurrencySelect;
