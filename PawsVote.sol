// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";
import "@thirdweb-dev/contracts/extension/PermissionsEnumerable.sol";

contract PawsVote is ERC20Base, PermissionsEnumerable {
    bool public isVoteCreated;
    bool public isMintingAllowed;
    uint256 public votingStart;
    uint256 public votingEnd;
    mapping(uint256 => string) public optionDescriptions;
    uint256[] public optionIds;
    mapping(uint256 => uint256) public votes;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public userVote;

    event VoteCasted(address voter, uint256 option, uint256 amount);
    event VotingOutcome(uint256 winningOption, uint256 winningVotes);

    bytes32 public constant VOTE_ON_BEHALF_ROLE = keccak256("VOTE_ON_BEHALF_ROLE");

    modifier voteOnBehalfAllowed() {
        require(hasRole(VOTE_ON_BEHALF_ROLE, msg.sender), "Caller is not allowed to vote on behalf.");
        _;
    }

    modifier duringVotingPeriod() {
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting is not active.");
        _;
    }
    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol
    )
        ERC20Base(
            _defaultAdmin,
            _name,
            _symbol
        )
    {
        isMintingAllowed = true;
        _mint(msg.sender, 1_000_000_000 ether);
        isMintingAllowed = false;

        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
    }

    function createVote (uint256 _start, uint256 _end, string[] memory _options) public onlyOwner() {
        require(_start < _end, "Start time must be before end time.");
        require(_options.length > 0, "At least one voting option is required.");
        require(!isVoteCreated, "Vote has already been created.");

        votingStart = _start;
        votingEnd = _end;
        for(uint256 i = 0; i < _options.length; i++) {
            optionDescriptions[i] = _options[i];
            optionIds.push(i);
        }
        isVoteCreated = true;
    }

    function castVote(uint256 _optionId) public duringVotingPeriod {
        _castVote(msg.sender, _optionId);
    }

    function castVoteOnBehalf(address _voter, uint256 _optionId) public duringVotingPeriod voteOnBehalfAllowed {
        _castVote(_voter, _optionId);
    }

    function _castVote(address _voter, uint256 _optionId) internal {
        require(!hasVoted[_voter], "You have already voted.");
        require(isValidOption(_optionId), "Invalid voting option.");

        uint256 voterBalance = balanceOf(_voter);
        require(voterBalance > 0, "No tokens to cast vote.");

        votes[_optionId] += voterBalance;
        hasVoted[_voter] = true;
        userVote[_voter] = _optionId;
        _burn(_voter, voterBalance);

        emit VoteCasted(_voter, _optionId, voterBalance);
    }

    function isValidOption(uint256 _optionId) public view returns (bool) {
        for (uint256 i = 0; i < optionIds.length; i++) {
            if (optionIds[i] == _optionId) {
                return true;
            }
        }
        return false;
    }

    function _mint(address _account, uint256 _amount) internal override {
        // do not allow mints after the constructor mints tokens
        require(isMintingAllowed, "Minting is not allowed.");
        super._mint(_account, _amount);
    }
}