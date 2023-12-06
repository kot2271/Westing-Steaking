import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { StakingToken } from "../typechain";

task("stakingTokenTransfer", "Transfer staking tokens to the address")
  .addParam("token", "Token address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount to transfer")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const stakingToken: StakingToken = <StakingToken>(
        await hre.ethers.getContractAt("StakingToken", taskArgs.token as string)
      );
      const addressTo = taskArgs.to;
      const amount = hre.ethers.utils.parseEther(taskArgs.amount);
      await stakingToken.transfer(addressTo, amount);

      const owner = await stakingToken.owner();
      const ethAmount = hre.ethers.utils.formatEther(amount);

      console.log(
        `From ${owner} transferred ${ethAmount} StakingToken's to ${addressTo}`
      );
    }
  );
