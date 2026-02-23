#!/bin/bash

# GroceryStore Deployment Script for AWS EC2
# Usage: ./deploy.sh <SSH_KEY_PATH> <EC2_IP>

set -e

SSH_KEY="${1:-$HOME/grocery.pem}"
EC2_IP="${2:-54.90.91.72}"
EC2_USER="ubuntu"
APP_DIR="/home/ubuntu/apps/GroceryStore"

echo "🚀 Starting deployment to AWS EC2..."
echo "   EC2 IP: $EC2_IP"
echo "   SSH Key: $SSH_KEY"

# Function to run command on EC2
run_on_ec2() {
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" "$@"
}

# Step 1: Check connectivity
echo "✓ Checking EC2 connectivity..."
if ! run_on_ec2 "echo 'Connected to EC2'" > /dev/null; then
    echo "❌ Cannot connect to EC2. Check IP and security group."
    exit 1
fi

# Step 2: Install Docker
echo "✓ Installing Docker and Docker Compose..."
run_on_ec2 << 'DOCKER_INSTALL'
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
else
    echo "Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi
DOCKER_INSTALL

# Step 3: Clone repository
echo "✓ Cloning repository..."
run_on_ec2 << 'GIT_CLONE'
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps

if [ -d "GroceryStore" ]; then
    echo "Repository already cloned, pulling latest..."
    cd GroceryStore
    git pull origin ror/main
else
    git clone https://github.com/MahparaAmil/GroceryStore.git
    cd GroceryStore
    git checkout ror/main
fi
GIT_CLONE

# Step 4: Copy .env file
echo "✓ Setting up environment variables..."
if [ -f ".env" ]; then
    scp -i "$SSH_KEY" .env "$EC2_USER@$EC2_IP:$APP_DIR/.env"
    echo "✓ .env copied to EC2"
else
    echo "⚠️  .env file not found. Creating template..."
    scp -i "$SSH_KEY" .env.example "$EC2_USER@$EC2_IP:$APP_DIR/.env"
    echo "⚠️  Please edit .env on EC2 with your credentials:"
    echo "   ssh -i $SSH_KEY $EC2_USER@$EC2_IP"
    echo "   nano $APP_DIR/.env"
fi

# Step 5: Deploy with Docker Compose
echo "✓ Starting Docker containers..."
run_on_ec2 "cd $APP_DIR && docker-compose down; docker-compose up -d --build"

# Step 6: Run migrations
echo "✓ Running database migrations..."
sleep 10  # Wait for services to start
run_on_ec2 "cd $APP_DIR && docker-compose exec -T backend bundle exec rake db:migrate" || echo "⚠️  Migrations may have failed"

# Step 7: Check health
echo "✓ Checking application health..."
sleep 5
if run_on_ec2 "curl -s http://localhost/health" > /dev/null; then
    echo "✅ Application is healthy"
else
    echo "⚠️  Health check failed. Check logs:"
    echo "   ssh -i $SSH_KEY $EC2_USER@$EC2_IP"
    echo "   cd $APP_DIR && docker-compose logs -f"
fi

# Step 8: Setup systemd service
echo "✓ Setting up systemd service..."
run_on_ec2 << 'SYSTEMD_SETUP'
sudo tee /etc/systemd/system/grocery-docker.service > /dev/null << 'EOF'
[Unit]
Description=GroceryStore Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/home/ubuntu/apps/GroceryStore
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
RemainAfterExit=yes
User=ubuntu

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable grocery-docker.service
SYSTEMD_SETUP

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application URLs:"
echo "   Frontend: http://$EC2_IP"
echo "   API: http://$EC2_IP/api"
echo "   Backend: http://$EC2_IP:5000"
echo ""
echo "🔍 Next steps:"
echo "   1. SSH: ssh -i $SSH_KEY $EC2_USER@$EC2_IP"
echo "   2. Check logs: docker-compose logs -f"
echo "   3. Edit .env if needed: nano $APP_DIR/.env"
echo ""
echo "📝 View deployment guide: AWS_DEPLOYMENT.md"
