import { getNamedAccounts, deployments } from "hardhat";
import { verify } from "../helpers/verify";
import { Address } from "hardhat-deploy/dist/types";
import { BigNumber } from "ethers";

const CONTRACT_NAME: string = "Staking";
const DEPOSIT_TOKEN: Address = "0x5A6806908f1652a394EC53EC0934DA67dC0B5a6a";
const REWARD_TOKEN: Address = "0x2FE4eaB8BbBE1C6097C3f63b470B7C17eBBf1F8D";
const LOCK_PERIOD: BigNumber = BigNumber.from(7776000);
const REWARD_RATE: BigNumber = BigNumber.from(30);

async function deployFunction() {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [DEPOSIT_TOKEN, REWARD_TOKEN, LOCK_PERIOD, REWARD_RATE];
  const stakingContract = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: 6,
  });
  console.log(`${CONTRACT_NAME} deployed at: ${stakingContract.address}`);
  await verify(stakingContract.address, args);
}

deployFunction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
