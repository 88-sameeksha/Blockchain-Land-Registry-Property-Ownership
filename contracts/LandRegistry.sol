// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LandRegistry {
    address public immutable authority;

    enum PropertyStatus {
        REGISTERED,
        VERIFIED,
        TRANSFER_PENDING,
        TRANSFERRED,
        DISPUTED
    }

    struct Property {
        uint256 propertyId;
        string propertyNumber;
        string location;
        uint256 area;
        string propertyType;
        address currentOwner;
        address previousOwner;
        bytes32 documentHash;
        bool verified;
        PropertyStatus status;
        uint256 registeredAt;
        uint256 lastTransferredAt;
    }

    mapping(uint256 => Property) private properties;
    mapping(address => uint256[]) private ownerPropertyIds;
    mapping(uint256 => bool) private propertyExistsMap;

    event PropertyRegistered(
        uint256 indexed propertyId,
        string propertyNumber,
        address indexed initialOwner,
        bytes32 documentHash
    );

    event PropertyVerified(uint256 indexed propertyId, address indexed verifier);

    event OwnershipTransferred(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner,
        uint256 timestamp
    );

    event PropertyStatusUpdated(
        uint256 indexed propertyId,
        PropertyStatus oldStatus,
        PropertyStatus newStatus
    );

    modifier onlyAuthority() {
        require(msg.sender == authority, "Only authority can perform this action");
        _;
    }

  modifier propertyExistsModifier(uint256 propertyId) {
    require(
        properties[propertyId].propertyId == propertyId,
        "Property does not exist"
    );
    _;
}

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(properties[propertyId].currentOwner == msg.sender, "Caller is not current owner");
        _;
    }

    constructor() {
        authority = msg.sender;
    }

    function registerProperty(
        uint256 propertyId,
        string calldata propertyNumber,
        string calldata location,
        uint256 area,
        string calldata propertyType,
        address initialOwner,
        bytes32 documentHash
    ) external onlyAuthority {
        require(!propertyExistsMap[propertyId], "Property ID already exists");
        require(initialOwner != address(0), "Owner cannot be zero address");
        require(area > 0, "Area must be greater than zero");
        require(bytes(propertyNumber).length > 0, "Property number required");
        require(bytes(location).length > 0, "Location required");
        require(bytes(propertyType).length > 0, "Property type required");
        require(documentHash != bytes32(0), "Document hash required");

        properties[propertyId] = Property({
            propertyId: propertyId,
            propertyNumber: propertyNumber,
            location: location,
            area: area,
            propertyType: propertyType,
            currentOwner: initialOwner,
            previousOwner: address(0),
            documentHash: documentHash,
            verified: false,
            status: PropertyStatus.REGISTERED,
            registeredAt: block.timestamp,
            lastTransferredAt: 0
        });

        propertyExistsMap[propertyId] = true;
        ownerPropertyIds[initialOwner].push(propertyId);

        emit PropertyRegistered(propertyId, propertyNumber, initialOwner, documentHash);
    }

    function verifyProperty(uint256 propertyId)
    external
    onlyAuthority
    propertyExistsModifier(propertyId)

    {
        Property storage property = properties[propertyId];
        require(!property.verified, "Property already verified");
        require(property.status != PropertyStatus.DISPUTED, "Disputed property cannot be verified");

        property.verified = true;
        property.status = PropertyStatus.VERIFIED;

        emit PropertyVerified(propertyId, msg.sender);
    }

    function transferOwnership(uint256 propertyId, address newOwner)
        external
        propertyExistsModifier(propertyId)
        onlyPropertyOwner(propertyId)
    {
        Property storage property = properties[propertyId];
        require(newOwner != address(0), "New owner cannot be zero address");
        require(property.verified, "Property must be verified before transfer");
        require(property.status != PropertyStatus.DISPUTED, "Disputed property cannot be transferred");
        require(newOwner != property.currentOwner, "New owner must be different");

        address oldOwner = property.currentOwner;
        property.previousOwner = oldOwner;
        property.currentOwner = newOwner;
        property.lastTransferredAt = block.timestamp;
        property.status = PropertyStatus.TRANSFERRED;

        _removePropertyFromOwner(oldOwner, propertyId);
        ownerPropertyIds[newOwner].push(propertyId);

        emit OwnershipTransferred(propertyId, oldOwner, newOwner, block.timestamp);
    }

    function updatePropertyStatus(uint256 propertyId, PropertyStatus newStatus)
        external
        onlyAuthority
        propertyExistsModifier(propertyId)
    {
        Property storage property = properties[propertyId];
        PropertyStatus oldStatus = property.status;

        if (newStatus == PropertyStatus.VERIFIED) {
            require(property.verified, "Property has not been verified");
        }
        if (newStatus == PropertyStatus.TRANSFER_PENDING) {
            require(property.verified, "Property must be verified first");
        }

        property.status = newStatus;
        emit PropertyStatusUpdated(propertyId, oldStatus, newStatus);
    }

    function getProperty(uint256 propertyId)
        external
        view
       propertyExistsModifier(propertyId)
        returns (Property memory)
    {
        return properties[propertyId];
    }

    function getPropertiesByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return ownerPropertyIds[owner];
    }

    function propertyExists(uint256 propertyId) external view returns (bool) {
        return propertyExistsMap[propertyId];
    }

    function _removePropertyFromOwner(address owner, uint256 propertyId) internal {
        uint256[] storage ids = ownerPropertyIds[owner];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == propertyId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                return;
            }
        }
    }
}
