export interface TonTransaction {
  id: number;
  account: string;
  hash: string;
  lt: string;
  mcParent?: TonBlock;
  checked: boolean;
  inprogress: boolean;
}

export interface TonBlock {
  id: number;
  workchain: number;
  seqno: number;
  shard: string;
  rootHash: string;
  fileHash: string;
  checked: boolean;
  mcParent?: TonBlock;
  shards?: TonBlock[];
  isKeyBlock: boolean;
  transactions?: TonTransaction[];
  inprogress: boolean;
}

