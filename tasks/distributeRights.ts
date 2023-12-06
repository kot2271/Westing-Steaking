import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Vesting } from "../typechain";

task("distributeRights", "Distribute rights of tokens to a specific account")
  .addParam("contract", "Vesting contract address")
  .addParam("account", "Account address")
  .addParam("amount", "Amount of rights")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const vesting: Vesting = <Vesting>(
        await hre.ethers.getContractAt("Vesting", taskArgs.contract as string)
      );
      const account = taskArgs.account;
      const amount = hre.ethers.utils.parseEther(taskArgs.amount);
      await vesting.distributeRights(account, amount);

      const filter = vesting.filters.RightsDistributed();
      const events = await vesting.queryFilter(filter);
      const txAccount = events[0].args["account"];
      const txAmount = events[0].args["amount"];

      const amountEth = hre.ethers.utils.formatEther(txAmount);

      const vestingOwner = await vesting.owner();

      console.log(
        `The owner ${vestingOwner} distributed rights of ${amountEth} tokens to the account ${txAccount}`
      );
    }
  );
