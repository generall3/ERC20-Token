import { run, ethers, network } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { expect } from "chai";

describe("Token", function () {
  let accounts: Signer[];
  let clean : any; // snapshot
  let contract: any;
  let owner : any, addr1 : any;

  before(async function() {
    await run("compile");
    [owner, addr1] = await ethers.getSigners();
    const GrokToken = await ethers.getContractFactory("GrokToken");
    contract = await GrokToken.deploy();
    await contract.deployed();

    clean = await network.provider.request({
        method: "evm_snapshot",
        params: []
    });
  }); 

  afterEach(async  function() {
    clean = await network.provider.request({
        method: "evm_revert",
        params: [clean],
    });

    clean = await network.provider.request({
      method: 'evm_snapshot',
      params: []
    });
  });

  describe("Basic properties", () => {
    it("Name should be GrokToken", async () => {
      expect(await contract.name()).to.eq("GrokToken");
    });

    it("Symbol should be KDVT", async () => {
      expect(await contract.symbol()).to.eq("GTN");
    });

    it("Check owner balance", async () => {
      const ownerBalance = ethers.BigNumber.from(
        await contract.balanceOf(owner.address)
      );
      expect(await contract.totalSupply()).to.eq(ownerBalance);
    });

    it("Random user has zero on his/her balance", async () => {
      expect(await contract.balanceOf(addr1.address)).to.be.equal(0);
    });
  });

  describe("Transfer", () => {
    it("Correct transfer call increases balance", async () => {
      await contract.connect(owner).transfer(addr1.address, 1);
      expect(await contract.balanceOf(addr1.address)).to.eq(1);
    });

    it("Correct transfer call decreases balance", async () => {
      const balanceBefore = await contract.balanceOf(owner.address);
      await contract.connect(owner).transfer(addr1.address, 1);
      expect(await contract.balanceOf(owner.address)).to.eq(balanceBefore.sub(1));
    });

    it("Transfer to zero address should revert", async() => {
      expect(contract.transfer(ethers.constants.AddressZero, 1)).to.be.revertedWith("_to shouldn't be 0x0 address");
    });

    it("Transfer of more tokens that user have should revert", async() => {
      expect(contract.transfer(addr1.address, 100000000000)).to.be.revertedWith("Caller's account balance doesn't have enough tokens");
    });

    it("Transfer event should be emitted", async() => {
      expect(contract.transfer(addr1.address, 1)).to.be.emit(contract, "Transfer");
    });
  });

  describe("TransferFrom", () => {
    it("Correct transferFrom call should change balanceOf and allowances addresses", async () => {
      let ownerBalanceBefore = ethers.BigNumber.from(await contract.balanceOf(owner.address));
      let tokensToSend = 6;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      await contract.connect(addr1).transferFrom(owner.address, addr1.address, tokensToSend);

      expect(await contract.balanceOf(owner.address)).to.eq(ownerBalanceBefore.sub(tokensToSend));
      expect(await contract.balanceOf(addr1.address)).to.eq(tokensToSend);
      expect(await contract.allowance(owner.address, addr1.address)).to.eq(approvedTokens - tokensToSend);
    });

    it("TransferFrom with no balance should't change balanceIf addresses", async() => {
      let tokensToSend = 6;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      expect(contract.transferFrom(addr1.address, owner.address, tokensToSend)).to.be.revertedWith("Not enough tokens on the balance to make transfer");
    });

    it("TransferFrom to zero address shouldn't work", async () => {
      let tokensToSend = 6;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      expect(contract.connect(addr1).transferFrom(owner.address, ethers.constants.AddressZero, tokensToSend)).to.be.revertedWith("_to shouldn't be 0x0 address");
    });

    it("TransferFrom with not enough allowance shouldn't work", async () => {
      let tokensToSend = 11;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      expect(contract.connect(addr1).transferFrom(owner.address, addr1.address, tokensToSend)).to.be.revertedWith("Not enough allowance");
    });

    it("TransferFrom should emit Transfer event", async () => {
      let tokensToSend = 6;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      expect(contract.connect(addr1).transferFrom(owner.address, addr1.address, tokensToSend)).to.be.emit(contract, "Transfer");
    });
  });

  describe("Approve&Allowances", () => {
    it("Approve to zero address shouldn't work", async () => {
      let approvedTokens = 10;
      expect(contract.approve(ethers.constants.AddressZero, approvedTokens)).to.be.revertedWith("_spender can't be the zero address");
    });

    it("Approve should emit Approval event", async () => {
      let approvedTokens = 10;
      expect(contract.approve(addr1.address, approvedTokens)).to.be.emit(contract, "Approval");
    });

    it("Approve should increase balance _allowance", async () => {
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      expect(await contract.allowance(owner.address, addr1.address)).to.equal(approvedTokens);
    });

    it("Approve should decrease balance _allowances", async () => {
      let tokensToSend = 5;
      let approvedTokens = 10;
      await contract.approve(addr1.address, approvedTokens);
      await contract.connect(addr1).transferFrom(owner.address, addr1.address, tokensToSend);
      expect( await contract.allowance(owner.address, addr1.address)).to.equal(approvedTokens - tokensToSend);
    });
  });

  describe("Mint", () => {
    it("Only minter can call function", async () => {
      let mintTokens = 10;
      expect(contract.connect(addr1).mint(addr1.address, mintTokens)).to.be.revertedWith("Caller is not a minter");
    });

    it("Mint to zero address shouldn't work", async () => {
      let mintTokens = 10;
      expect(contract.mint(ethers.constants.AddressZero, mintTokens)).to.be.revertedWith("_to address can't be zero address");
    });

    it("Mint should emit Transfer event", async () => {
      let mintTokens = 10;
      expect(contract.mint(addr1.address, mintTokens)).to.be.emit(contract, "Transfer");
    });

    it("Correct mint should increase balanceOf address and totalSupply", async () => {
      const before = await contract.balanceOf(owner.address);
      const totalSupplyBefore = await contract.totalSupply();
      let mintTokens = 10;
      await contract.mint(owner.address, mintTokens);
      const after = await contract.balanceOf(owner.address);
      const totalSupplyAfter = await contract.totalSupply();

      expect(after).to.equal(before.add(mintTokens));
      expect(totalSupplyAfter).to.equal(totalSupplyBefore.add(mintTokens));
    });
  });

  describe("Burn", () => {
    it("Only burner can call function", async () => {
      let burnTokens = 10;
      expect(contract.connect(addr1).burn(owner.address, burnTokens)).to.be.revertedWith("Caller is not a burner");
    });

    it("Burner from zero address shouldn't work", async () => {
      let burnTokens = 10;
      expect(contract.burn(ethers.constants.AddressZero, burnTokens)).to.be.revertedWith("From address can't be zero address");
    });

    it("Burn should emit Transfer event", async () => {
      let burnTokens = 10;
      expect(contract.burn(owner.address, burnTokens)).to.be.emit(contract, "Transfer");
    });

    it("Correct burn should decrease balanceOf address and totalSupply", async () => {
      const before = await contract.balanceOf(owner.address);
      const totalSupplyBefore = await contract.totalSupply();
      let burnTokens = 10;
      await contract.burn(owner.address, burnTokens);
      const after = await contract.balanceOf(owner.address);
      const totalSupplyAfter = await contract.totalSupply();

      expect(after).to.equal(before.sub(burnTokens));
      expect(totalSupplyAfter).to.equal(totalSupplyBefore.sub(burnTokens));
    });
  });
});