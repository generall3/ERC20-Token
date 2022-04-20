import {ethers} from "hardhat";

async function main() {
    const GrokToken = await ethers.getContractFactory("GrokToken");
    const gtn = await GrokToken.deploy();

    await gtn.deployed();

    console.log("ERC20 deployed to: ", gtn.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });