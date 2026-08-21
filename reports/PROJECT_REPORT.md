# Project Report: Blockchain-Based Land Registry & Property Ownership System

## Abstract
This project presents an educational blockchain prototype for simulating a land-registry workflow. A Solidity smart contract stores synthetic property records, assigns wallet-based ownership, separates authority verification from registration, supports verified ownership transfers and emits events that can be used to reconstruct an audit trail. Supporting documents remain off-chain and are represented on-chain by a cryptographic hash. The prototype intentionally avoids real government records and does not claim legal ownership.

## 1. Introduction
Land and property records are high-value records that benefit from integrity, traceability and controlled updates. Conventional workflows may involve multiple databases, offices and documents. Blockchain can provide a shared append-oriented transaction history, but it does not replace legal authority or identity systems.

## 2. Problem Statement
The project addresses the educational challenge of representing property registration and transfer in a tamper-evident digital workflow while preventing unauthorized changes through smart-contract access control.

## 3. Objectives
- Synthetic property registration.
- Authority verification.
- Owner-only transfer.
- Document hash verification.
- Ownership event history.
- Automated security testing.

## 4. Proposed System
The authority deploys the contract and becomes the privileged registrar for this prototype. The authority registers a property with a synthetic document hash and an initial owner wallet. After verification, the current owner may transfer the property to another test wallet. The contract records the previous owner, timestamp and event.

## 5. Architecture
The optional React frontend communicates with the Solidity contract using Ethers.js and a wallet. The contract contains the property registry, ownership mapping, verification rules and events. Documents remain off-chain.

## 6. Data Model
Each property contains an ID, property number, location, area, type, current owner, previous owner, document hash, verification flag, status and timestamps.

## 7. Smart Contract Design
The contract uses a struct for records, mappings for lookup, an enum for status, modifiers for access control, `require` checks for validation and events for auditability.

## 8. Registration Workflow
Authority submits synthetic property details. The contract rejects duplicate IDs, zero owners, invalid area, missing metadata and missing document hashes. A `PropertyRegistered` event is emitted.

## 9. Verification Workflow
The authority verifies a registered property. Verification is separate because a record can be registered into the prototype before its supporting evidence is checked.

## 10. Ownership Transfer
Only the current owner can transfer a property. The property must be verified, the new owner cannot be the zero address and disputed properties are blocked. The contract updates the owner, preserves the previous owner, records a timestamp and emits `OwnershipTransferred`.

## 11. Document Hashing
A synthetic JSON document is hashed using SHA-256. The digest is stored as a `bytes32` reference in the contract. Editing the document changes the digest, allowing a verifier to detect that the bytes are not the same as the originally referenced file.

## 12. Security
Security checks cover unauthorized registration/verification, duplicate IDs, invalid addresses, invalid property IDs, non-owner transfers, unverified transfers and disputed properties. Automated tests cover both successful and rejected operations.

## 13. Testing and Simulation
Hardhat tests validate the contract behavior. Remix VM can reproduce the workflow visually using four test accounts: authority, Owner A, Buyer B and an unauthorized wallet.

## 14. Results
The prototype demonstrates a complete educational workflow from registration through verification and ownership transfer. The event logs provide evidence of state-changing transactions.

## 15. Applications
Concepts may be relevant to land registries, PropTech, title verification, property management, mortgage verification and document authentication.

## 16. Advantages
- Tamper-evident transaction history.
- Transparent state transitions.
- Programmatic access control.
- Faster digital verification workflows.
- Easy event-based auditing.

## 17. Limitations
The system does not know whether the input is legally true. It cannot independently verify identity, survey boundaries, court orders, liens, inheritance or government authority. Blockchain records do not automatically become legal title.

## 18. Future Scope
Multi-party approvals, identity integration, IPFS/document layers, frontend dashboards, event indexing, escrow simulation and formal security review could extend the prototype.

## 19. Conclusion
The project demonstrates how blockchain and smart contracts can model a controlled property-record workflow. Its most important lesson is that blockchain can protect the integrity of recorded transactions, but legal ownership still depends on trusted real-world institutions and applicable law.
