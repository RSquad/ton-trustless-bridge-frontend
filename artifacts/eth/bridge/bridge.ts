export const bridgeAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "blockParser",
        type: "address",
      },
      {
        internalType: "address",
        name: "transactionParser",
        type: "address",
      },
      {
        internalType: "address",
        name: "treeOfCellsParser",
        type: "address",
      },
      {
        internalType: "address",
        name: "validatorAddr",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "txBoc",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "blockBoc",
        type: "bytes",
      },
      {
        internalType: "address",
        name: "adapterAddr",
        type: "address",
      },
    ],
    name: "readTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
