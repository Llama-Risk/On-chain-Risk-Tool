// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TroveManager {
    // Public boolean variable to indicate if the contract is paused or not
    bool public paused;

    // Event to log when the contract is paused
    event Paused();

    // Event to log when the contract is unpaused
    event Unpaused();

    // Function to set the paused state
    function setPaused(bool _paused) public {
        // Ensure the caller has the appropriate permissions to modify the paused state
        // You may want to implement a more sophisticated access control mechanism
        // For simplicity, anyone can pause or unpause the contract in this example
        if (paused != _paused) {
            paused = _paused;

            // Emit the appropriate event based on the state change
            if (_paused) {
                emit Paused();
            } else {
                emit Unpaused();
            }
        }
    }
}