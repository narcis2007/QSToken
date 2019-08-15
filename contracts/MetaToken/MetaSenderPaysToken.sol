pragma solidity ^0.5.0;

import "../ERC20Token/ERC20Token.sol";
import "./Meta.sol";

contract MetaSenderPaysToken is ERC20Token, Meta {// Sender pays relayer fee

    function transferWithProof(address _to, uint _value, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool ok) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked(_to, _value, _relayerFee, metaNonce[_metaSender]));

        require(metaSender != address(0x0));
        require(metaSender == _metaSender);

        _transfer(metaSender, _to, _value);
        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[_metaSender]++;

        return true;
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
