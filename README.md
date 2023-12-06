# Vesting & Staking

## Installation

Clone the repository using the following command:
Install the dependencies using the following command:
```shell
npm i
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (polygon-mumbai):
```shell
npx hardhat run scripts/deploy/stakingDeploy.ts --network polygonMumbai
```
```shell
npx hardhat run scripts/deploy/vestingDeploy.ts --network polygonMumbai
```

## Verify

Verify the installation by running the following command:
```shell
npx hardhat verify --network polygonMumbai {CONTRACT_ADDRESS}
```

## Tasks

Create a new task(s) and save it(them) in the folder "tasks". Add a new task_name in the file "tasks/index.ts"

Running a stakingTokenTransfer task:
```shell
npx hardhat stakingTokenTransfer --token {TOKEN_ADDRESS} --to {RECIPIENT_ADDRESS} --amount {AMOUNT_IN_ETHER} --network polygonMumbai
```

Running a stakingTokenApprove task:
```shell
npx hardhat stakingTokenApprove --token {TOKEN_ADDRESS} --spender {SPENDER_ADDRESS} --amount {AMOUNT_IN_ETHER} --network polygonMumbai
```
### Staking Contract

Running a deposit task:
```shell
npx hardhat deposit --contract {STAKING_CONTRACT} --amount {AMOUNT_IN_ETHER} --network polygonMumbai
```

Running a rewardTokenTransfer task:
```shell
npx hardhat rewardTokenTransfer --token {TOKEN_ADDRESS} --to {RECIPIENT_ADDRESS} --amount {AMOUNT_IN_ETHER} --network polygonMumbai
```

Running a claimRewards task:
```shell
npx hardhat claimRewards --contract {STAKING_CONTRACT} --network polygonMumbai
```

Running a withdraw task:
```shell
npx hardhat withdraw --contract {STAKING_CONTRACT} --network polygonMumbai
```

### Vesting Contract

Running a distributeRights task:
```shell
npx hardhat distributeRights --contract {VESTING_CONTRACT} --account {ACCOUNT_ADDRESS} --amount {AMOUNT_IN_ETHER} --network polygonMumbai
```

Running a getAvailableAmount task:
```shell
npx hardhat getAvailableAmount --contract {VESTING_CONTRACT} --account {ACCOUNT_ADDRESS} --network polygonMumbai
```

Running a withdrawTokens task:
```shell
npx hardhat withdrawTokens --contract {VESTING_CONTRACT} --network polygonMumbai
```