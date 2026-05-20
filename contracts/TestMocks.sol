// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract StableMock {
    string public name = "Mock USDT";
    string public symbol = "mUSDT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        if (allowed != type(uint256).max) {
            allowance[from][msg.sender] = allowed - amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}

contract NXLMock {
    uint256 public availableRewards = type(uint256).max / 4;
    mapping(address => uint256) public distributed;
    address public treasuryBTC;

    function distributeReward(address recipient, uint256 amount) external {
        require(availableRewards >= amount, "no rewards");
        availableRewards -= amount;
        distributed[recipient] += amount;
    }

    function burnUndistributed(uint256 amount) external {
        require(availableRewards >= amount, "too much");
        availableRewards -= amount;
    }

    function getAvailableRewards() external view returns (uint256) {
        return availableRewards;
    }

    function setTreasuryBTC(address treasury) external {
        treasuryBTC = treasury;
    }
}

contract ReferralMock {
    mapping(address => address) public referrerOf;

    function setReferrer(address user, address referrer) external {
        referrerOf[user] = referrer;
    }

    function hasReferrer(address user) external view returns (bool) {
        return referrerOf[user] != address(0);
    }

    function getReferralChain(address) external pure returns (address level1, address level2, address level3) {
        return (address(0), address(0), address(0));
    }

    function distributeCommissions(address, uint256) external {}
}

contract TreasuryMock {
    uint256 public received;

    function onFundsReceived(uint256 amount) external {
        received += amount;
    }
}

interface IVRFConsumerLike {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

contract MockVRFCoordinator {
    uint256 public nextRequestId = 1;

    function requestRandomWords(bytes32, uint64, uint16, uint32, uint32) external returns (uint256 requestId) {
        requestId = nextRequestId++;
    }

    function fulfill(address consumer, uint256 requestId, uint256 randomWord) external {
        uint256[] memory words = new uint256[](1);
        words[0] = randomWord;
        IVRFConsumerLike(consumer).rawFulfillRandomWords(requestId, words);
    }
}