// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ConsentAudit
 * @dev Decentralized Immutable Smart Contract for FedABHA Zero-Trust Patient Consent Management & Audit Trail Logging.
 */
contract ConsentAudit {
    address public owner;

    struct AuditRecord {
        string txId;
        string eventType;
        string payloadHash;
        string metadataJSON;
        uint256 timestamp;
        address recorder;
    }

    struct ConsentPolicy {
        string patientId;
        string consentId;
        bool isRevoked;
        uint256 validUntil;
        uint256 updatedAt;
    }

    // Mapping from Transaction ID to AuditRecord
    mapping(string => AuditRecord) private auditRecords;
    string[] private auditTxIds;

    // Mapping from Patient/ABHA ID to ConsentPolicy
    mapping(string => ConsentPolicy) private consentPolicies;

    // Events
    event ConsentUpdated(
        string indexed patientId,
        string consentId,
        bool isRevoked,
        uint256 timestamp
    );

    event AuditEventLogged(
        string indexed txId,
        string indexed eventType,
        string payloadHash,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can execute this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Logs an immutable zero-trust audit event on-chain.
     */
    function logAuditEvent(
        string memory _txId,
        string memory _eventType,
        string memory _payloadHash,
        string memory _metadataJSON
    ) external returns (bool) {
        require(bytes(_txId).length > 0, "Transaction ID cannot be empty");
        require(auditRecords[_txId].timestamp == 0, "Transaction ID already exists");

        auditRecords[_txId] = AuditRecord({
            txId: _txId,
            eventType: _eventType,
            payloadHash: _payloadHash,
            metadataJSON: _metadataJSON,
            timestamp: block.timestamp,
            recorder: msg.sender
        });

        auditTxIds.push(_txId);

        emit AuditEventLogged(_txId, _eventType, _payloadHash, block.timestamp);
        return true;
    }

    /**
     * @dev Dynamically grants or revokes a patient's consent policy on-chain.
     */
    function updateConsent(
        string memory _patientId,
        string memory _consentId,
        bool _isRevoked,
        uint256 _validUntil
    ) external {
        require(bytes(_patientId).length > 0, "Patient ID cannot be empty");

        consentPolicies[_patientId] = ConsentPolicy({
            patientId: _patientId,
            consentId: _consentId,
            isRevoked: _isRevoked,
            validUntil: _validUntil,
            updatedAt: block.timestamp
        });

        emit ConsentUpdated(_patientId, _consentId, _isRevoked, block.timestamp);
    }

    /**
     * @dev Fetches a patient's active consent status.
     */
    function getConsent(string memory _patientId)
        external
        view
        returns (
            string memory consentId,
            bool isRevoked,
            uint256 validUntil,
            uint256 updatedAt
        )
    {
        ConsentPolicy memory policy = consentPolicies[_patientId];
        return (policy.consentId, policy.isRevoked, policy.validUntil, policy.updatedAt);
    }

    /**
     * @dev Retrieves audit record details by Transaction ID.
     */
    function getAuditRecord(string memory _txId)
        external
        view
        returns (
            string memory eventType,
            string memory payloadHash,
            string memory metadataJSON,
            uint256 timestamp,
            address recorder
        )
    {
        AuditRecord memory rec = auditRecords[_txId];
        require(rec.timestamp > 0, "Audit record not found");
        return (rec.eventType, rec.payloadHash, rec.metadataJSON, rec.timestamp, rec.recorder);
    }

    /**
     * @dev Returns total number of audit records committed on-chain.
     */
    function getRecordCount() external view returns (uint256) {
        return auditTxIds.length;
    }
}
