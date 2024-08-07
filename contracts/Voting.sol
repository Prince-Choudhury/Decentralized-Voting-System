// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Voting {
    struct Candidate {
        string name;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public voters;
    mapping(address => uint) public voterInfo;

    uint public candidatesCount;
    uint public votingEndTime;
    bool public votingOpen;

    constructor(string[] memory candidateNames, uint _durationMinutes) {
        candidatesCount = candidateNames.length;
        votingOpen = true;
        votingEndTime = block.timestamp + (_durationMinutes * 1 minutes);

        for (uint i = 0; i < candidateNames.length; i++) {
            candidates[i] = Candidate(candidateNames[i], 0);
        }
    }

    function vote(uint candidateIndex) public {
        require(votingOpen, "Voting has ended.");
        require(!voters[msg.sender], "You have already voted.");
        require(candidateIndex < candidatesCount, "Invalid candidate index.");

        voters[msg.sender] = true;
        voterInfo[msg.sender] = candidateIndex;
        candidates[candidateIndex].voteCount += 1;
    }

    function getAllVotesOfCandidates() public view returns (Candidate[] memory) {
        Candidate[] memory allCandidates = new Candidate[](candidatesCount);
        for (uint i = 0; i < candidatesCount; i++) {
            allCandidates[i] = candidates[i];
        }
        return allCandidates;
    }

    function getVotingStatus() public view returns (bool) {
        return votingOpen && block.timestamp < votingEndTime;
    }

    function getRemainingTime() public view returns (uint) {
        if (votingOpen) {
            if (block.timestamp >= votingEndTime) {
                return 0;
            } else {
                return (votingEndTime - block.timestamp) / 1 seconds;
            }
        } else {
            return 0;
        }
    }
}
