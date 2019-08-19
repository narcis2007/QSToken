pragma solidity ^0.5.0;

import "../ERC20Token/ERC20Token.sol";
import "./MetaToken.sol";

contract SenderPaysMetaToken is ERC20Token, MetaToken {// Sender pays relayer fee

    function transferWithProofSP(address _to, uint _value, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("transferWithProofSP", _to, _value, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        _transfer(metaSender, _to, _value);
        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;

        return true;
    }

    function transferFromWithProofSP(address _from, address _to, uint _value, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("transferFromWithProofSP", _from, _to, _value, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        uint _allowance = allowed[_from][metaSender];
        allowed[_from][metaSender] = safeSub(_allowance, _value);

        _transfer(_from, _to, _value);
        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }



}
