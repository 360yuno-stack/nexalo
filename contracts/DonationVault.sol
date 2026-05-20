// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title DonationVault
 * @author Nexalo Team
 * @notice Vault de donaciones: stable → forward a TreasuryBTC.
 */
contract DonationVault is Ownable2Step, ReentrancyGuard {
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
        require(amount != 0, "Amount>0");
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

    /// @notice L-03 FIX: 2-day timelock before treasury update takes effect.
    address public pendingTreasury;
    uint256 public pendingTreasuryAvailableAt;
    uint256 public constant TREASURY_TIMELOCK = 2 days;

    event TreasuryUpdateProposed(address indexed newTreasury);
    event TreasuryUpdated(address indexed newTreasury);

    function proposeTreasuryUpdate(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury");
        pendingTreasury = newTreasury;
        pendingTreasuryAvailableAt = block.timestamp + TREASURY_TIMELOCK;
        emit TreasuryUpdateProposed(newTreasury);
    }

    function executeTreasuryUpdate() external onlyOwner {
        require(pendingTreasury != address(0), "No pending update");
        // forge-lint: disable-next-line(block-timestamp)
        require(block.timestamp >= pendingTreasuryAvailableAt, "Timelock not elapsed");
        address newTreasury = pendingTreasury;
        pendingTreasury = address(0);
        pendingTreasuryAvailableAt = 0;
        treasuryBTC = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    // Views
}
