const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("NXLToken - Tests Exhaustivos", function () {
    let nxl, owner, founder, partner, nexumManager, user1, user2;

    beforeEach(async function () {
        [owner, founder, partner, nexumManager, user1, user2] = await ethers.getSigners();

        const NXLToken = await ethers.getContractFactory("NXLToken");
        nxl = await NXLToken.deploy(founder.address, partner.address);
        await nxl.waitForDeployment();

        await nxl.setNexumManager(nexumManager.address);
    });

    describe("1. Deployment y Configuración Inicial", function () {
        it("Debe tener 100M de supply total", async function () {
            const totalSupply = await nxl.totalSupply();
            expect(totalSupply).to.equal(ethers.parseEther("100000000"));
        });

        it("Debe tener 96M disponibles para rewards", async function () {
            const info = await nxl.getTokenInfo();
            expect(info[2]).to.equal(ethers.parseEther("96000000"));
        });

        it("Debe tener 3M reservados para Founder", async function () {
            const info = await nxl.getTokenInfo();
            expect(info[4]).to.equal(ethers.parseEther("3000000"));
        });

        it("Debe tener 1M reservados para Partner", async function () {
            const info = await nxl.getTokenInfo();
            expect(info[7]).to.equal(ethers.parseEther("1000000"));
        });

        it("Debe tener NexumManager configurado", async function () {
            expect(await nxl.nexumManager()).to.equal(nexumManager.address);
        });

        it("No debe permitir configurar NexumManager dos veces", async function () {
            await expect(
                nxl.setNexumManager(user1.address)
            ).to.be.revertedWith("NexumManager already set");
        });
    });

    describe("2. Distribución de Rewards", function () {
        it("Solo NexumManager puede distribuir rewards", async function () {
            await expect(
                nxl.connect(user1).distributeReward(user2.address, ethers.parseEther("100"))
            ).to.be.revertedWith("Only NexumManager");
        });

        it("Debe distribuir rewards correctamente", async function () {
            const amount = ethers.parseEther("1000");
            await nxl.connect(nexumManager).distributeReward(user1.address, amount);
            
            expect(await nxl.balanceOf(user1.address)).to.equal(amount);
        });

        it("Debe actualizar rewardsDistributed después de distribuir", async function () {
            const amount = ethers.parseEther("1000");
            await nxl.connect(nexumManager).distributeReward(user1.address, amount);
            
            const info = await nxl.getTokenInfo();
            expect(info[3]).to.equal(amount);
        });

        it("Debe reducir availableRewards después de distribuir", async function () {
            const amount = ethers.parseEther("1000");
            const infoBefore = await nxl.getTokenInfo();
            const availableBefore = infoBefore[2];
            
            await nxl.connect(nexumManager).distributeReward(user1.address, amount);
            
            const infoAfter = await nxl.getTokenInfo();
            expect(infoAfter[2]).to.equal(availableBefore - amount);
        });

        it("No debe distribuir más de los rewards disponibles", async function () {
            const tooMuch = ethers.parseEther("97000000");
            await expect(
                nxl.connect(nexumManager).distributeReward(user1.address, tooMuch)
            ).to.be.revertedWith("Insufficient rewards available");
        });
    });

    describe("3. Vesting de Founder (2 años)", function () {
        it("Founder no debe tener tokens disponibles al inicio", async function () {
            const available = await nxl.getFounderAvailable();
            expect(available).to.be.lt(ethers.parseEther("0.01"));
        });

        it("Founder debe tener tokens disponibles después de 1 año (50%)", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            const available = await nxl.getFounderAvailable();
            const expected = ethers.parseEther("1500000");
            expect(available).to.be.closeTo(expected, ethers.parseEther("10000"));
        });

        it("Founder debe tener todos los tokens después de 2 años", async function () {
            await time.increase(730 * 24 * 60 * 60);
            
            const available = await nxl.getFounderAvailable();
            expect(available).to.be.closeTo(ethers.parseEther("3000000"), ethers.parseEther("10000"));
        });

        it("Founder puede retirar tokens disponibles", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            const balanceBefore = await nxl.balanceOf(founder.address);
            await nxl.connect(founder).founderWithdraw();
            const balanceAfter = await nxl.balanceOf(founder.address);
            
            expect(balanceAfter).to.be.gt(balanceBefore);
            expect(balanceAfter).to.be.gt(ethers.parseEther("1400000"));
        });

        it("Solo Founder puede retirar sus tokens", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            await expect(
                nxl.connect(user1).founderWithdraw()
            ).to.be.revertedWith("Only founder");
        });

        it("No debe permitir retirar sin tokens disponibles", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            await nxl.connect(founder).founderWithdraw();
            
            await expect(
                nxl.connect(founder).founderWithdraw()
            ).to.be.revertedWith("No tokens available");
        });
    });

    describe("4. Vesting de Partner (1 año)", function () {
        it("Partner no debe tener tokens disponibles al inicio", async function () {
            const available = await nxl.getPartnerAvailable();
            expect(available).to.be.lt(ethers.parseEther("0.01"));
        });

        it("Partner debe tener tokens disponibles después de 6 meses (50%)", async function () {
            await time.increase(182 * 24 * 60 * 60);
            
            const available = await nxl.getPartnerAvailable();
            const expected = ethers.parseEther("500000");
            expect(available).to.be.closeTo(expected, ethers.parseEther("10000"));
        });

        it("Partner debe tener todos los tokens después de 1 año", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            const available = await nxl.getPartnerAvailable();
            expect(available).to.be.closeTo(ethers.parseEther("1000000"), ethers.parseEther("10000"));
        });

        it("Partner puede retirar tokens disponibles", async function () {
            await time.increase(182 * 24 * 60 * 60);
            
            const balanceBefore = await nxl.balanceOf(partner.address);
            await nxl.connect(partner).partnerWithdraw();
            const balanceAfter = await nxl.balanceOf(partner.address);
            
            expect(balanceAfter).to.be.gt(balanceBefore);
            expect(balanceAfter).to.be.gt(ethers.parseEther("490000"));
        });

        it("Solo Partner puede retirar sus tokens", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            await expect(
                nxl.connect(user1).partnerWithdraw()
            ).to.be.revertedWith("Only partner");
        });
    });

    describe("5. Quema de Tokens", function () {
        it("Solo NexumManager puede quemar tokens no distribuidos", async function () {
            await expect(
                nxl.connect(user1).burnUndistributed(ethers.parseEther("1000"))
            ).to.be.revertedWith("Only NexumManager");
        });

        it("Debe quemar tokens correctamente", async function () {
            const amount = ethers.parseEther("1000");
            const supplyBefore = await nxl.totalSupply();
            
            await nxl.connect(nexumManager).burnUndistributed(amount);
            
            const supplyAfter = await nxl.totalSupply();
            expect(supplyAfter).to.equal(supplyBefore - amount);
        });

        it("Cualquiera puede quemar sus propios tokens", async function () {
            await nxl.connect(nexumManager).distributeReward(user1.address, ethers.parseEther("1000"));
            
            const balanceBefore = await nxl.balanceOf(user1.address);
            await nxl.connect(user1).burn(ethers.parseEther("500"));
            
            expect(await nxl.balanceOf(user1.address)).to.equal(balanceBefore - ethers.parseEther("500"));
        });
    });

    describe("6. Integridad del Sistema", function () {
        it("La suma de balances debe ser igual al supply", async function () {
            const contractBalance = await nxl.balanceOf(await nxl.getAddress());
            const totalSupply = await nxl.totalSupply();
            
            expect(contractBalance).to.equal(totalSupply);
        });

        it("Los rewards disponibles deben respetar el vesting", async function () {
            await time.increase(365 * 24 * 60 * 60);
            
            const info = await nxl.getTokenInfo();
            const contractBalance = info[1];
            const availableRewards = info[2];
            const founderReserved = ethers.parseEther("3000000") - info[5];
            const partnerReserved = ethers.parseEther("1000000") - info[8];
            
            const expected = contractBalance - founderReserved - partnerReserved;
            expect(availableRewards).to.be.closeTo(expected, ethers.parseEther("1"));
        });
    });
});
