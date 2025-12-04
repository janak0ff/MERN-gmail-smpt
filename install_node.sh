#!/bin/bash
set -e

echo "Installing Node.js prerequisites..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

echo "Importing NodeSource GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "Adding NodeSource repository..."
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

echo "Installing Node.js..."
sudo apt-get update
sudo apt-get install -y nodejs

echo "Node.js installation complete!"
node -v
npm -v
