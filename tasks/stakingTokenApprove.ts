import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { StakingToken } from "../typechain";

task("stakingTokenApprove", "Approve spending of tokens")
  .addParam("token", "Token address")
  .addParam("spender", "Spender address")
  .addParam("amount", "Amount to approve")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const stakingToken: StakingToken = <StakingToken>(
        await hre.ethers.getContractAt("StakingToken", taskArgs.token as string)
      );
      const spender = taskArgs.spender;
      const amount = hre.ethers.utils.parseEther(taskArgs.amount);
      await stakingToken.approve(spender, amount);

      const owner = await stakingToken.owner();

      const ethValue = hre.ethers.utils.formatEther(amount);

      console.log(
        `The owner ${owner} approved the spender ${spender} to spend ${ethValue} StakingToken's`
      );
    }
  );
