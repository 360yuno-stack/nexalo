// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Mock VRFCoordinatorV2 for tests
// Compatible con Chainlink VRFConsumerBaseV2

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

contract VRFCoordinatorV2Mock {
    uint96 public immutable BASE_FEE;
    uint96 public immutable GAS_PRICE_LINK;

    uint256 private _nextRequestId = 1;
    uint64 private _nextSubId = 1;

    struct Subscription {
        uint96 balance;
        uint64 reqCount;
        address owner;
    }

    mapping(uint64 => Subscription) private s_subscriptions;
    mapping(uint64 => address[]) private s_consumers;
    mapping(uint256 => uint64) private s_requestToSub;
    mapping(uint256 => address) private s_requestToConsumer;

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);
    event SubscriptionCreated(uint64 indexed subId, address owner);
    event SubscriptionFunded(uint64 indexed subId, uint256 oldBalance, uint256 newBalance);
    event ConsumerAdded(uint64 indexed subId, address consumer);

    constructor(uint96 baseFee, uint96 gasPriceLink) {
        BASE_FEE = baseFee;
        GAS_PRICE_LINK = gasPriceLink;
    }

    function createSubscription() external returns (uint64 subId) {
        subId = _nextSubId++;
        s_subscriptions[subId] = Subscription({ balance: 0, reqCount: 0, owner: msg.sender });
        emit SubscriptionCreated(subId, msg.sender);
    }

    function fundSubscription(uint64 subId, uint96 amount) external {
        uint96 old = s_subscriptions[subId].balance;
        s_subscriptions[subId].balance += amount;
        emit SubscriptionFunded(subId, old, s_subscriptions[subId].balance);
    }

    function addConsumer(uint64 subId, address consumer) external {
        s_consumers[subId].push(consumer);
        emit ConsumerAdded(subId, consumer);
    }

    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = _nextRequestId++;
        s_requestToSub[requestId] = subId;
        s_requestToConsumer[requestId] = msg.sender;
        s_subscriptions[subId].reqCount++;

        emit RandomWordsRequested(
            keyHash,
            requestId,
            0,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
    }

    function fulfillRandomWords(uint256 requestId, address consumer) external {
        uint256[] memory words = new uint256[](1);
        words[0] = uint256(keccak256(abi.encodePacked(requestId, block.timestamp)));

        VRFConsumerBaseV2(consumer).rawFulfillRandomWords(requestId, words);
        emit RandomWordsFulfilled(requestId, words[0], 0, true);
    }
}
