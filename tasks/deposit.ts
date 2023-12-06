import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Staking } from "../typechain";

task("deposit", "Deposit tokens to the staking contract")
  .addParam("contract", "Staking contract address")
  .addParam("amount", "Amount to deposit")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const staking: Staking = <Staking>(
        await hre.ethers.getContractAt("Staking", taskArgs.contract as string)
      );
      const amount = hre.ethers.utils.parseEther(taskArgs.amount);
      await staking.deposit(amount);

      const filter = staking.filters.Deposit();
      const events = await staking.queryFilter(filter);
      const txUser = events[0].args["user"];
      const txAmount = events[0].args["amount"];

      const amountEth = hre.ethers.utils.formatEther(txAmount);

      console.log(
        `Staker ${txUser} has deposited ${amountEth} StakingToken's to the staking contract ${staking.address}`
      );
    }
  );
