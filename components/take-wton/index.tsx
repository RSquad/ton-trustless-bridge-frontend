import { FC, HTMLAttributes } from "react";
import { Button, Container, Icon } from "semantic-ui-react";

interface TakeWtonProps extends HTMLAttributes<HTMLDivElement> {
  resetStep: () => void;
}

const TakeWton: FC<TakeWtonProps> = ({ children, resetStep }) => {
  return (
    <Container className="p-8 border border-1 rounded text-center">
      <Icon name="check" color="green" circular size="huge" />

      <h2>Transaction completed</h2>
      <Button onClick={resetStep} primary>
        Make another transaction
      </Button>
    </Container>
  );
};

export default TakeWton;
