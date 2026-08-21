# Optional React Frontend

The frontend can expose three views:

- Authority Dashboard: connect wallet, register property, verify property, search property.
- Owner Dashboard: view owned properties, transfer property, view history.
- Verification Page: property ID, location, area, owner, verification state, document hash and transaction history.

Recommended flow: React UI -> Ethers.js BrowserProvider -> MetaMask/local wallet -> LandRegistry contract.

The contract ABI and deployed address should be loaded from the Hardhat deployment artifacts after deployment. Do not put private keys in frontend code.
