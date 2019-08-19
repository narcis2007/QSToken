pragma solidity ^0.5.0;

import "../ERC20Token/ERC20Token.sol";
import "./Meta.sol";

contract MetaSenderPaysToken is ERC20Token, Meta {// Sender pays relayer fee

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

    function approveWithProofSP(address _spender, uint _value, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("approveWithProofSP", _spender, _value, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender, 0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        if ((_value != 0) && (allowed[metaSender][_spender] != 0)) revert();

        allowed[metaSender][_spender] = _value;
        emit Approval(metaSender, _spender, _value);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }

    function increaseApprovalWithProofSP(address _spender, uint _addedValue, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("increaseApprovalWithProofSP", _spender, _addedValue, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        allowed[metaSender][_spender] = safeAdd(allowed[metaSender][_spender], _addedValue);
        emit Approval(metaSender, _spender, allowed[metaSender][_spender]);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }

    function decreaseApprovalWithProofSP(address _spender, uint _subtractedValue, uint8 v, bytes32 r, bytes32 s, uint _relayerFee, address _metaSender) public returns (bool) {
        address metaSender = getAddressFromSignature(v, r, s, abi.encodePacked("decreaseApprovalWithProofSP", _spender, _subtractedValue, _relayerFee, metaNonce[_metaSender]));
        require(metaSender == _metaSender);

        uint oldValue = allowed[metaSender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[metaSender][_spender] = 0;
        } else {
            allowed[metaSender][_spender] = safeSub(oldValue, _subtractedValue);
        }
        emit Approval(metaSender, _spender, allowed[metaSender][_spender]);

        _transfer(metaSender, msg.sender, _relayerFee);

        metaNonce[metaSender]++;
        return true;
    }


}
