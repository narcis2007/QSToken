pragma solidity ^0.5.0;

/*
 * ERC20 interface
 * see https://github.com/ethereum/EIPs/issues/20
 */
contract IERC20 {
    uint public totalSupply;

    function balanceOf(address who) public view returns (uint);

    function allowance(address owner, address spender) public view returns (uint);

    function transfer(address to, uint value) public returns (bool ok);

    function transferFrom(address from, address to, uint value) public returns (bool ok);

    function approve(address spender, uint value) public returns (bool ok);

    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint value);
}