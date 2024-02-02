export const sleep = (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

export const buildSendEthTx = () => {
  //bridge function swapETH(uint256 to, address adapterAddr)
};

export const buildBurnEthTx = () => {
  // bridge
  //   function swapToken(
  //     address from,
  //     uint256 amount,
  //     uint256 to,
  //     address adapterAddr
  // )
};
