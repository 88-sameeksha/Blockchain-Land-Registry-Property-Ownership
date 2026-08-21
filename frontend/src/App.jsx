import { useState } from "react";
import { ethers } from "ethers";

const ABI = [
  "function getProperty(uint256) view returns (uint256,string,string,uint256,string,address,address,bytes32,bool,uint8,uint256,uint256)",
  "function getPropertiesByOwner(address) view returns (uint256[])",
  "function transferOwnership(uint256,address)"
];

export default function App() {
  const [account, setAccount] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [property, setProperty] = useState(null);
  const [message, setMessage] = useState("");

  async function connectWallet() {
    if (!window.ethereum) return setMessage("Install/use a compatible wallet provider.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
    setMessage("Wallet connected");
  }

  async function lookupProperty() {
    if (!window.ethereum || !propertyId) return;
    const address = import.meta.env.VITE_CONTRACT_ADDRESS;
    if (!address) return setMessage("Set VITE_CONTRACT_ADDRESS first.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(address, ABI, provider);
    const result = await contract.getProperty(propertyId);
    setProperty(result);
  }

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Land Registry Prototype</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>{account || "No wallet connected"}</p>
      <hr />
      <input placeholder="Property ID" value={propertyId} onChange={e => setPropertyId(e.target.value)} />
      <button onClick={lookupProperty}>Search</button>
      <p>{message}</p>
      {property && (
        <pre>{JSON.stringify({
          propertyId: property[0].toString(),
          propertyNumber: property[1],
          location: property[2],
          area: property[3].toString(),
          propertyType: property[4],
          currentOwner: property[5],
          previousOwner: property[6],
          documentHash: property[7],
          verified: property[8],
          status: property[9].toString(),
          registeredAt: property[10].toString(),
          lastTransferredAt: property[11].toString()
        }, null, 2)}</pre>
      )}
    </main>
  );
}
