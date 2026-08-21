const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const HASH = ethers.keccak256(ethers.toUtf8Bytes("dummy-property-document-v1"));

async function deployFixture() {
  const [authority, ownerA, buyerB, unauthorized] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("LandRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();
  return { registry, authority, ownerA, buyerB, unauthorized };
}

async function register(registry, owner) {
  return registry.registerProperty(
    1,
    "P-001",
    "Lucknow Synthetic Zone",
    1200,
    "Residential",
    owner.address,
    HASH
  );
}

describe("LandRegistry", function () {
  it("sets the deployer as authority", async function () {
    const { registry, authority } = await deployFixture();
    expect(await registry.authority()).to.equal(authority.address);
  });

  it("authority registers a property", async function () {
    const { registry, authority, ownerA } = await deployFixture();
    await expect(register(registry, ownerA))
      .to.emit(registry, "PropertyRegistered")
      .withArgs(1, "P-001", ownerA.address, HASH);

    const p = await registry.getProperty(1);
    expect(p.currentOwner).to.equal(ownerA.address);
    expect(p.verified).to.equal(false);
    expect(p.propertyId).to.equal(1);
    expect(await registry.getPropertiesByOwner(ownerA.address)).to.deep.equal([1n]);
  });

  it("rejects duplicate property IDs", async function () {
    const { registry, ownerA } = await deployFixture();
    await register(registry, ownerA);
    await expect(register(registry, ownerA)).to.be.revertedWith("Property ID already exists");
  });

  it("rejects zero owner", async function () {
    const { registry } = await deployFixture();
    await expect(
      registry.registerProperty(1, "P-001", "Location", 100, "Residential", ethers.ZeroAddress, HASH)
    ).to.be.revertedWith("Owner cannot be zero address");
  });

  it("rejects unauthorized registration", async function () {
    const { registry, ownerA, unauthorized } = await deployFixture();
    await expect(
      registry.connect(unauthorized).registerProperty(
        1, "P-001", "Location", 100, "Residential", ownerA.address, HASH
      )
    ).to.be.revertedWith("Only authority can perform this action");
  });

  it("authority verifies a property", async function () {
    const { registry, ownerA, authority } = await deployFixture();
    await register(registry, ownerA);
    await expect(registry.verifyProperty(1))
      .to.emit(registry, "PropertyVerified")
      .withArgs(1, authority.address);

    const p = await registry.getProperty(1);
    expect(p.verified).to.equal(true);
    expect(p.status).to.equal(1n); // VERIFIED
  });

  it("rejects unauthorized verification", async function () {
    const { registry, ownerA, unauthorized } = await deployFixture();
    await register(registry, ownerA);
    await expect(registry.connect(unauthorized).verifyProperty(1))
      .to.be.revertedWith("Only authority can perform this action");
  });

  it("requires verification before transfer", async function () {
    const { registry, ownerA, buyerB } = await deployFixture();
    await register(registry, ownerA);
    await expect(registry.connect(ownerA).transferOwnership(1, buyerB.address))
      .to.be.revertedWith("Property must be verified before transfer");
  });

  it("transfers ownership and updates owner lists", async function () {
    const { registry, ownerA, buyerB } = await deployFixture();
    await register(registry, ownerA);
    await registry.verifyProperty(1);

    await expect(registry.connect(ownerA).transferOwnership(1, buyerB.address))
      .to.emit(registry, "OwnershipTransferred")
      .withArgs(1, ownerA.address, buyerB.address, anyValue);

    const p = await registry.getProperty(1);
    expect(p.currentOwner).to.equal(buyerB.address);
    expect(p.previousOwner).to.equal(ownerA.address);
    expect(p.status).to.equal(3n); // TRANSFERRED
    expect(await registry.getPropertiesByOwner(ownerA.address)).to.deep.equal([]);
    expect(await registry.getPropertiesByOwner(buyerB.address)).to.deep.equal([1n]);
  });

  it("rejects non-owner transfer", async function () {
    const { registry, ownerA, buyerB, unauthorized } = await deployFixture();
    await register(registry, ownerA);
    await registry.verifyProperty(1);
    await expect(registry.connect(unauthorized).transferOwnership(1, buyerB.address))
      .to.be.revertedWith("Caller is not current owner");
  });

  it("rejects zero new owner", async function () {
    const { registry, ownerA } = await deployFixture();
    await register(registry, ownerA);
    await registry.verifyProperty(1);
    await expect(registry.connect(ownerA).transferOwnership(1, ethers.ZeroAddress))
      .to.be.revertedWith("New owner cannot be zero address");
  });

  it("rejects transfer of an invalid property", async function () {
    const { registry, ownerA } = await deployFixture();
    await expect(registry.connect(ownerA).transferOwnership(999, ownerA.address))
      .to.be.revertedWith("Property does not exist");
  });

  it("rejects old owner from transferring after ownership changes", async function () {
    const { registry, ownerA, buyerB } = await deployFixture();
    await register(registry, ownerA);
    await registry.verifyProperty(1);
    await registry.connect(ownerA).transferOwnership(1, buyerB.address);
    await expect(registry.connect(ownerA).transferOwnership(1, ownerA.address))
      .to.be.revertedWith("Caller is not current owner");
  });

  it("preserves the document hash", async function () {
    const { registry, ownerA } = await deployFixture();
    await register(registry, ownerA);
    const p = await registry.getProperty(1);
    expect(p.documentHash).to.equal(HASH);
  });

  it("updates status through authority", async function () {
    const { registry, ownerA } = await deployFixture();
    await register(registry, ownerA);
    await registry.verifyProperty(1);
    await expect(registry.updatePropertyStatus(1, 4)) // DISPUTED
      .to.emit(registry, "PropertyStatusUpdated");
    const p = await registry.getProperty(1);
    expect(p.status).to.equal(4n);
  });
});

