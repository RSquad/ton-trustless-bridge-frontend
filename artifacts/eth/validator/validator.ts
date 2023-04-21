export const validatorAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "signatureValidatorAddr",
        type: "address",
      },
      {
        internalType: "address",
        name: "shardValidatorAddr",
        type: "address",
      },
      {
        internalType: "address",
        name: "tocParserAddr",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root_h",
        type: "bytes32",
      },
    ],
    name: "addCurrentBlockToVerifiedSet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
    ],
    name: "addPrevBlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getCandidatesForValidators",
    outputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "cType",
            type: "uint8",
          },
          {
            internalType: "uint64",
            name: "weight",
            type: "uint64",
          },
          {
            internalType: "bytes32",
            name: "adnl_addr",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "pubkey",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "node_id",
            type: "bytes32",
          },
        ],
        internalType: "struct ValidatorDescription[20]",
        name: "",
        type: "tuple[20]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPrunedCells",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "prefixLength",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "hash",
            type: "bytes32",
          },
        ],
        internalType: "struct CachedCell[10]",
        name: "",
        type: "tuple[10]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getValidators",
    outputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "cType",
            type: "uint8",
          },
          {
            internalType: "uint64",
            name: "weight",
            type: "uint64",
          },
          {
            internalType: "bytes32",
            name: "adnl_addr",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "pubkey",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "node_id",
            type: "bytes32",
          },
        ],
        internalType: "struct ValidatorDescription[20]",
        name: "",
        type: "tuple[20]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "initValidators",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "node_id",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "root_h",
        type: "bytes32",
      },
    ],
    name: "isSignedByValidator",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "rootHash",
        type: "bytes32",
      },
    ],
    name: "isVerifiedBlock",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
    ],
    name: "parseCandidatesRootBlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
    ],
    name: "parsePartValidators",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
    ],
    name: "parseShardProofPath",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
    ],
    name: "readMasterProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "boc",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "rh",
        type: "bytes32",
      },
    ],
    name: "readStateProof",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "setValidatorSet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root_hash",
        type: "bytes32",
      },
      {
        internalType: "uint32",
        name: "seq_no",
        type: "uint32",
      },
    ],
    name: "setVerifiedBlock",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "root_h",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "file_hash",
        type: "bytes32",
      },
      {
        components: [
          {
            internalType: "bytes32",
            name: "node_id",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32",
          },
        ],
        internalType: "struct Vdata[5]",
        name: "vdata",
        type: "tuple[5]",
      },
    ],
    name: "verifyValidators",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
