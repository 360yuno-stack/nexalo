// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRFConsumer {
    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external;
}

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

    function fulfill(address consumer, uint256 requestId, uint256 randomWord) external {
        uint256[] memory words = new uint256[](1);
        words[0] = randomWord;
        IVRFConsumer(consumer).rawFulfillRandomWords(requestId, words);
    }
}