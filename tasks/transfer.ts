import { task } from "hardhat/config";

const contractAddress = "0xa783EFC9c98413603c343CD41eA947779462A2c3";

task("transfer", "Transfer tokens to address")
    .addParam("to", "Address where to send tokens")
    .addParam("value", "Amount of tokens to send")
    .setAction(async (taskArgs, hre) => {
        const { to, value } = taskArgs;
        const gtn = await hre.ethers.getContractAt("GrokToken", contractAddress);
        await gtn.transfer(to, value);
    });