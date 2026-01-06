const hre = require("hardhat");

/**
 * Deploy script for FortniteFrameBadge contract
 * 
 * This script deploys the badge minting contract to Base network
 * with the gxqstudio.eth reserve wallet and configurable parameters.
 */
async function main() {
  console.log("🚀 Deploying FortniteFrameBadge contract to Base...\n");

  // Configuration
  const RESERVE_WALLET = process.env.RESERVE_WALLET || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"; // gxqstudio.eth resolved
  const PLATFORM_FEE_BPS = process.env.PLATFORM_FEE_BPS || "250"; // 2.5%
  const AUTHORIZED_RELAYER = process.env.AUTHORIZED_RELAYER || ""; // Backend signer address

  console.log("📋 Deployment Configuration:");
  console.log("   Reserve Wallet (gxqstudio.eth):", RESERVE_WALLET);
  console.log("   Platform Fee:", (parseInt(PLATFORM_FEE_BPS) / 100).toFixed(2) + "%");
  console.log("   Authorized Relayer:", AUTHORIZED_RELAYER || "Not set");
  console.log();

  // Validate parameters
  if (!RESERVE_WALLET || RESERVE_WALLET === "0x0000000000000000000000000000000000000000") {
    throw new Error("❌ RESERVE_WALLET must be set to a valid address");
  }

  if (!AUTHORIZED_RELAYER) {
    throw new Error("❌ AUTHORIZED_RELAYER must be set for production deployments. Set this environment variable to the backend signer address that will generate EIP-712 signatures.");
  }

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying from account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log();

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const FortniteFrameBadge = await hre.ethers.getContractFactory("FortniteFrameBadge");
  const contract = await FortniteFrameBadge.deploy(
    RESERVE_WALLET,
    parseInt(PLATFORM_FEE_BPS),
    AUTHORIZED_RELAYER
  );

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ FortniteFrameBadge deployed to:", contractAddress);
  console.log();

  // Display contract info
  console.log("📄 Contract Details:");
  console.log("   Owner:", await contract.owner());
  console.log("   Reserve Wallet:", await contract.reserveWallet());
  console.log("   Platform Fee:", await contract.platformFeeBps(), "bps");
  console.log("   Authorized Relayer:", await contract.authorizedRelayer());
  console.log();

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contract: "FortniteFrameBadge",
    address: contractAddress,
    deployer: deployer.address,
    reserveWallet: RESERVE_WALLET,
    platformFeeBps: PLATFORM_FEE_BPS,
    authorizedRelayer: AUTHORIZED_RELAYER,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  console.log("💾 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
  console.log();

  // Verification reminder
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("📝 To verify the contract on Basescan, run:");
    console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress} "${RESERVE_WALLET}" ${PLATFORM_FEE_BPS} "${AUTHORIZED_RELAYER}"`);
    console.log();
  }

  console.log("🎉 Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
