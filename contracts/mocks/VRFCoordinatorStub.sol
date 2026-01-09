// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VRFCoordinatorStub {
    uint256 public lastRequestId;

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external returns (uint256 requestId) {
        lastRequestId += 1;
        return lastRequestId;
    }
}
