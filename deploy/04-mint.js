const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts()

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicTxn = await basicNft.mintNft()
    await basicTxn.wait(1)
    console.log(`Basic NFT index 0 has tokeURI: ${await basicNft.tokenURI(0)}`)

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsTxn = await randomIpfsNft.requestNft({
        value: mintFee.toString(),
    })
    const randomIpfsTxnReceipt = await randomIpfsTxn.wait(1)
    await new Promise(async (resolve, reject) => {
        setTimeout(
            () => reject("Timeout: 'NFTMinted' event did not fire"),
            300000
        )
        randomIpfsNft.once("NftMinted", async function () {
            console.log(
                `Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(
                    0
                )}`
            )
            resolve()
        })
        if (developmentChains.includes(network.name)) {
            const requestId =
                randomIpfsTxnReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
            await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                randomIpfsNft.address
            )
        }
    })

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgMintTxn = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicSvgMintTxn.wait(1)
    console.log(
        `Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`
    )
}
module.exports.tags = ["all", "mint"]
