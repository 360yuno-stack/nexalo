// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @dev Minimal mock WBTC for testing (8 decimals like real WBTC)
contract MockWBTC is ERC20, Ownable {
    constructor() ERC20("Wrapped BTC", "WBTC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) { return 8; }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

/// @dev Minimal mock VRF Coordinator for testing
contract MockVRFCoordinator {
    uint256 private _nextRequestId = 1;
    mapping(uint256 => address) private _consumers;

    event RandomWordsRequested(uint256 requestId, address consumer);

    function requestRandomWords(
        bytes32, uint64, uint16, uint32, uint32
    ) external returns (uint256 requestId) {
        requestId = _nextRequestId++;
        _consumers[requestId] = msg.sender;
        emit RandomWordsRequested(requestId, msg.sender);
    }

    /// @dev Call this to simulate Chainlink callback
    function fulfillRandomWords(uint256 requestId, uint256[] memory words) external {
        address consumer = _consumers[requestId];
        require(consumer != address(0), "Unknown request");
        // Call fulfillRandomWords on the consumer
        (bool ok,) = consumer.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, words)
        );
        require(ok, "Fulfillment failed");
    }
}
