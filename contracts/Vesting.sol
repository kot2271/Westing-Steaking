// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    // Экземпляр токена
    IERC20 public token;

    // Параметры контракта
    uint256 public startTimestamp;
    uint256 public claim1Timestamp;
    uint256 public claim2Timestamp;
    uint256 public claim3Timestamp;
    uint256 public endClaimTimestamp;
    mapping(address => uint256) public vestedAmount;
    mapping(address => uint256) public claimedAmount;

    // Правила разморозки токенов
    struct VestingPeriod {
        uint256 startTime;
        uint256 percentage;
    }

    // События
    event RightsDistributed(address indexed account, uint256 amount);
    event TokensWithdrawn(address indexed account, uint256 amount);

    // Кастомные Ошибки
    error VestingPeriodsNotStarted();
    error ThisHolderAlreadyExists();
    error NoTokensAvailableForRelease();
    error TokenTransferFailed();

    uint256 public constant HUNDRED_PERCENT = 100;

    VestingPeriod[] public vestingPeriods;

    // Инициализация параметров
    constructor(address _token) {
        token = IERC20(_token);
        startTimestamp = block.timestamp;
        claim1Timestamp = startTimestamp + 30 days; // 30 days from the start
        claim2Timestamp = startTimestamp + 60 days; // 60 days from the start
        claim3Timestamp = startTimestamp + 90 days; // 90 days from the start
        endClaimTimestamp = startTimestamp + 120 days; // 120 days from the start

        // Инициализация периодов разморозки
        vestingPeriods.push(
            VestingPeriod({startTime: claim1Timestamp, percentage: 10})
        );
        vestingPeriods.push(
            VestingPeriod({startTime: claim2Timestamp, percentage: 30})
        );
        vestingPeriods.push(
            VestingPeriod({startTime: claim3Timestamp, percentage: 50})
        );
        vestingPeriods.push(
            VestingPeriod({startTime: endClaimTimestamp, percentage: 100})
        );
    }

    // Функция для распределения прав на получение токенов
    function distributeRights(
        address account,
        uint256 amount
    ) external onlyOwner {
        if (vestedAmount[account] > 0) revert ThisHolderAlreadyExists();
        vestedAmount[account] = amount;
        token.safeTransferFrom(msg.sender, address(this), amount);

        emit RightsDistributed(account, amount);
    }

    // Вью функция для подсчета доступного для разморозки количества токенов юзера
    function getAvailableAmount(
        address _address
    ) public view returns (uint256) {
        if (block.timestamp < startTimestamp) revert VestingPeriodsNotStarted();
        // Проходимся по всем периодам разморозки
        for (uint256 i = 0; i < vestingPeriods.length; i++) {
            // Если период разморозки начался
            if (block.timestamp >= vestingPeriods[i].startTime) {
                // Вычисляем доступное количество токенов
                uint256 availableAmount = vestedAmount[_address]
                    .mul(vestingPeriods[i].percentage)
                    .div(HUNDRED_PERCENT);

                // Возвращаем доступное количество токенов
                return availableAmount;
            }
        }

        // Если токены еще не разморозились, возвращаем 0
        return 0;
    }

    // Функция для перевода доступного для разморозки количества токенов на адрес юзера
    function withdrawTokens() external {
        uint256 availableAmount = getAvailableAmount(msg.sender);

        if (availableAmount < claimedAmount[msg.sender])
            revert NoTokensAvailableForRelease();

        // Если доступное количество токенов больше 0
        if (availableAmount > 0) {
            uint256 amountToRelease = availableAmount -
                claimedAmount[msg.sender];

            // Подготавливаем данные для вызова функции transfer контракта токена
            bytes memory data = abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                amountToRelease
            );

            // Вызываем функцию transfer контракта токена
            (bool success, ) = address(token).call(data);
            if (!success) revert TokenTransferFailed();

            // Обновляем количество уже размороженных токенов
            claimedAmount[msg.sender] += amountToRelease;

            emit TokensWithdrawn(msg.sender, amountToRelease);
        }
    }
}
