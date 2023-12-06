import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Staking } from "../typechain";

task("claimRewards", "Claim rewards from the staking contract")
  .addParam("contract", "Staking contract address")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const staking: Staking = <Staking>(
        await hre.ethers.getContractAt("Staking", taskArgs.contract as string)
      );
      await staking.claimRewards();

      const filter = staking.filters.Claim();
      const events = await staking.queryFilter(filter);
      const txUser = events[0].args["user"];
      const txAmount = events[0].args["amount"];

      const amountEth = hre.ethers.utils.formatEther(txAmount);

      console.log(
        `Staker ${txUser} has claimed rewards ${amountEth} RewardToken's from the staking contract ${staking.address}`
      );
    }
  );
