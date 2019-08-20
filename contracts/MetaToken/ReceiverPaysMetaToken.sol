pragma solidity ^0.5.0;

import "./MetaToken.sol";
import "../ERC20Token/ERC20Token.sol";

contract ReceiverPaysMetaToken is ERC20Token, MetaToken {

    mapping(address => uint) relayerFee;
    mapping(address => uint) maxAcceptedFee; // the receiver can control the fees only through this to not let a relayer steal tokens through this or set a fee too high

    //maybe send the proof that the merchant agreed with the fee? -> would make this less efficient though
    function transferWithProofRP(address _to, uint _value, uint8 v, bytes32 r, bytes32 s, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("transferWithProofRP", _to, _value, metaNonce[_metaSender]));

        uint _relayerFee = relayerFee[msg.sender];

        require(metaSender == _metaSender);
        require(_relayerFee < _value); // to mitigate the security issue when a relayer sends micropayments to drain tokens from a receiver
        require(_relayerFee <= maxAcceptedFee[_to] );

        _transfer(metaSender, _to, _value);
        _transfer(_to, msg.sender, _relayerFee);

        metaNonce[metaSender]++;

        return true;
    }

    function transferFromWithProofRP(address _from, address _to, uint _value, uint8 v, bytes32 r, bytes32 s, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("transferFromWithProofRP", _from, _to, _value, metaNonce[_metaSender]));

        uint _relayerFee = relayerFee[msg.sender];

        require(metaSender == _metaSender);
        require(_relayerFee < _value); // to mitigate the security issue when a relayer sends micropayments to drain tokens from a receiver
        require(_relayerFee <= maxAcceptedFee[_to] );

        uint _allowance = allowed[_from][metaSender];
        allowed[_from][metaSender] = safeSub(_allowance, _value);

        _transfer(_from, _to, _value);
        _transfer(_to, msg.sender, _relayerFee);

        metaNonce[metaSender]++;

        return true;
    }


    function setMaxAcceptedFeeWithProof(uint _maxAcceptedFee, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public {

        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("setMaxAcceptedFeeWithProof", _maxAcceptedFee, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        maxAcceptedFee[metaSender] = _maxAcceptedFee;

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
    }

    function setMaxAcceptedFee(uint fee) public {
        maxAcceptedFee[msg.sender] = fee;
    }

    function getMaxAcceptedFee(address who) public view returns (uint) {
        return maxAcceptedFee[who];
    }

    function setRelayerFee(uint fee) public {
        relayerFee[msg.sender] = fee;
    }

    function getRelayerFee(address who) public view returns (uint) {
        return relayerFee[who];
    }


}
