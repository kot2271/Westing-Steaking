import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Vesting } from "../typechain";

task("withdrawTokens", "Withdraw tokens from the vesting contract")
  .addParam("contract", "Vesting contract address")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const vesting: Vesting = <Vesting>(
        await hre.ethers.getContractAt("Vesting", taskArgs.contract as string)
      );
      await vesting.withdrawTokens();

      const filter = vesting.filters.TokensWithdrawn();
      const events = await vesting.queryFilter(filter);
      const txAccount = events[0].args["account"];
      const txAmount = events[0].args["amount"];

      const amountEth = hre.ethers.utils.formatEther(txAmount);

      console.log(
        `The account ${txAccount} has withdrawn their ${amountEth} tokens from the vesting contract ${vesting.address}`
      );
    }
  );
