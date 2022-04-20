import { task } from "hardhat/config";

const contractAddress = "0xa783EFC9c98413603c343CD41eA947779462A2c3";

task("approve", "Allowing another user to withdraw tokens from your balance")
    .addParam("spender", "The address to give access to")
    .addParam("value", "Amount of tokens to allow for address")
    .setAction(async (taskArgs, hre) => {
        const { spender, cuurent, value } = taskArgs;
        const gtn = await hre.ethers.getContractAt("GrokToken", contractAddress);
        await gtn.approve(spender, value);
    });
