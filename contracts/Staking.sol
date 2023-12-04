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

    // Структура информации о депозите пользователя
    struct StakeInfo {
        uint256 amount; // Количество токенов
        uint256 depositedTime; // Время депозита
        uint256 claimedRewards; // Полученные награды
        RewardStatus status; // Статус награды
    }

    // Токены для депозитов и наград
    IERC20 public depositToken;
    IERC20 public rewardToken;

    // Время лока (заморозки) депозитов
    uint256 public lockPeriod;

    // Процент вознаграждения
    uint256 public rewardRate;

    // Хранение информации о депозитах пользователей
    mapping(address => StakeInfo) public stakes;

    // События
    event Deposit(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);

    // Кастомные Ошибки
    error DepositAmountMustBeGreaterThanZero();
    error LockPeriodNotEnded();
    error RewardsHasBeenReceived();
    error RewardsHasBeenClaimed();
    error NotAllRewardsAreReceived();
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

    // Функция перевода токенов с адреса юзера на адрес контракта
    function deposit(uint256 amount) external {
        if (amount <= 0) revert DepositAmountMustBeGreaterThanZero();
        depositToken.safeTransferFrom(msg.sender, address(this), amount);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].depositedTime = block.timestamp;
        stakes[msg.sender].claimedRewards = 0;
        stakes[msg.sender].status = RewardStatus.UNCLAIMED;

        emit Deposit(msg.sender, amount);
    }

    // Функция для получения награды
    function claimRewards() external {
        StakeInfo memory stake = stakes[msg.sender];
        if (block.timestamp < stake.depositedTime + lockPeriod)
            revert LockPeriodNotEnded();
        if (stake.claimedRewards > 0) revert RewardsHasBeenReceived();
        if (stake.status == RewardStatus.CLAIMED)
            revert RewardsHasBeenClaimed();

        uint256 rewards = stake.amount.mul(rewardRate).div(100);

        // Получаем награды
        rewardToken.safeTransfer(msg.sender, rewards);

        // Обновляем информацию о полученных вознаграждениях
        stake.claimedRewards = rewards;
        stake.status = RewardStatus.CLAIMED;

        emit Claim(msg.sender, rewards);
    }

    // Функция выводящая задепозиченные юзером токены на его адрес
    function withdraw() external {
        StakeInfo memory stake = stakes[msg.sender];
        if (stake.status == RewardStatus.UNCLAIMED) revert ClaimRewardsFirst();
        if (stake.claimedRewards < stake.amount)
            revert NotAllRewardsAreReceived();

        // Получаем токены обратно
        depositToken.safeTransfer(msg.sender, stake.amount);

        emit Withdraw(msg.sender, stake.amount);

        // Удаляем информацию о депозите
        delete stakes[msg.sender];
    }
}
