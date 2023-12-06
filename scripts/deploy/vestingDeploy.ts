import { getNamedAccounts, deployments } from "hardhat";
import { verify } from "../helpers/verify";
import { Address } from "hardhat-deploy/dist/types";


const CONTRACT_NAME: string = "Vesting";
const TOKEN_ADDRESS: Address = "0x462cEF234707C9a4Bd9149dF47Df48344773B14F"

async function deployFunction() {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [TOKEN_ADDRESS];
  const vestingContract = await deploy(CONTRACT_NAME, {
    from: deployer,
    log: true,
    args: args,
    waitConfirmations: 6,
  });
  console.log(`${CONTRACT_NAME} deployed at: ${vestingContract.address}`);
  await verify(vestingContract.address, args);
}

deployFunction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
