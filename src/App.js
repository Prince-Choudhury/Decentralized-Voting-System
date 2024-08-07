import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractAbi, contractAddress } from './Constant/constant';
import './App.css';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [votingStatus, setVotingStatus] = useState(true);
  const [remainingTime, setRemainingTime] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [canVote, setCanVote] = useState(true);
  const [votedFor, setVotedFor] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (isConnected) {
        await getCandidates();
        await getRemainingTime();
        await getCurrentStatus();
        await checkVotingStatus();
      }
    };
    init();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    }
  }, [isConnected]);

  async function connectToMetamask() {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("Metamask is not detected in the browser");
    }
  }

  function handleAccountsChanged(accounts) {
    if (accounts.length > 0 && account !== accounts[0]) {
      setAccount(accounts[0]);
      checkVotingStatus();
    } else {
      setIsConnected(false);
      setAccount(null);
    }
  }

  async function getCandidates() {
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const candidatesList = await contractInstance.getAllVotesOfCandidates();
    const formattedCandidates = candidatesList.map((candidate, index) => ({
      index: index,
      name: candidate.name,
      voteCount: candidate.voteCount.toNumber()
    }));
    setCandidates(formattedCandidates);
  }

  async function getCurrentStatus() {
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const status = await contractInstance.getVotingStatus();
    setVotingStatus(status);
  }

  async function getRemainingTime() {
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const time = await contractInstance.getRemainingTime();
    setRemainingTime(parseInt(time, 10));
  }

  async function checkVotingStatus() {
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    const hasVoted = await contractInstance.voters(account);
    setCanVote(!hasVoted);
    if (hasVoted) {
      const votedCandidateIndex = await contractInstance.voterInfo(account);
      setVotedFor(candidates[votedCandidateIndex.toNumber()]);
    }
  }

  async function vote() {
    if (!selectedCandidate) return;
    const signer = provider.getSigner();
    const contractInstance = new ethers.Contract(contractAddress, contractAbi, signer);
    try {
      console.log("Voting for candidate index:", selectedCandidate);
      const tx = await contractInstance.vote(selectedCandidate);
      console.log("Transaction sent:", tx);
      await tx.wait();
      console.log("Transaction confirmed");
      await getCandidates();
      await checkVotingStatus();
    } catch (error) {
      console.error("Error voting:", error);
    }
  }

  function renderLoginSection() {
    return (
      <div className="login-section">
        <h2>Welcome to the Voting DApp</h2>
        <button onClick={connectToMetamask}>Connect to Metamask</button>
      </div>
    );
  }

  function renderVotingSection() {
    return (
      <div className="voting-section">
        <h2>Connected Account: {account}</h2>
        <h3>Remaining Time: {remainingTime} seconds</h3>
        <h3>Candidates:</h3>
        <ul className="candidates-list">
          {candidates.map((candidate) => (
            <li key={candidate.index} className="candidate-item">
              <span>{candidate.name} - Votes: {candidate.voteCount}</span>
              <button 
                onClick={() => setSelectedCandidate(candidate.index)}
                disabled={!canVote}
                className={selectedCandidate === candidate.index ? 'selected' : ''}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
        <button onClick={vote} disabled={!canVote || selectedCandidate === ''} className="vote-button">
          Cast Vote
        </button>
        {!canVote && votedFor && <p>You have voted for: {votedFor.name}</p>}
      </div>
    );
  }

  function renderFinishedSection() {
    return (
      <div className="finished-section">
        <h2>Voting has ended!</h2>
        <h3>Final Results:</h3>
        <ul className="results-list">
          {candidates.map((candidate) => (
            <li key={candidate.index} className="result-item">
              {candidate.name}: {candidate.voteCount} votes
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Decentralized Voting Application</h1>
      {!isConnected && renderLoginSection()}
      {isConnected && votingStatus && renderVotingSection()}
      {isConnected && !votingStatus && renderFinishedSection()}
    </div>
  );
}

export default App;
