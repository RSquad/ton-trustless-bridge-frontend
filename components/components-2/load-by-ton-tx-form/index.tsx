import { TxReq } from "@/types";
import { useFormik } from "formik";
import { Dispatch, FC, HTMLAttributes, SetStateAction } from "react";
import { Button, Container, Form, Input } from "semantic-ui-react";

interface LoadByTonTxFormProps extends HTMLAttributes<HTMLDivElement> {
  setTxHash: Dispatch<SetStateAction<TxReq | undefined>>;
}

const LoadByTonTxForm: FC<LoadByTonTxFormProps> = ({ setTxHash }) => {
  const oldTxFormik = useFormik({
    initialValues: {
      hash: "",
      lt: "",
    },
    onSubmit: async (tx, { setSubmitting }) => {
      setTxHash({
        hash: tx.hash,
        lt: +tx.lt,
        workchain: 0,
      });
      setSubmitting(false);
    },
  });

  return (
    <Form
      onSubmit={oldTxFormik.handleSubmit}
      loading={oldTxFormik.isSubmitting}
    >
      <Form.Field required>
        <label>Enter tx hash</label>
        <Input
          placeholder="Hash"
          name="hash"
          onChange={oldTxFormik.handleChange}
          onBlur={oldTxFormik.handleBlur}
          value={oldTxFormik.values.hash}
        />
      </Form.Field>
      <Form.Field required>
        <label>Enter tx lt</label>
        <Input
          placeholder="lt"
          name="lt"
          onChange={oldTxFormik.handleChange}
          onBlur={oldTxFormik.handleBlur}
          value={oldTxFormik.values.lt}
        />
      </Form.Field>
      <Container>
        <Button type="submit" primary>
          Submit
        </Button>
        <Button type="reset">Reset</Button>
      </Container>
    </Form>
  );
};

export default LoadByTonTxForm;
