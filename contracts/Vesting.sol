// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Vesting is Ownable {
    using SafeMath for uint256;

    // Token instance
    IERC20 public token;

    // Contract parameters
    uint256 public startTimestamp;
    uint256 public claim1Timestamp;
    uint256 public claim2Timestamp;
    uint256 public claim3Timestamp;
    uint256 public endClaimTimestamp;
    mapping(address => uint256) public vestedAmount;
    mapping(address => uint256) public claimedAmount;

    // Token unfreezing rules
    struct VestingPeriod {
        uint256 startTime;
        uint256 percentage;
    }

    // Events
    event RightsDistributed(address indexed account, uint256 amount);
    event TokensWithdrawn(address indexed account, uint256 amount);

    // Custom Errors
    error VestingPeriodsNotStarted();
    error NoTokensAvailableForRelease();
    error TokenTransferFailed();
    error ClaimingHasStarted();

    uint256 public constant HUNDRED_PERCENT = 100;

    VestingPeriod[] public vestingPeriods;

    // Initializing parameters
    constructor(address _token) {
        token = IERC20(_token);
        startTimestamp = block.timestamp;
        claim1Timestamp = startTimestamp + 30 days; // 30 days from the start
        claim2Timestamp = startTimestamp + 60 days; // 60 days from the start
        claim3Timestamp = startTimestamp + 90 days; // 90 days from the start
        endClaimTimestamp = startTimestamp + 120 days; // 120 days from the start

        // Initializing defrost periods
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

    /**
     * Function for distribution of rights to receive tokens.
     * @param account account address
     * @param amount amount of rights
     */
    function distributeRights(
        address account,
        uint256 amount
    ) external onlyOwner {
        if (block.timestamp >= claim1Timestamp) revert ClaimingHasStarted();
        vestedAmount[account] = amount;

        emit RightsDistributed(account, amount);
    }

    /**
     * View function for calculating the number of user tokens available for unfreezing.
     * @param _address user address
     */
    function getAvailableAmount(
        address _address
    ) public view returns (uint256) {
        if (block.timestamp < startTimestamp) revert VestingPeriodsNotStarted();
        uint256 availableAmount = 0;
        // Going through all the defrosting periods
        for (uint256 i = 0; i < vestingPeriods.length; i++) {
            // If the defrosting period has started
            if (block.timestamp >= vestingPeriods[i].startTime) {
                // Calculate the available number of tokens
                availableAmount = vestedAmount[_address]
                    .mul(vestingPeriods[i].percentage)
                    .div(HUNDRED_PERCENT);
            }
        }
        // Return the available number of tokens, if the tokens have not been unfrozen yet, return 0
        return availableAmount;
    }

    /**
     * Function for transferring the number of tokens available for unfreezing to the user's address
     */
    function withdrawTokens() external {
        uint256 availableAmount = getAvailableAmount(msg.sender);

        if (availableAmount <= claimedAmount[msg.sender])
            revert NoTokensAvailableForRelease();

        // If the available number of tokens is greater than 0
        if (availableAmount > 0) {
            uint256 amountToRelease = availableAmount -
                claimedAmount[msg.sender];

            // Prepare data for calling the token contract transfer function
            bytes memory data = abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender,
                amountToRelease
            );

            // Call function transfer token contract
            (bool success, ) = address(token).call(data);
            if (!success) revert TokenTransferFailed();

            // Updating the number of tokens already unfrozen
            claimedAmount[msg.sender] += amountToRelease;

            emit TokensWithdrawn(msg.sender, amountToRelease);
        }
    }
}
