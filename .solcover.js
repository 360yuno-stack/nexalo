module.exports = {
  skipFiles: ['mocks/', 'test/', 'TestMocks.sol', 'TestUSDT.sol', 'usdtfaucet.sol'],
  configureYulOptimizer: true,
  mocha: {
    grep: '/^(?!.*100-Rounds|.*Massive|.*extreme)/',
    timeout: 300000
  }
};
