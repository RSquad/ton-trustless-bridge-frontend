import { FC, HTMLAttributes } from "react";
import { Icon, Step } from "semantic-ui-react";
import { pairs } from "../currency-select";

interface StepFormHeaderProps extends HTMLAttributes<HTMLDivElement> {
  baseCoin: string;
  step: number;
}

const StepFormHeader: FC<StepFormHeaderProps> = ({ baseCoin, step }) => {
  return (
    <Step.Group fluid widths={3}>
      <Step active={step === 0} completed={step > 0}>
        <Icon name="send" />
        <Step.Content>
          <Step.Title>Send {baseCoin}</Step.Title>
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
          <Step.Title>Take your {pairs[baseCoin]}</Step.Title>
        </Step.Content>
      </Step>
    </Step.Group>
  );
};

export default StepFormHeader;
