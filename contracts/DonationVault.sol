// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * Vault de donaciones: stable -> forward a TreasuryBTC.
 */
contract DonationVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stablecoin;
    address public treasuryBTC;

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }

    Donation[] public donations;
    mapping(address => uint256) public totalDonated;
    mapping(address => uint256[]) public donorDonations;

    uint256 public totalReceived;
    uint256 public totalDonors;

    event DonationReceived(address indexed donor, uint256 amount, uint256 donationId, string message);
    event DonationsForwarded(address indexed treasury, uint256 amount);

    constructor(address _stablecoin, address _treasuryBTC) Ownable(msg.sender) {
        require(_stablecoin != address(0), "Invalid stablecoin");
        require(_treasuryBTC != address(0), "Invalid treasury");
        stablecoin = IERC20(_stablecoin);
        treasuryBTC = _treasuryBTC;
    }

    function donate(uint256 amount, string calldata message) external nonReentrant {
        require(amount > 0, "Amount>0");
        require(bytes(message).length <= 280, "Message too long");

        stablecoin.safeTransferFrom(msg.sender, address(this), amount);

        uint256 donationId = donations.length;
        donations.push(Donation({
            donor: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            message: message
        }));

        donorDonations[msg.sender].push(donationId);

        if (totalDonated[msg.sender] == 0) totalDonors++;
        totalDonated[msg.sender] += amount;
        totalReceived += amount;

        emit DonationReceived(msg.sender, amount, donationId, message);

        stablecoin.safeTransfer(treasuryBTC, amount);
        emit DonationsForwarded(treasuryBTC, amount);
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        treasuryBTC = newTreasury;
    }

    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(stablecoin), "Cannot recover stablecoin");
        IERC20(token).safeTransfer(owner(), amount);
    }

    // Views 
}
