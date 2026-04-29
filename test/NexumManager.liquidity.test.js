const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployMocks() {
  const [
    deployer,
    founder,
    partner,
    feesReceiver,
    operationsService,
    auditFunds,
    buyer,
    investor,
    other
  ] = await ethers.getSigners();

  const StableMock = await ethers.getContractFactory("StableMock");
  const NXLMock = await ethers.getContractFactory("NXLMock");
  const ReferralMock = await ethers.getContractFactory("ReferralMock");
  const TreasuryMock = await ethers.getContractFactory("TreasuryMock");
  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");

  const stable = await StableMock.deploy();
  const nxl = await NXLMock.deploy();
  const referral = await ReferralMock.deploy();
  const treasury = await TreasuryMock.deploy();
  const vrf = await MockVRFCoordinator.deploy();

  return {
    signers: {
      deployer,
      founder,
      partner,
      feesReceiver,
      operationsService,
      auditFunds,
      buyer,
      investor,
      other
    },
    stable,
    nxl,
    referral,
    treasury,
    vrf
  };
}

async function deployManager(fixtures) {
  const { signers, stable, nxl, referral, treasury, vrf } = fixtures;
  const NexumManager = await ethers.getContractFactory("NexumManager");

  const manager = await NexumManager.deploy(
    await vrf.getAddress(),
    1,
    ethers.ZeroHash,
    await stable.getAddress(),
    await nxl.getAddress(),
    signers.founder.address,
    signers.partner.address,
    signers.feesReceiver.address,
    signers.operationsService.address,
    signers.auditFunds.address
  );

  await manager.setEcosystemAddresses(
    await treasury.getAddress(),
    await referral.getAddress(),
    signers.other.address
  );

  await manager.configureNXLTokenTreasury(await treasury.getAddress());
  await manager.finalizeAutonomy();

  return manager;
}

async function fundAndApprove(stable, user, spender, amount) {
  await stable.mint(user.address, amount);
  await stable.connect(user).approve(spender, amount);
}

async function fillFlashRound(manager, buyer) {
  const productId = 0;

  for (let start = 0; start < 1000; start += 10) {
    const tickets = [];
    for (let i = start; i < start + 10; i++) {
      tickets.push(i);
    }

    await manager.connect(buyer).buySpecificTickets(
      productId,
      tickets,
      ethers.ZeroAddress
    );
  }
}

describe("NexumManager - round liquidity settlement", function () {
  it("envia el 3% acumulado al founder cuando la ronda no tuvo inversores", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, vrf } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    const totalPaid = ethers.parseEther("1000");
    const expectedFounderImmediate = (totalPaid * 700n) / 10000n;
    const expectedFounderAtSettlement = (totalPaid * 300n) / 10000n;

    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);

    const founderBalanceBefore = await stable.balanceOf(signers.founder.address);
    await fillFlashRound(manager, signers.buyer);
    const founderBalanceAfterBuy = await stable.balanceOf(signers.founder.address);

    expect(founderBalanceAfterBuy - founderBalanceBefore).to.equal(expectedFounderImmediate);

    const roundAfterBuy = await manager.rounds(productId, roundId);
    const requestId = roundAfterBuy.vrfRequestId;
    expect(requestId).to.not.equal(0n);

    const founderClaimableBefore = await manager.claimableStable(signers.founder.address);
    await vrf.fulfill(await manager.getAddress(), requestId, 1);
    const founderClaimableAfter = await manager.claimableStable(signers.founder.address);

    expect(founderClaimableAfter - founderClaimableBefore).to.equal(expectedFounderAtSettlement);
  });

  it("devuelve principal mas profit al inversor cuando si hay liquidez en la ronda", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, vrf } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    const liquidityAmount = ethers.parseEther("100");
    await fundAndApprove(stable, signers.investor, await manager.getAddress(), liquidityAmount);
    await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, liquidityAmount);

    const investorPos = await manager.getInvestorPosition(
      productId,
      roundId,
      signers.investor.address
    );

    expect(investorPos.principal).to.equal(liquidityAmount);

    const totalPaid = ethers.parseEther("1000");
    const expectedInvestorProfit = (totalPaid * 300n) / 10000n;

    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);
    await fillFlashRound(manager, signers.buyer);

    const roundAfterBuy = await manager.rounds(productId, roundId);
    const requestId = roundAfterBuy.vrfRequestId;
    expect(requestId).to.not.equal(0n);

    const investorClaimableBefore = await manager.claimableStable(signers.investor.address);
    await vrf.fulfill(await manager.getAddress(), requestId, 3);
    const investorClaimableAfter = await manager.claimableStable(signers.investor.address);

    expect(investorClaimableAfter - investorClaimableBefore).to.equal(
      liquidityAmount + expectedInvestorProfit
    );

    const founderClaimable = await manager.claimableStable(signers.founder.address);
    expect(founderClaimable).to.equal(0n);
  });

it("recorta el overfunding al liquidityTarget exacto", async function () {
  const fixtures = await deployMocks();
  const { signers, stable } = fixtures;
  const manager = await deployManager(fixtures);

  const productId = 0;
  const roundId = await manager.currentRound(productId);

  const sentAmount = ethers.parseEther("150");
  const target = ethers.parseEther("100");

  await fundAndApprove(stable, signers.investor, await manager.getAddress(), sentAmount);

  const investorBalanceBefore = await stable.balanceOf(signers.investor.address);
  await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, sentAmount);
  const investorBalanceAfter = await stable.balanceOf(signers.investor.address);

  const status = await manager.getRoundLiquidityStatus(productId, roundId);
  const pos = await manager.getInvestorPosition(productId, roundId, signers.investor.address);
  const investors = await manager.getRoundInvestors(productId, roundId);

  expect(investorBalanceBefore - investorBalanceAfter).to.equal(target);
  expect(status.liquidityTarget).to.equal(target);
  expect(status.liquidityFunded).to.equal(target);
  expect(status.progressBps).to.equal(10000n);
  expect(pos.principal).to.equal(target);
  expect(investors.length).to.equal(1);
  expect(investors[0]).to.equal(signers.investor.address);
});

it("acumula principal cuando el mismo inversor aporta dos veces", async function () {
  const fixtures = await deployMocks();
  const { signers, stable } = fixtures;
  const manager = await deployManager(fixtures);

  const productId = 0;
  const roundId = await manager.currentRound(productId);

  const firstAmount = ethers.parseEther("30");
  const secondAmount = ethers.parseEther("20");
  const total = firstAmount + secondAmount;

  await fundAndApprove(stable, signers.investor, await manager.getAddress(), total);

  await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, firstAmount);
  await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, secondAmount);

  const status = await manager.getRoundLiquidityStatus(productId, roundId);
  const pos = await manager.getInvestorPosition(productId, roundId, signers.investor.address);
  const investors = await manager.getRoundInvestors(productId, roundId);

  expect(status.liquidityFunded).to.equal(total);
  expect(status.investorsCount).to.equal(1n);
  expect(pos.principal).to.equal(total);
  expect(pos.fundedProgressBps).to.equal(5000n);
  expect(investors.length).to.equal(1);
  expect(investors[0]).to.equal(signers.investor.address);
});

  it("reparte principal y profit proporcional entre multiples inversores", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, vrf } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    const inv1Liquidity = ethers.parseEther("25");
    const inv2Liquidity = ethers.parseEther("75");

    await fundAndApprove(stable, signers.investor, await manager.getAddress(), inv1Liquidity);
    await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, inv1Liquidity);

    await fundAndApprove(stable, signers.other, await manager.getAddress(), inv2Liquidity);
    await manager.connect(signers.other).provideRoundLiquidity(productId, roundId, inv2Liquidity);

    const totalPaid = ethers.parseEther("1000");
    const totalProfitPool = (totalPaid * 300n) / 10000n;
    const totalPrincipal = inv1Liquidity + inv2Liquidity;

    const expectedInv1Profit = (totalProfitPool * inv1Liquidity) / totalPrincipal;
    const expectedInv2Profit = totalProfitPool - expectedInv1Profit;

    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);
    await fillFlashRound(manager, signers.buyer);

    const roundAfterBuy = await manager.rounds(productId, roundId);
    const requestId = roundAfterBuy.vrfRequestId;
    expect(requestId).to.not.equal(0n);

    const inv1Before = await manager.claimableStable(signers.investor.address);
    const inv2Before = await manager.claimableStable(signers.other.address);

    await vrf.fulfill(await manager.getAddress(), requestId, 5);

    const inv1After = await manager.claimableStable(signers.investor.address);
    const inv2After = await manager.claimableStable(signers.other.address);

    expect(inv1After - inv1Before).to.equal(inv1Liquidity + expectedInv1Profit);
    expect(inv2After - inv2Before).to.equal(inv2Liquidity + expectedInv2Profit);

    const founderClaimable = await manager.claimableStable(signers.founder.address);
    expect(founderClaimable).to.equal(0n);
  });

  it("liquida correctamente con liquidez parcial y no envia el profit al founder", async function () {
    const fixtures = await deployMocks();
    const { signers, stable, vrf } = fixtures;
    const manager = await deployManager(fixtures);

    const productId = 0;
    const roundId = await manager.currentRound(productId);

    const partialLiquidity = ethers.parseEther("40");
    await fundAndApprove(stable, signers.investor, await manager.getAddress(), partialLiquidity);
    await manager.connect(signers.investor).provideRoundLiquidity(productId, roundId, partialLiquidity);

    const liquidityStatusBefore = await manager.getRoundLiquidityStatus(productId, roundId);

    expect(liquidityStatusBefore.liquidityTarget).to.equal(ethers.parseEther("100"));
    expect(liquidityStatusBefore.liquidityFunded).to.equal(partialLiquidity);
    expect(liquidityStatusBefore.liquidityProfitPool).to.equal(0n);
    expect(liquidityStatusBefore.liquiditySettled).to.equal(false);

    const totalPaid = ethers.parseEther("1000");
    const expectedProfit = (totalPaid * 300n) / 10000n;

    await fundAndApprove(stable, signers.buyer, await manager.getAddress(), totalPaid);
    await fillFlashRound(manager, signers.buyer);

    const roundAfterBuy = await manager.rounds(productId, roundId);
    const requestId = roundAfterBuy.vrfRequestId;
    expect(requestId).to.not.equal(0n);

    const investorClaimableBefore = await manager.claimableStable(signers.investor.address);
    const founderClaimableBefore = await manager.claimableStable(signers.founder.address);

    await vrf.fulfill(await manager.getAddress(), requestId, 7);

    const investorClaimableAfter = await manager.claimableStable(signers.investor.address);
    const founderClaimableAfter = await manager.claimableStable(signers.founder.address);

    expect(investorClaimableAfter - investorClaimableBefore).to.equal(
      partialLiquidity + expectedProfit
    );
    expect(founderClaimableAfter - founderClaimableBefore).to.equal(0n);

    const liquidityStatusAfter = await manager.getRoundLiquidityStatus(productId, roundId);

    expect(liquidityStatusAfter.liquidityFunded).to.equal(partialLiquidity);
    expect(liquidityStatusAfter.liquidityProfitPool).to.equal(expectedProfit);
    expect(liquidityStatusAfter.liquidityReturnedPrincipal).to.equal(partialLiquidity);
    expect(liquidityStatusAfter.liquiditySettled).to.equal(true);
  });
});