import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Staking } from "../typechain";

task("withdraw", "Withdraw tokens from the staking contract")
  .addParam("contract", "Staking contract address")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const staking: Staking = <Staking>(
        await hre.ethers.getContractAt("Staking", taskArgs.contract as string)
      );
      await staking.withdraw();

      const filter = staking.filters.Withdraw();
      const events = await staking.queryFilter(filter);
      const txUser = events[0].args["user"];
      const txAmount = events[0].args["amount"];

      const amountEth = hre.ethers.utils.formatEther(txAmount);

      console.log(
        `Staker ${txUser} has withdrawn their ${amountEth} StakingToken's from the staking contract ${staking.address}`
      );
    }
  );
