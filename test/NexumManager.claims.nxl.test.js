const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexumManager - NXL claims", function () {
  let owner, founder, partner, feesReceiver, operationsService, auditFunds, buyer;
  let stable, nxl, vrf, manager, referral, ambassador;

  const KEY_HASH = "0x" + "11".repeat(32);
  const PREMIUM_ID = 2;

  beforeEach(async function () {
    [owner, founder, partner, feesReceiver, operationsService, auditFunds, buyer] =
      await ethers.getSigners();
    // guardian is 8th signer (index 7)
    const signers = await ethers.getSigners();
    const guardian = signers[7];

    const Stable = await ethers.getContractFactory("MockERC20");
    stable = await Stable.deploy("Mock USD", "mUSD", 18);
    await stable.waitForDeployment();

    const NXL = await ethers.getContractFactory("MockNXLTokenFailing");
    nxl = await NXL.deploy();
    await nxl.waitForDeployment();

    const VRF = await ethers.getContractFactory("VRFCoordinatorV2MockLocal");
    vrf = await VRF.deploy(
      ethers.parseEther("0.1"),
      1_000_000_000
    );
    await vrf.waitForDeployment();

    const Referral = await ethers.getContractFactory("MockReferralNetwork");
    referral = await Referral.deploy();
    await referral.waitForDeployment();

    const Ambassador = await ethers.getContractFactory("MockAmbassadorRegistry");
    ambassador = await Ambassador.deploy();
    await ambassador.waitForDeployment();

    const Manager = await ethers.getContractFactory("NexumManagerHarness");
    manager = await Manager.deploy(
      await vrf.getAddress(),
      1,
      KEY_HASH,
      await stable.getAddress(),
      await nxl.getAddress(),
      founder.address,
      partner.address,
      feesReceiver.address,
      operationsService.address,
      auditFunds.address,
      guardian.address
    );
    await manager.waitForDeployment();

    await nxl.setAvailableRewards(ethers.parseEther("1000000"));

    await manager.connect(owner).configureNXLTokenTreasury(owner.address);
    await manager.connect(owner).setEcosystemAddresses(
      owner.address,
      await referral.getAddress(),
      await ambassador.getAddress()
    );
    await manager.connect(owner).finalizeAutonomy();
  });

  it("accrues NXL when distribution fails and later allows claimNXL", async function () {
    await expect(
      manager.testAccrueNXL(
        buyer.address,
        ethers.parseEther("0.5"),
        PREMIUM_ID
      )
    ).to.emit(manager, "NXLAccrued");

    const claimableBefore = await manager.claimableNXL(buyer.address);
    expect(claimableBefore).to.equal(ethers.parseEther("0.5"));

    const product = await manager.products(PREMIUM_ID);
    expect(product.active).to.equal(false);

    expect(await nxl.rewarded(buyer.address)).to.equal(0n);

    await nxl.setFailDistribute(false);

    await expect(manager.connect(buyer).claimNXL())
      .to.emit(manager, "NXLClaimed")
      .withArgs(buyer.address, ethers.parseEther("0.5"));

    const claimableAfter = await manager.claimableNXL(buyer.address);
    expect(claimableAfter).to.equal(0n);

    expect(await nxl.rewarded(buyer.address)).to.equal(
      ethers.parseEther("0.5")
    );
  });
});