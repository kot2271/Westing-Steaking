import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { Staking, Vesting, StakingToken, RewardToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Staking&Vesting", () => {
  let stakingContract: Staking;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let accounts: SignerWithAddress[];
  let rewardToken: RewardToken;
  let stakingToken: StakingToken;
  let lockPeriod: BigNumber;
  let rewardPercentage: BigNumber;
  let vestingContract: Vesting;

  const INITIAL_TOKENS_AMOUNT: BigNumber = ethers.utils.parseUnits(
    "10000000",
    "18"
  );
  const depositAmount = ethers.utils.parseEther("1");

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];

    const StakingToken = await ethers.getContractFactory("StakingToken");
    stakingToken = await StakingToken.deploy();

    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();

    lockPeriod = BigNumber.from(7776000);
    rewardPercentage = BigNumber.from(30);

    const Staking = await ethers.getContractFactory("Staking");
    stakingContract = await Staking.deploy(
      stakingToken.address,
      rewardToken.address,
      lockPeriod,
      rewardPercentage
    );
    await stakingContract.deployed();

    const Vesting = await ethers.getContractFactory("Vesting");
    vestingContract = await Vesting.deploy(rewardToken.address);
    await vestingContract.deployed();
  });

  describe("Initial params of token contracts", async () => {
    it("Initializes name, symbol and decimals correctly", async () => {
      expect(await stakingToken.name()).to.equal("StakingToken");
      expect(await stakingToken.symbol()).to.equal("STT");
      expect(await stakingToken.decimals()).to.equal(18);

      expect(await rewardToken.name()).to.equal("RewardToken");
      expect(await rewardToken.symbol()).to.equal("RWT");
      expect(await rewardToken.decimals()).to.equal(18);
    });

    it("should have the correct owner", async () => {
      expect(await stakingToken.owner()).to.equal(owner.address);
      expect(await rewardToken.owner()).to.equal(owner.address);
    });

    it("should have the correct initial total supply", async () => {
      expect(await stakingToken.totalSupply()).to.equal(INITIAL_TOKENS_AMOUNT);
      expect(await rewardToken.totalSupply()).to.equal(INITIAL_TOKENS_AMOUNT);
    });

    it("should have the correct initial balance for the owner", async () => {
      expect(await stakingToken.balanceOf(owner.address)).to.equal(
        INITIAL_TOKENS_AMOUNT
      );
      expect(await rewardToken.balanceOf(owner.address)).to.equal(
        INITIAL_TOKENS_AMOUNT
      );
    });

    describe("StakingToken", () => {
      describe("mint", () => {
        it("should mint stakingTokens", async () => {
          const balanceBefore = await stakingToken.balanceOf(owner.address);
          const amount = ethers.BigNumber.from(1000);
          await stakingToken.mint(owner.address, amount);
          const balanceAfter = await stakingToken.balanceOf(owner.address);

          expect(balanceAfter).to.equal(balanceBefore.add(amount));
        });

        it("should revert if not owner calls", async () => {
          const amount = ethers.BigNumber.from(100);

          await expect(
            stakingToken.connect(user1).mint(user1.address, amount)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });
    });

    describe("RewardToken", () => {
      describe("mint", () => {
        it("should mint rewardTokens", async () => {
          const balanceBefore = await rewardToken.balanceOf(owner.address);
          const amount = ethers.BigNumber.from(1000);
          await rewardToken.mint(owner.address, amount);
          const balanceAfter = await rewardToken.balanceOf(owner.address);

          expect(balanceAfter).to.equal(balanceBefore.add(amount));
        });

        it("should revert if not owner calls", async () => {
          const amount = ethers.BigNumber.from(100);

          await expect(
            rewardToken.connect(user1).mint(user1.address, amount)
          ).to.be.revertedWith("Ownable: caller is not the owner");
        });
      });
    });
  });

  describe("Staking Contract", () => {
    describe("deposit", () => {
      beforeEach(async () => {
        await stakingToken.transfer(user1.address, depositAmount);
        await stakingToken
          .connect(user1)
          .approve(stakingContract.address, depositAmount);
      });

      it("Should allows users to deposit tokens", async () => {
        await expect(stakingContract.connect(user1).deposit(depositAmount))
          .to.emit(stakingContract, "Deposit")
          .withArgs(user1.address, depositAmount);
      });

      it("Should allows users to deposit tokens with zero amount", async () => {
        await expect(
          stakingContract.connect(user1).deposit(0)
        ).to.be.revertedWithCustomError(
          stakingContract,
          "DepositAmountMustBeGreaterThanZero"
        );
      });
    });

    describe("claimRewards", () => {
      beforeEach(async () => {
        await stakingToken.transfer(user1.address, depositAmount);
        await rewardToken.transfer(stakingContract.address, depositAmount);

        await stakingToken
          .connect(user1)
          .approve(stakingContract.address, depositAmount);
      });

      it("Should allows users to claim rewards after lock period", async () => {
        await stakingContract.connect(user1).deposit(depositAmount);

        // advance time by 1 day
        await time.increase(lockPeriod.add(60 * 60 * 24));

        await expect(stakingContract.connect(user1).claimRewards())
          .to.emit(stakingContract, "Claim")
          .withArgs(
            user1.address,
            depositAmount.mul(rewardPercentage).div(100)
          ); // 30% reward
      });

      it("Should revert when lock period not ended", async () => {
        await stakingContract.connect(user1).deposit(depositAmount);

        // Попытка получить награду раньше времени
        await expect(
          stakingContract.connect(user1).claimRewards()
        ).to.be.revertedWithCustomError(stakingContract, "LockPeriodNotEnded");
      });

      it("Should revert when rewards has been received", async () => {
        await stakingContract.connect(user1).deposit(depositAmount);

        // advance time by 1 day
        await time.increase(lockPeriod.add(60 * 60 * 24));

        await stakingContract.connect(user1).claimRewards();

        // Повторная попытка
        await expect(
          stakingContract.connect(user1).claimRewards()
        ).to.be.revertedWithCustomError(
          stakingContract,
          "RewardsHasBeenReceived"
        );
      });
    });

    describe("withdraw", () => {
      beforeEach(async () => {
        await stakingToken.transfer(user1.address, depositAmount);
        await rewardToken.transfer(stakingContract.address, depositAmount);
        await stakingToken
          .connect(user1)
          .approve(stakingContract.address, depositAmount);
        await stakingContract.connect(user1).deposit(depositAmount);

        // advance time by 1 day
        await time.increase(lockPeriod.add(60 * 60 * 24));
        await stakingContract.connect(user1).claimRewards();
      });

      it("Should allows users to withdraw deposited tokens after claiming rewards", async () => {
        await expect(stakingContract.connect(user1).withdraw())
          .to.emit(stakingContract, "Withdraw")
          .withArgs(user1.address, depositAmount);
      });

      it("Should revert when claim rewards first", async () => {
        // Выводим депозит
        await expect(stakingContract.withdraw()).to.be.revertedWithCustomError(
          stakingContract,
          "ClaimRewardsFirst"
        );
      });
    });
  });

  describe("Vesting Contract", () => {
    describe("Deployment", () => {
      it("Should set the right owner", async () => {
        expect(await vestingContract.owner()).to.equal(
          await owner.getAddress()
        );
      });
    });

    describe("Vesting periods", () => {
      it("Should initialize vesting periods correctly", async () => {
        const periodCount = 4; // we know there are 4 periods from the contract initialization
        const expectedPercentages = [10, 30, 50, 100]; // expected percentages for each period

        for (let i = 0; i < periodCount; i++) {
          const period = await vestingContract.vestingPeriods(i);
          expect(period.percentage).to.equal(expectedPercentages[i]);
        }
      });
    });

    describe("distributeRights", () => {
      it("Should revert when claiming has started", async () => {
        await time.increaseTo(
          (await vestingContract.startTimestamp()).add(60 * 60 * 24 * 30)
        );
        await expect(
          vestingContract
            .connect(owner)
            .distributeRights(user1.getAddress(), depositAmount.mul(10))
        ).to.be.revertedWithCustomError(vestingContract, "ClaimingHasStarted");
      });

      it("Should revert when caller is not the owner", async () => {
        await time.increaseTo(
          (await vestingContract.startTimestamp()).add(60 * 60 * 24)
        );
        await expect(
          vestingContract
            .connect(user1)
            .distributeRights(user1.getAddress(), depositAmount.mul(10))
        ).to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should distribute rights correctly", async () => {
        await time.increaseTo(
          (await vestingContract.startTimestamp()).add(60 * 60 * 24)
        );

        expect(
          await vestingContract
            .connect(owner)
            .distributeRights(user1.getAddress(), depositAmount.mul(10))
        )
          .to.emit(vestingContract, "RightsDistributed")
          .withArgs(user1.getAddress(), depositAmount.mul(10));

        expect(await vestingContract.vestedAmount(user1.getAddress())).to.equal(
          depositAmount.mul(10)
        );
      });
    });

    describe("getAvailableAmount", () => {
      it("Should return 0 before the start", async () => {
        await time.increaseTo(
          (await vestingContract.startTimestamp()).add(60 * 60 * 24)
        );
        expect(
          await vestingContract.getAvailableAmount(user1.address)
        ).to.equal(0);
      });

      it("Should correctly calculate the available amount", async () => {
        // Distribute rights first
        await vestingContract
          .connect(owner)
          .distributeRights(user1.address, depositAmount.mul(10));

        // Fast-forward time to the third claim + 1 day timestamp
        await time.increaseTo(
          (await vestingContract.claim3Timestamp()).add(60 * 60 * 24)
        );

        // At the third claim timestamp, 50% of the tokens should be available
        expect(
          await vestingContract.getAvailableAmount(user1.getAddress())
        ).to.equal(depositAmount.mul(5));
      });
    });

    describe("withdrawTokens", () => {
      it("Should correctly withdraw available tokens", async () => {
        await rewardToken.transfer(
          vestingContract.address,
          depositAmount.mul(10)
        );
        // Distribute some rights first
        await vestingContract
          .connect(owner)
          .distributeRights(user1.getAddress(), depositAmount.mul(10));

        // Fast-forward time to the third claim timestamp
        await time.increaseTo(
          (await vestingContract.claim3Timestamp()).add(60 * 60 * 24)
        ); // 61 days

        // Withdraw available tokens
        await vestingContract.connect(user1).withdrawTokens();

        // Check that the tokens were correctly withdrawn
        const balance = await rewardToken.balanceOf(user1.getAddress());
        expect(balance).to.equal(depositAmount.mul(5));
        expect(
          await vestingContract.claimedAmount(user1.getAddress())
        ).to.equal(depositAmount.mul(5));
      });

      it("Should revert if there are no tokens available for release", async () => {
        await vestingContract
          .connect(owner)
          .distributeRights(user1.getAddress(), depositAmount.mul(10));

        await time.increaseTo(
          (await vestingContract.startTimestamp()).add(60 * 60 * 24)
        );

        await expect(
          vestingContract.connect(user1).withdrawTokens()
        ).to.be.revertedWithCustomError(
          vestingContract,
          "NoTokensAvailableForRelease"
        );
      });

      it("Should revert if token transfer fails", async () => {
        await vestingContract
          .connect(owner)
          .distributeRights(user1.getAddress(), depositAmount.mul(10));

        await time.increaseTo(
          (await vestingContract.claim1Timestamp()).add(60 * 60 * 24)
        );

        await expect(
          vestingContract.connect(user1).withdrawTokens()
        ).to.be.revertedWithCustomError(
          vestingContract,
          "TokenTransferFailed"
        );
      });
    });
  });
});
