const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Tests", function () {
          let randomIpfsNft, mintFee, vrfCoordinatorV2Mock, deployer, requestor
          const TOKEN_URI_1 =
              "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo"
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              requestor = (await getNamedAccounts()).requestor
              await deployments.fixture("all")
              randomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              )
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              mintFee = await randomIpfsNft.getMintFee()
          })

          describe("constructor", function () {
              it("Initializes VRF and ERC721 correctly", async function () {
                  const tokenName = await randomIpfsNft.name()
                  const tokenSymbol = await randomIpfsNft.symbol()
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const mintFeeFromContract = await randomIpfsNft.getMintFee()
                  const firstTokenUri = await randomIpfsNft.getDogTokenUris(0)
                  assert.equal(tokenName, "Random IPFS NFT")
                  assert.equal(tokenSymbol, "RIN")
                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(
                      mintFeeFromContract.toString(),
                      "10000000000000000"
                  )
                  assert.equal(firstTokenUri, TOKEN_URI_1)
              })
          })

          describe("requestNft", function () {
              it("fails to request when mintFee is less than expected", async function () {
                  const lessMintFee = "1000000000000000" // 0.001 ETH
                  await expect(
                      randomIpfsNft.requestNft({ value: lessMintFee })
                  ).to.be.revertedWith("RandomIpfsNFT__NeedMoreETHSent")
              })
              it("emits an event when NFT is requested", async function () {
                  await expect(
                      randomIpfsNft.requestNft({ value: mintFee })
                  ).to.emit(randomIpfsNft, "NftRequested")
              })
              it("save requestId and address mapping when NFT is requested", async function () {
                  const txnResponse = await randomIpfsNft.requestNft({
                      value: mintFee,
                  })
                  const txnReceipt = await txnResponse.wait(1)
                  const requestId = txnReceipt.events[1].args.requestId
                  const addressFromContract =
                      await randomIpfsNft.s_requestIdToSender(requestId)
                  assert.equal(addressFromContract, deployer)
              })
              it("emits a minted event when NFT is request and fulfillRandomWords called", async function () {
                  expect(
                      await randomIpfsNft.requestNft({ value: mintFee })
                  ).to.emit(randomIpfsNft, "NftMinted")
              })
          })
          describe("fulfillRandomwords", function () {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async function () {
                          try {
                              const ownerAddress = await randomIpfsNft.ownerOf(
                                  0
                              )
                              assert.equal(ownerAddress, deployer)
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter()
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              assert.equal(
                                  tokenUri.toString().includes("ipfs://"),
                                  true
                              )
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // fulfillRandomWords or requestNft
                      try {
                          const txnResponse = await randomIpfsNft.requestNft({
                              value: mintFee,
                          })
                          const txnReceipt = await txnResponse.wait(1)
                          const requestId = txnReceipt.events[1].args.requestId
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
          describe("getBreedFromModdedRng", function () {
              it("returns St.bernard for 80", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(80)
                  assert.equal(breed, 2)
              })
              it("returns Shiba-inu for 20", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(20)
                  assert.equal(breed, 1)
              })
              it("returns Pug for 5", async function () {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(5)
                  assert.equal(breed, 0)
              })
              it("reverts with error for number greater than 99", async function () {
                  await expect(
                      randomIpfsNft.getBreedFromModdedRng(100)
                  ).to.be.revertedWith("RandomIpfsNft__RangeOutOfBounds")
              })
          })
      })
