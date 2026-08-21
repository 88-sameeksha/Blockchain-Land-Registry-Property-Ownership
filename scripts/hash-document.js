const fs = require("fs");
const crypto = require("crypto");

const file = process.argv[2] || "sample_documents/property_001.json";
const data = fs.readFileSync(file);
const hash = crypto.createHash("sha256").update(data).digest("hex");

console.log(`File: ${file}`);
console.log(`SHA-256: ${hash}`);
console.log(`Solidity bytes32: 0x${hash}`);
