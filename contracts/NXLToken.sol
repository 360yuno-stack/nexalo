// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Supply: 100M
 * - 96M rewards (held by contract)
 * - 3M founder vesting 2y
 * - 1M partner vesting 1y
 *
 * Autonomía: no Ownable, NexumManager se setea una sola vez.
 */
contract NXLToken is ERC20 {
    uint256 private constant TOTAL_SUPPLY = 100_000_000 * 1e18;
    uint256 private constant FOUNDER_AMOUNT = 3_000_000 * 1e18;
    uint256 private constant PARTNER_AMOUNT = 1_000_000 * 1e18;

    uint256 private constant FOUNDER_VESTING_DURATION = 730 days;
    uint256 private constant PARTNER_VESTING_DURATION = 365 days;

    address public immutable founderAddress;
    address public immutable partnerAddress;

    address public nexumManager;
    bool public nexumManagerSet;

    uint256 public immutable deploymentTime;

    uint256 public founderWithdrawn;
    uint256 public partnerWithdrawn;
    uint256 public rewardsDistributed;

    event RewardDistributed(address indexed recipient, uint256 amount);
    event VestedTokensWithdrawn(address indexed beneficiary, uint256 amount);
    event NexumManagerSet(address indexed manager);
    event TokensBurned(uint256 amount);

    modifier onlyNexumManager() {
        require(msg.sender == nexumManager, "Only NexumManager");
        _;
    }

    constructor(address _founderAddress, address _partnerAddress)
        ERC20("NEXALO Token", "NXL")
    {
        require(_founderAddress != address(0), "Invalid founder");
        require(_partnerAddress != address(0), "Invalid partner");
        founderAddress = _founderAddress;
        partnerAddress = _partnerAddress;
        deploymentTime = block.timestamp;
        _mint(address(this), TOTAL_SUPPLY);
    }

    function setNexumManager(address _nexumManager) external {
        require(!nexumManagerSet, "Manager already set");
        require(_nexumManager != address(0), "Invalid manager");
        nexumManager = _nexumManager;
        nexumManagerSet = true;
        emit NexumManagerSet(_nexumManager);
    }

    function distributeReward(address recipient, uint256 amount) external onlyNexumManager {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount=0");
        uint256 available = getAvailableRewards();
        require(available >= amount, "Insufficient rewards");
        rewardsDistributed += amount;
        _transfer(address(this), recipient, amount);
        emit RewardDistributed(recipient, amount);
    }

    function getAvailableRewards() public view returns (uint256 available) {
        uint256 bal = balanceOf(address(this));
        uint256 founderReserved = FOUNDER_AMOUNT - founderWithdrawn;
        uint256 partnerReserved = PARTNER_AMOUNT - partnerWithdrawn;
        uint256 reserved = founderReserved + partnerReserved;
        if (bal > reserved) return bal - reserved;
        return 0;
    }

    function getFounderAvailable() public view returns (uint256 available) {
        uint256 elapsed = block.timestamp - deploymentTime;
        uint256 vested = elapsed >= FOUNDER_VESTING_DURATION
            ? FOUNDER_AMOUNT
            : (FOUNDER_AMOUNT * elapsed) / FOUNDER_VESTING_DURATION;
        available = vested - founderWithdrawn;
    }

    function getPartnerAvailable() public view returns (uint256 available) {
        uint256 elapsed = block.timestamp - deploymentTime;
        uint256 vested = elapsed >= PARTNER_VESTING_DURATION
            ? PARTNER_AMOUNT
            : (PARTNER_AMOUNT * elapsed) / PARTNER_VESTING_DURATION;
        available = vested - partnerWithdrawn;
    }

    function founderWithdraw() external {
        require(msg.sender == founderAddress, "Only founder");
        uint256 available = getFounderAvailable();
        require(available > 0, "No tokens");
        founderWithdrawn += available;
        _transfer(address(this), founderAddress, available);
        emit VestedTokensWithdrawn(founderAddress, available);
    }

    function partnerWithdraw() external {
        require(msg.sender == partnerAddress, "Only partner");
        uint256 available = getPartnerAvailable();
        require(available > 0, "No tokens");
        partnerWithdrawn += available;
        _transfer(address(this), partnerAddress, available);
        emit VestedTokensWithdrawn(partnerAddress, available);
    }

    /**
     * @dev Burn undistributed rewards (only manager)
     */
    function burnUndistributed(uint256 amount) external onlyNexumManager {
        require(amount > 0, "Amount=0");
        uint256 available = getAvailableRewards();
        require(available >= amount, "Insufficient rewards");
        _burn(address(this), amount);
        emit TokensBurned(amount);
    }

    function burn(uint256 amount) external {
        require(amount > 0, "Amount=0");
        _burn(msg.sender, amount);
        emit TokensBurned(amount);
    }
}
