import { task } from "hardhat/config";

const contractAddress = "0xa783EFC9c98413603c343CD41eA947779462A2c3";

task("transferFrom", "Send tokens from another address")
    .addParam("from", "Address from where to send tokens")
    .addParam("to", "address where to send tokens")
    .addParam("value", "Amount of tokens to send")
    .setAction(async (taskArgs, hre) => {
        const { from, to, value } = taskArgs;
        const gtn = await hre.ethers.getContractAt("GrokToken", contractAddress);
        await gtn.transferFrom(from, to, value);
    });