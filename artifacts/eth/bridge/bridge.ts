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
      {
        internalType: "uint256",
        name: "opcode",
        type: "uint256",
      },
    ],
    name: "readTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "to",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "adapterAddr",
        type: "address",
      },
    ],
    name: "swapETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "to",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "adapterAddr",
        type: "address",
      },
    ],
    name: "swapToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
