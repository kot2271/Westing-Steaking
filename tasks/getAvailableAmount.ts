import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { Vesting } from "../typechain";

task(
  "getAvailableAmount",
  "Get available amount of tokens for a specific account"
)
  .addParam("contract", "Vesting contract address")
  .addParam("account", "Account address")
  .setAction(
    async (
      taskArgs: TaskArguments,
      hre: HardhatRuntimeEnvironment
    ): Promise<void> => {
      const vesting: Vesting = <Vesting>(
        await hre.ethers.getContractAt("Vesting", taskArgs.contract as string)
      );
      const account = taskArgs.account;
      const availableAmount = await vesting.getAvailableAmount(account);

      const amountEth = hre.ethers.utils.formatEther(availableAmount);

      console.log(
        `The available amount of tokens for the account ${account} is ${amountEth}`
      );
    }
  );
