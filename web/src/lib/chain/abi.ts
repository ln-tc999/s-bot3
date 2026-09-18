// Generated from `forge build` output. Do not hand-edit: regenerate it so the
// ABIs can never drift from the deployed bytecode.

export const sbot3RegistryAbi = [
  {
    type: "function",
    name: "TOTAL_BPS",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allLabels",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "string[]",
        internalType: "string[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "create",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbols",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "weights",
        type: "uint16[]",
        internalType: "uint16[]",
      },
      {
        name: "methodology",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "delegate",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "agent",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "exists",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getIndex",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
      {
        name: "agent",
        type: "address",
        internalType: "address",
      },
      {
        name: "vault",
        type: "address",
        internalType: "address",
      },
      {
        name: "locked",
        type: "bool",
        internalType: "bool",
      },
      {
        name: "createdAt",
        type: "uint64",
        internalType: "uint64",
      },
      {
        name: "name",
        type: "string",
        internalType: "string",
      },
      {
        name: "methodology",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbols",
        type: "string[]",
        internalType: "string[]",
      },
      {
        name: "weights",
        type: "uint16[]",
        internalType: "uint16[]",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isLocked",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "lock",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMethodology",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "methodology",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setVault",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "vault",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setWeights",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "weights",
        type: "uint16[]",
        internalType: "uint16[]",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalIndexes",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "vaultOf",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "weightOf",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "symbol",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentDelegated",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "IndexCreated",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "owner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "name",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "constituents",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MethodologyChanged",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "methodology",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MethodologyLocked",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "by",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VaultSet",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WeightsChanged",
    inputs: [
      {
        name: "label",
        type: "string",
        indexed: false,
        internalType: "string",
      },
      {
        name: "by",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "AlreadyLocked",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "DuplicateSymbol",
    inputs: [
      {
        name: "symbol",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "EmptyIndex",
    inputs: [],
  },
  {
    type: "error",
    name: "EmptyLabel",
    inputs: [],
  },
  {
    type: "error",
    name: "IsLocked",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "LabelTaken",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "LengthMismatch",
    inputs: [
      {
        name: "symbols",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "weights",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "NotOwner",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "caller",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "NotOwnerOrAgent",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
      {
        name: "caller",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "UnknownIndex",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "VaultAlreadySet",
    inputs: [
      {
        name: "label",
        type: "string",
        internalType: "string",
      },
    ],
  },
  {
    type: "error",
    name: "WeightsMustTotal",
    inputs: [
      {
        name: "got",
        type: "uint256",
        internalType: "uint256",
      },
    ],
  },
  {
    type: "error",
    name: "ZeroVault",
    inputs: [],
  },
] as const;
