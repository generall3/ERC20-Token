// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GrokToken is AccessControl {
    string public name = "GrokToken";
    string public symbol = "GTN";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000000 * (10 ** decimals);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    mapping(address => uint256) public _balances;
    mapping(address => mapping(address => uint256)) public _allowances;

    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _balances[msg.sender] = totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }

    function transfer(address _to, uint _value) public  returns (bool success) {
        require(_value <= _balances[msg.sender], "Caller's account balance doesn't have enough tokens");
        require(_to != address(0), "Address _to shouldn't be the zero address");
        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(_to != address(0), "Address _to shouldn't be the zero address");
        require(_value <= _balances[_from], "Not enough tokens on the account to make transfer");
        require(_value <= _allowances[_from][msg.sender], "Not enough allowance");
        _balances[_from] -= _value;
        _allowances[_from][msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns(bool succes) {
        require(_spender != address(0), "Address _spender shouldn't be the zero address");
        _allowances[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns(uint256 remaining) {
        return _allowances[_owner][_spender];
    }

    function mint(address _account, uint256 _amount) public returns (bool success) {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(_account != address(0), "Address _account shouldn't be the zero address");
        _balances[_account] += _amount;
        totalSupply += _amount;
        emit Transfer(address(0), msg.sender, _amount);
        return true;
    }

    function burn(address _account, uint256 _amount) public returns (bool success) {
        require(hasRole(BURNER_ROLE, msg.sender), "Caller is not a burner");
        require(_account != address(0), "Address _account shouldnt't be the zero address");
        require(_amount <= _balances[_account], "Account should have enough tokens");
        _balances[_account] -= _amount;
        totalSupply -= _amount;
        emit Transfer(_account, address(0), _amount);
        return true;
    }
}