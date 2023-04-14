import { TonBlock } from "@/types";
import { useEffect, useState } from "react";
import { Container, Pagination, Table } from "semantic-ui-react";

const apiRoot = process.env.NEXT_PUBLIC_TRUSTLESS_BACKEND_URL;

async function getValidatedBlocksCount() {
  return fetch(apiRoot + "/ton-explorer/checkedcount")
    .then((r) => r.json())
    .then((r) => Math.ceil(r / 10));
}

async function getCheckedBlocks(skip = 0) {
  return fetch(apiRoot + "/ton-explorer/checked" + `?skip=${skip}`).then((r) =>
    r.json()
  );
}

const Blocks = () => {
  const [blocks, setBlocks] = useState<TonBlock[]>([]);
  const [validatedPage, setValidatedPage] = useState(0);
  const [totalValidatedPages, setTotalValidatedPages] = useState(0);

  useEffect(() => {
    getValidatedBlocksCount().then(setTotalValidatedPages);
    getCheckedBlocks(validatedPage * 10).then((r) => {
      setBlocks(r);
    });
    const interval = setInterval(() => {
      getValidatedBlocksCount().then(setTotalValidatedPages);
      getCheckedBlocks(validatedPage * 10).then((r) => {
        setBlocks(r);
      });
    }, 10000);
    return () => {
      return clearInterval(interval);
    };
  }, [validatedPage]);
  return (
    <Container>
      <h2>Verified blocks:</h2>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign="center">Seqno</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Workchain</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Root hash</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Type</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {blocks.map((block) => (
            <Table.Row key={block.id}>
              <Table.Cell>{block.seqno}</Table.Cell>
              <Table.Cell textAlign="center">{block.workchain}</Table.Cell>
              <Table.Cell>{block.rootHash}</Table.Cell>
              <Table.Cell>
                {block.isKeyBlock
                  ? "keyblock"
                  : block.workchain === -1
                  ? "masterchain"
                  : "shardchain"}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>

        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan="4">
              <Pagination
                defaultActivePage={validatedPage + 1}
                totalPages={totalValidatedPages}
                onPageChange={(e, activePage) =>
                  setValidatedPage(+(activePage.activePage || 1) - 1)
                }
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Container>
  );
};

export default Blocks;
