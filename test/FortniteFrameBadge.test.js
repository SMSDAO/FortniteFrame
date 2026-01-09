const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FortniteFrameBadge", function () {
  let contract;
  let owner;
  let reserveWallet;
  let relayer;
  let user;
  let addrs;

  const PLATFORM_FEE_BPS = 250; // 2.5%
  const MINT_PRICE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, reserveWallet, relayer, user, ...addrs] = await ethers.getSigners();

    const FortniteFrameBadge = await ethers.getContractFactory("FortniteFrameBadge");
    contract = await FortniteFrameBadge.deploy(
      reserveWallet.address,
      PLATFORM_FEE_BPS,
      relayer.address
    );
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the correct reserve wallet", async function () {
      expect(await contract.reserveWallet()).to.equal(reserveWallet.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await contract.platformFeeBps()).to.equal(PLATFORM_FEE_BPS);
    });

    it("Should set the correct authorized relayer", async function () {
      expect(await contract.authorizedRelayer()).to.equal(relayer.address);
    });

    it("Should revert if reserve wallet is zero address", async function () {
      const FortniteFrameBadge = await ethers.getContractFactory("FortniteFrameBadge");
      await expect(
        FortniteFrameBadge.deploy(ethers.ZeroAddress, PLATFORM_FEE_BPS, relayer.address)
      ).to.be.revertedWith("Reserve wallet cannot be zero address");
    });

    it("Should revert if platform fee exceeds 10%", async function () {
      const FortniteFrameBadge = await ethers.getContractFactory("FortniteFrameBadge");
      await expect(
        FortniteFrameBadge.deploy(reserveWallet.address, 1001, relayer.address)
      ).to.be.revertedWith("Platform fee cannot exceed 10%");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update reserve wallet", async function () {
      const newWallet = addrs[0].address;
      await expect(contract.setReserveWallet(newWallet))
        .to.emit(contract, "ReserveWalletUpdated")
        .withArgs(reserveWallet.address, newWallet);

      expect(await contract.reserveWallet()).to.equal(newWallet);
    });

    it("Should prevent non-owner from updating reserve wallet", async function () {
      await expect(
        contract.connect(user).setReserveWallet(addrs[0].address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to update platform fee", async function () {
      const newFee = 500; // 5%
      await expect(contract.setPlatformFeeBps(newFee))
        .to.emit(contract, "PlatformFeeUpdated")
        .withArgs(PLATFORM_FEE_BPS, newFee);

      expect(await contract.platformFeeBps()).to.equal(newFee);
    });

    it("Should revert if new platform fee exceeds 10%", async function () {
      await expect(contract.setPlatformFeeBps(1001)).to.be.revertedWith(
        "Platform fee cannot exceed 10%"
      );
    });

    it("Should allow owner to update authorized relayer", async function () {
      const newRelayer = addrs[0].address;
      await expect(contract.setAuthorizedRelayer(newRelayer))
        .to.emit(contract, "AuthorizedRelayerUpdated")
        .withArgs(relayer.address, newRelayer);

      expect(await contract.authorizedRelayer()).to.equal(newRelayer);
    });

    it("Should allow owner to pause and unpause", async function () {
      await contract.pause();
      expect(await contract.paused()).to.be.true;

      await contract.unpause();
      expect(await contract.paused()).to.be.false;
    });
  });

  describe("Badge Minting", function () {
    let domain;
    let types;
    let fortniteHash;
    let deadline;
    let nonce;

    beforeEach(async function () {
      const contractAddress = await contract.getAddress();
      const chainId = (await ethers.provider.getNetwork()).chainId;

      domain = {
        name: "FortniteFrameBadge",
        version: "1",
        chainId: chainId,
        verifyingContract: contractAddress,
      };

      types = {
        MintBadge: [
          { name: "recipient", type: "address" },
          { name: "fortniteHash", type: "bytes32" },
          { name: "priceWei", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      };

      fortniteHash = ethers.keccak256(ethers.toUtf8Bytes("player1-stats"));
      deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      nonce = await contract.getNonce(user.address);
    });

    async function generateSignature(recipient, hash, price, deadlineTime, nonceValue) {
      const value = {
        recipient: recipient,
        fortniteHash: hash,
        priceWei: price,
        deadline: deadlineTime,
        nonce: nonceValue,
      };

      return await relayer.signTypedData(domain, types, value);
    }

    it("Should mint a badge with valid signature", async function () {
      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        nonce
      );

      const initialBalance = await ethers.provider.getBalance(reserveWallet.address);

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          deadline,
          signature,
          { value: MINT_PRICE }
        )
      )
        .to.emit(contract, "BadgeMinted")
        .withArgs(user.address, fortniteHash, MINT_PRICE, MINT_PRICE * BigInt(PLATFORM_FEE_BPS) / 10000n);

      // Check badge ownership
      expect(await contract.hasBadge(user.address, fortniteHash)).to.be.true;

      // Check platform fee was sent to reserve wallet
      const finalBalance = await ethers.provider.getBalance(reserveWallet.address);
      const expectedFee = MINT_PRICE * BigInt(PLATFORM_FEE_BPS) / 10000n;
      expect(finalBalance - initialBalance).to.equal(expectedFee);
    });

    it("Should revert with insufficient payment", async function () {
      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        nonce
      );

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          deadline,
          signature,
          { value: MINT_PRICE / 2n }
        )
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert with expired signature", async function () {
      const expiredDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        expiredDeadline,
        nonce
      );

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          expiredDeadline,
          signature,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Signature expired");
    });

    it("Should revert with invalid signature", async function () {
      const wrongSigner = addrs[0];
      const signature = await wrongSigner.signTypedData(domain, types, {
        recipient: user.address,
        fortniteHash: fortniteHash,
        priceWei: MINT_PRICE,
        deadline: deadline,
        nonce: nonce,
      });

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          deadline,
          signature,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Invalid signature");
    });

    it("Should prevent duplicate badge minting", async function () {
      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        nonce
      );

      // First mint should succeed
      await contract.connect(user).mintBadge(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        signature,
        { value: MINT_PRICE }
      );

      // Second mint should fail
      const newDeadline = Math.floor(Date.now() / 1000) + 3600;
      const newNonce = await contract.getNonce(user.address);
      const newSignature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        newDeadline,
        newNonce
      );

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          newDeadline,
          newSignature,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Badge already minted");
    });

    it("Should prevent signature replay", async function () {
      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        nonce
      );

      // First use should succeed
      await contract.connect(user).mintBadge(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        signature,
        { value: MINT_PRICE }
      );

      // Create a different badge to bypass "already minted" check
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("player2-stats"));
      
      // Try to reuse the same signature (should fail at signature validation)
      await expect(
        contract.connect(user).mintBadge(
          user.address,
          newHash,
          MINT_PRICE,
          deadline,
          signature,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Signature already used");
    });

    it("Should not mint when paused", async function () {
      await contract.pause();

      const signature = await generateSignature(
        user.address,
        fortniteHash,
        MINT_PRICE,
        deadline,
        nonce
      );

      await expect(
        contract.connect(user).mintBadge(
          user.address,
          fortniteHash,
          MINT_PRICE,
          deadline,
          signature,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Send some ETH to contract
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: ethers.parseEther("1"),
      });
    });

    it("Should allow owner to withdraw", async function () {
      const withdrawAmount = ethers.parseEther("0.5");
      const recipient = addrs[0].address;
      const initialBalance = await ethers.provider.getBalance(recipient);

      await expect(contract.withdraw(recipient, withdrawAmount))
        .to.emit(contract, "Withdraw")
        .withArgs(recipient, withdrawAmount);

      const finalBalance = await ethers.provider.getBalance(recipient);
      expect(finalBalance - initialBalance).to.equal(withdrawAmount);
    });

    it("Should prevent non-owner from withdrawing", async function () {
      await expect(
        contract.connect(user).withdraw(user.address, ethers.parseEther("0.1"))
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("Should revert withdrawal to zero address", async function () {
      await expect(
        contract.withdraw(ethers.ZeroAddress, ethers.parseEther("0.1"))
      ).to.be.revertedWith("Withdrawal address cannot be zero");
    });

    it("Should revert withdrawal of more than balance", async function () {
      const balance = await ethers.provider.getBalance(await contract.getAddress());
      await expect(
        contract.withdraw(addrs[0].address, balance + 1n)
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("View Functions", function () {
    it("Should return correct balance", async function () {
      const amount = ethers.parseEther("1");
      await owner.sendTransaction({
        to: await contract.getAddress(),
        value: amount,
      });

      expect(await contract.getBalance()).to.equal(amount);
    });

    it("Should check badge ownership", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      expect(await contract.checkBadge(user.address, hash)).to.be.false;
    });

    it("Should return correct nonce", async function () {
      expect(await contract.getNonce(user.address)).to.equal(0);
    });
  });
});
