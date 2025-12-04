#!/bin/bash
set -e

echo "Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y gnupg curl

echo "Importing MongoDB public GPG key..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes

echo "Adding MongoDB repository..."
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

echo "Installing MongoDB..."
sudo apt-get update
sudo apt-get install -y mongodb-org

echo "Starting MongoDB..."
sudo systemctl start mongod
sudo systemctl enable mongod

echo "MongoDB installation complete!"
