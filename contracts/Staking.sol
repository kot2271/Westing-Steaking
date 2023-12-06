// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Staking {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    enum RewardStatus {
        UNCLAIMED,
        CLAIMED
    }

    /**
     * @notice Structure of information on user's deposit
     */
    struct StakeInfo {
        uint256 amount; // Number of tokens
        uint256 depositedTime; // Depositing time
        uint256 claimedRewards; // Rewards received
        RewardStatus status; // Status of the reward
    }

    /**
     * @notice Tokens for deposits and rewards
     */
    IERC20 public depositToken;
    IERC20 public rewardToken;

    /**
     * @notice Time of deposit lock-up (freezing)
     */
    uint256 public lockPeriod;

    /**
     * @notice Fee percentage
     */
    uint256 public rewardRate;

    /**
     * @notice Storing information on user deposits
     */
    mapping(address => StakeInfo) public stakes;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    // Custom Errors
    error DepositAmountMustBeGreaterThanZero();
    error LockPeriodNotEnded();
    error RewardsHasBeenReceived();
    error ClaimRewardsFirst();

    constructor(
        address _depositToken,
        address _rewardToken,
        uint256 _lockPeriod,
        uint256 _rewardRate
    ) {
        depositToken = IERC20(_depositToken);
        rewardToken = IERC20(_rewardToken);
        lockPeriod = _lockPeriod;
        rewardRate = _rewardRate;
    }

    /**
     * Function for transferring tokens from user address to contract address.
     * @param amount Amount of tokens
     */
    function deposit(uint256 amount) external {
        if (amount <= 0) revert DepositAmountMustBeGreaterThanZero();
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].depositedTime = block.timestamp;
        stakes[msg.sender].claimedRewards = 0;
        stakes[msg.sender].status = RewardStatus.UNCLAIMED;

        emit Deposit(msg.sender, amount);
    }

    /**
     * Function for calculating the reward.
     * @param stake Information on user's deposit
     */
    function calculateRewards(
        StakeInfo memory stake
    ) public view returns (uint256) {
        return stake.amount.mul(rewardRate).div(100);
    }

    /**
     * Function to receive an reward.
     */
    function claimRewards() external {
        StakeInfo memory stake = stakes[msg.sender];
        if (block.timestamp < stake.depositedTime + lockPeriod)
            revert LockPeriodNotEnded();
        if (stake.claimedRewards > 0) revert RewardsHasBeenReceived();

        uint256 rewards = calculateRewards(stake);

        // Getting awards
        rewardToken.safeTransfer(msg.sender, rewards);

        // Updating information on remuneration received
        stakes[msg.sender].claimedRewards = rewards;
        stakes[msg.sender].status = RewardStatus.CLAIMED;

        emit Claim(msg.sender, rewards);
    }

    /**
     * Function outputting tokens deposited by user to his address
     */
    function withdraw() external {
        StakeInfo memory stake = stakes[msg.sender];
        if (stake.status == RewardStatus.UNCLAIMED) revert ClaimRewardsFirst();

        // Getting the tokens back
        depositToken.safeTransfer(msg.sender, stake.amount);

        emit Withdraw(msg.sender, stakes[msg.sender].amount);

        // Deleting deposit information
        delete stakes[msg.sender];
    }
}
