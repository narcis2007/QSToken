pragma solidity ^0.5.0;

import "./ERC20Token/ERC20Token.sol";
import "./ERC20Token/Flavours/MintableToken.sol";
import "./ERC20Token/Flavours/BurnableToken.sol";
import "./MetaToken/Meta.sol";
import "./MetaToken/MetaSenderPaysToken.sol";





//TODO: make it more abstract and have the fee implemented by other contracts

contract MetaRPToken is ERC20Token, Meta {// Receiver pays relayer fee

    mapping(address => uint) maxAcceptedFee; // the receiver can control the fees only through this to not let a relayer steal tokens through this; gotta think about this more

    function transferWithProof(address _to, uint _value, uint8 v, bytes32 r, bytes32 s, address _metaSender) public returns (bool ok) {

        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked(_to, _value, relayerFee[msg.sender], metaNonce[_metaSender]));

        require(metaSender != address(0x0));
        require(metaSender == _metaSender);



    }

    //    function transferFromWithProof(address _from, address _to, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function approveWithProof(address _spender, uint _value, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function increaseApprovalWithProof(address _spender, uint _addedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }
    //
    //    function decreaseApprovalWithProof(address _spender, uint _subtractedValue, uint8 v, bytes32 r, bytes32 s) public returns (bool ok) {
    //
    //    }

}


contract MetaRSPToken is ERC20Token, Meta {//Receiver pays relayer fee through subscription

}


// TODO: prioritize sender pays becuase it's easier to handle

contract QSToken is MintableToken, BurnableToken, MetaSenderPaysToken { // TODO: add documentation for contracts/functions

    constructor() public {
        symbol = "QS";
        name = "QS";
        decimals = 8;
    }


}
