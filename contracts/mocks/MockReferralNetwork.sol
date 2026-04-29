// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockReferralNetwork {
    mapping(address => address) public referrerOf;

    function setReferrer(address user, address referrer) external {
        referrerOf[user] = referrer;
    }

    function hasReferrer(address user) external view returns (bool) {
        return referrerOf[user] != address(0);
    }

    function getReferralChain(address user)
        external
        view
        returns (address level1, address level2, address level3)
    {
        level1 = referrerOf[user];
        level2 = address(0);
        level3 = address(0);
    }

    function distributeCommissions(address, uint256) external {}
}