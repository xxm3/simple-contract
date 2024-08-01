# Simple Oracle Contract

This is a simple Solana smart contract using the Anchor framework that provides an oracle price update mechanism. The contract ensures that each user can only call the `update_price` function a limited number of times within a specified period.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://project-serum.github.io/anchor/getting-started/installation.html)

### Installation

1. **Clone the repository:**

```sh
git clone <repository-url>
cd simple_oracle_contract


Install dependencies:
npm install


Build and Deploy

Before building make sure you update Anchor.toml with your provider url and key path: provider.cluster and provider.wallet

1. Build the program:
anchor build

2. Deploy the program to the local cluster:
anchor deploy

Running Tests
To run the provided tests, execute the following command:

anchor test

This command will compile the program, deploy it to the provider.cluster, and run the tests to ensure everything is working correctly.

NOTE: some tests require SOL deposit to test accounts, it is needed to prepare keys upfront export them to JSON, and reuse them in tests,
airdopSol can not be run in each test case due to limits, you get an error "You have requested too many airdrops. Wait 24 hours for a refill" 


