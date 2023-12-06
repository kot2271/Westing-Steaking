import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { RewardToken } from "../typechain";

task("rewardTokenTransfer", "Transfer reward tokens to the address")
  .addParam("token", "Token address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount to transfer")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const rewardToken: RewardToken = <RewardToken>(
        await hre.ethers.getContractAt("RewardToken", taskArgs.token as string)
      );
      const addressTo = taskArgs.to;
      const amount = hre.ethers.utils.parseEther(taskArgs.amount);
      await rewardToken.transfer(addressTo, amount);

      const owner = await rewardToken.owner();
      const ethAmount = hre.ethers.utils.formatEther(amount);

      console.log(
        `From ${owner} transferred ${ethAmount} RewardToken's to ${addressTo}`
      );
    }
  );
