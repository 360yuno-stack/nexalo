const { ethers } = require("hardhat");

describe("NexumManager BLACKBLOK stress (smoke)", function () {
  it("se ejecuta el test base", async () => {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer local:", deployer.address);
  });
});
