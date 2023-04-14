import { TonBlock } from "@/types";
import { useEffect, useState } from "react";
import { Container, Pagination, Table } from "semantic-ui-react";

const apiRoot = process.env.NEXT_PUBLIC_TRUSTLESS_BACKEND_URL;

async function getBlocksCount() {
  return fetch(apiRoot + "/ton-explorer/count")
    .then((r) => r.json())
    .then((r) => Math.ceil(r / 10));
}

async function getBlocks(skip = 0) {
  return fetch(apiRoot + "/ton-explorer" + `?skip=${skip}`).then((r) =>
    r.json()
  );
}

const AllBlocks = () => {
  const [blocks, setBlocks] = useState<TonBlock[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    getBlocksCount().then(setTotalPages);
    getBlocks(page * 10).then((r) => {
      setBlocks(r);
    });
    const interval = setInterval(() => {
      getBlocksCount().then(setTotalPages);
      getBlocks(page * 10).then((r) => {
        setBlocks(r);
      });
    }, 10000);
    return () => {
      return clearInterval(interval);
    };
  }, [page]);
  return (
    <Container className="mt-8">
      <h2>All blocks:</h2>
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell textAlign="center">Seqno</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Workchain</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Root hash</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Type</Table.HeaderCell>
            <Table.HeaderCell textAlign="center">Verified</Table.HeaderCell>
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
              <Table.Cell>{block.checked ? "✅" : ""}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>

        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan="5">
              <Pagination
                defaultActivePage={page + 1}
                totalPages={totalPages}
                onPageChange={(e, activePage) =>
                  setPage(+(activePage.activePage || 1) - 1)
                }
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </Container>
  );
};

export default AllBlocks;
