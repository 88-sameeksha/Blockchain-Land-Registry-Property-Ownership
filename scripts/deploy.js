const hre = require("hardhat");

async function main() {
  const LandRegistry = await hre.ethers.getContractFactory("LandRegistry");
  const registry = await LandRegistry.deploy();
  await registry.waitForDeployment();

  console.log("LandRegistry deployed to:", await registry.getAddress());
  console.log("Authority:", await registry.authority());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
