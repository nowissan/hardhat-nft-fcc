const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Unit Tests", function () {
          let basicNft
          const TOKEN_URI =
              "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNft", deployer)
          })

          describe("constructor", function () {
              it("initialized the basicNft correctly", async function () {
                  const tokenName = await basicNft.name()
                  const tokenSymbol = await basicNft.symbol()
                  const initialTokenCounter = await basicNft.getTokenCounter()
                  assert.equal(tokenName, "Dogie")
                  assert.equal(tokenSymbol, "DOG")
                  assert.equal(initialTokenCounter.toString(), "0")
              })
          })

          describe("mintNft", function () {
              beforeEach(async function () {
                  const txn = await basicNft.mintNft()
                  await txn.wait(1)
              })
              it("can mint NFT", async function () {
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(tokenCounter.toString(), "1")
              })
              it("return correct tokenURI", async function () {
                  const tokenURI = await basicNft.tokenURI(0)
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })

              it("show the correct balance and owner of an NFT", async function () {
                  const balance = await basicNft.balanceOf(deployer)
                  const owner = await basicNft.ownerOf("0")
                  assert.equal(balance.toString(), "1")
                  assert.equal(owner, deployer)
              })
          })
      })
