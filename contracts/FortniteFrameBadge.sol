// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title FortniteFrameBadge
 * @notice Minimal, secure, gas-efficient contract for Farcaster Frame v2 badge minting
 * @dev Runs on Base (EVM L2) with automatic platform fee routing to reserve wallet
 * @custom:admin gxqstudio.eth
 */
contract FortniteFrameBadge is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice Reserve wallet that receives platform fees (default: gxqstudio.eth)
    address payable public reserveWallet;

    /// @notice Platform fee in basis points (e.g., 250 = 2.5%)
    uint16 public platformFeeBps;

    /// @notice Authorized relayer that can sign backend signatures
    address public authorizedRelayer;

    /// @notice Tracks whether a user has a specific badge
    /// @dev mapping(user => mapping(fortniteHash => hasBadge))
    mapping(address => mapping(bytes32 => bool)) public hasBadge;

    /// @notice Tracks used signatures to prevent replay attacks
    mapping(bytes32 => bool) public usedSignatures;

    /// @notice Domain separator for EIP-712 signatures
    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @notice TypeHash for mintBadge function
    bytes32 public constant MINT_BADGE_TYPEHASH = 
        keccak256("MintBadge(address recipient,bytes32 fortniteHash,uint256 priceWei,uint256 deadline,uint256 nonce)");

    /// @notice Nonce tracking for signatures
    mapping(address => uint256) public nonces;

    // ============ Events ============

    event BadgeMinted(
        address indexed user, 
        bytes32 indexed fortniteHash, 
        uint256 price, 
        uint256 fee
    );

    event PlatformFeeTaken(
        address indexed payer, 
        uint256 amount, 
        uint256 fee, 
        address indexed reserveWallet
    );

    event ReserveWalletUpdated(
        address indexed oldWallet, 
        address indexed newWallet
    );

    event PlatformFeeUpdated(uint16 oldBps, uint16 newBps);

    event AuthorizedRelayerUpdated(
        address indexed oldRelayer, 
        address indexed newRelayer
    );

    event Withdraw(address indexed to, uint256 amount);

    // ============ Constructor ============

    /**
     * @notice Initializes the FortniteFrameBadge contract
     * @param _reserveWallet Address to receive platform fees (must not be zero address)
     * @param _platformFeeBps Platform fee in basis points (max 1000 = 10%)
     * @param _authorizedRelayer Address authorized to sign backend signatures
     */
    constructor(
        address payable _reserveWallet,
        uint16 _platformFeeBps,
        address _authorizedRelayer
    ) Ownable(msg.sender) {
        require(_reserveWallet != address(0), "Reserve wallet cannot be zero address");
        require(_platformFeeBps <= 1000, "Platform fee cannot exceed 10%");

        reserveWallet = _reserveWallet;
        platformFeeBps = _platformFeeBps;
        authorizedRelayer = _authorizedRelayer;

        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("FortniteFrameBadge")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    // ============ Primary External Function ============

    /**
     * @notice Mints a badge for a recipient with Fortnite stats verification
     * @dev Main entrypoint for Farcaster Frame v2 integration
     * @param recipient Address to receive the badge
     * @param fortniteHash Hash of Fortnite player stats (for verification)
     * @param priceWei Minimum price required in wei
     * @param deadline Signature expiration timestamp
     * @param backendSignature EIP-712 signature from authorized relayer
     */
    function mintBadge(
        address recipient,
        bytes32 fortniteHash,
        uint256 priceWei,
        uint256 deadline,
        bytes calldata backendSignature
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(recipient != address(0), "Recipient cannot be zero address");
        require(msg.value >= priceWei, "Insufficient payment");
        require(block.timestamp <= deadline, "Signature expired");
        require(!hasBadge[recipient][fortniteHash], "Badge already minted");

        // Verify backend signature
        bytes32 structHash = keccak256(
            abi.encode(
                MINT_BADGE_TYPEHASH,
                recipient,
                fortniteHash,
                priceWei,
                deadline,
                nonces[recipient]
            )
        );

        bytes32 digest = MessageHashUtils.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
        
        require(!usedSignatures[digest], "Signature already used");
        
        address signer = ECDSA.recover(digest, backendSignature);
        require(signer == authorizedRelayer, "Invalid signature");

        // Mark signature as used and increment nonce
        // IMPORTANT: Each signature is single-use. If a transaction fails after this point,
        // the client MUST request a new signature with the updated nonce value.
        // Do not cache or reuse signatures across failed transactions.
        usedSignatures[digest] = true;
        /**
         * IMPORTANT INTEGRATION NOTE:
         * - The recipient's nonce is part of the signed payload (see structHash construction).
         * - Once a signature is successfully verified, the nonce is incremented here.
         * - This makes each backend signature strictly single-use: it cannot be reused in
         *   a subsequent transaction, even if the original transaction fails/reverts later.
         *
         * Frontend / backend implication:
         * - If a mint transaction fails after this point, the client MUST request a new
         *   signature that uses the updated `nonces[recipient]` value.
         * - Do not cache and reuse old signatures across failed transactions; always fetch
         *   a fresh signature when the previous transaction does not succeed.
         */
        nonces[recipient]++;

        // Take platform fee and transfer to reserve wallet
        (uint256 netAmount, uint256 feeAmount) = _takePlatformFee(msg.value);

        // Mint badge to recipient
        hasBadge[recipient][fortniteHash] = true;

        emit BadgeMinted(recipient, fortniteHash, priceWei, feeAmount);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculates and transfers platform fee to reserve wallet
     * @dev Transfers fee using push pattern. Reserve wallet must be able to receive ETH.
     *      If reserve wallet is a contract, it must have receive() or fallback() function.
     * @param amount Total amount received
     * @return netAmount Amount after fee deduction (reserved for future use)
     * @return feeAmount Platform fee amount
     */
    function _takePlatformFee(uint256 amount) 
        internal 
        returns (uint256 netAmount, uint256 feeAmount) 
    {
        feeAmount = (amount * platformFeeBps) / 10_000;
        netAmount = amount - feeAmount;

        if (feeAmount > 0) {
            (bool success, ) = reserveWallet.call{value: feeAmount}("");
            require(success, "Platform fee transfer failed");
            
            emit PlatformFeeTaken(msg.sender, amount, feeAmount, reserveWallet);
        }

        return (netAmount, feeAmount);
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates the reserve wallet address
     * @param newWallet New reserve wallet address
     */
    function setReserveWallet(address payable newWallet) external onlyOwner {
        require(newWallet != address(0), "New wallet cannot be zero address");
        
        address oldWallet = reserveWallet;
        reserveWallet = newWallet;
        
        emit ReserveWalletUpdated(oldWallet, newWallet);
    }

    /**
     * @notice Updates the platform fee in basis points
     * @param newBps New fee in basis points (max 1000 = 10%)
     */
    function setPlatformFeeBps(uint16 newBps) external onlyOwner {
        require(newBps <= 1000, "Platform fee cannot exceed 10%");
        
        uint16 oldBps = platformFeeBps;
        platformFeeBps = newBps;
        
        emit PlatformFeeUpdated(oldBps, newBps);
    }

    /**
     * @notice Updates the authorized relayer address
     * @param newRelayer New authorized relayer address
     */
    function setAuthorizedRelayer(address newRelayer) external onlyOwner {
        address oldRelayer = authorizedRelayer;
        authorizedRelayer = newRelayer;
        
        emit AuthorizedRelayerUpdated(oldRelayer, newRelayer);
    }

    /**
     * @notice Pauses the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Withdraws contract balance to specified address
     * @param to Address to receive the funds
     * @param amount Amount to withdraw in wei
     */
    function withdraw(address payable to, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(to != address(0), "Withdrawal address cannot be zero");
        require(amount <= address(this).balance, "Insufficient contract balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit Withdraw(to, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Returns the current contract balance
     * @return Contract balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Checks if a user has a specific badge
     * @param user Address to check
     * @param fortniteHash Badge identifier hash
     * @return Whether the user has the badge
     */
    function checkBadge(address user, bytes32 fortniteHash) 
        external 
        view 
        returns (bool) 
    {
        return hasBadge[user][fortniteHash];
    }

    /**
     * @notice Gets the current nonce for a user (for signature generation)
     * @param user Address to check
     * @return Current nonce value
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    // ============ Receive Function ============

    /// @notice Emitted when ETH is received directly
    event Received(address indexed sender, uint256 amount);

    /**
     * @notice Allows contract to receive ETH directly
     * @dev Emits Received event for tracking unexpected ETH deposits
     */
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
}
