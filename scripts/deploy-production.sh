#!/bin/bash

# Production Deployment Script for HabitStory
# This script handles the deployment process for self-hosted installations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="/opt/habitstory"
BACKUP_DIR="/opt/habitstory-backups"
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
ENV_FILE=".env.production"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for required commands
    for cmd in docker docker-compose git; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is not installed"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check for environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Copy .env.production.example to .env.production and configure it"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

backup_current() {
    log_info "Creating backup of current deployment..."
    
    # Create backup directory
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
    mkdir -p "$BACKUP_PATH"
    
    # Backup current deployment
    if [ -d "$DEPLOY_DIR" ]; then
        cp -r "$DEPLOY_DIR" "$BACKUP_PATH/"
        log_info "Backup created at $BACKUP_PATH"
    else
        log_warn "No existing deployment found to backup"
    fi
}

pull_latest() {
    log_info "Pulling latest code..."
    
    # Pull latest changes
    git pull origin main
    
    # Verify we're on main branch
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_error "Not on main branch. Current branch: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Get current commit hash
    COMMIT_HASH=$(git rev-parse --short HEAD)
    log_info "Deploying commit: $COMMIT_HASH"
}

build_images() {
    log_info "Building Docker images..."
    
    # Build production image
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Tag image with commit hash
    docker tag habitstory:latest "habitstory:$COMMIT_HASH"
    
    log_info "Images built successfully"
}

run_health_check() {
    log_info "Running health check..."
    
    # Wait for service to start
    sleep 10
    
    # Check health endpoint
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_info "Health check passed"
    else
        log_error "Health check failed"
        return 1
    fi
}

deploy() {
    log_info "Starting deployment..."
    
    # Stop current deployment
    if docker-compose -f $DOCKER_COMPOSE_FILE ps &> /dev/null; then
        log_info "Stopping current deployment..."
        docker-compose -f $DOCKER_COMPOSE_FILE down
    fi
    
    # Start new deployment
    log_info "Starting new deployment..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    # Run health check
    if ! run_health_check; then
        log_error "Deployment failed health check"
        rollback
        exit 1
    fi
    
    log_info "Deployment completed successfully"
}

rollback() {
    log_error "Rolling back deployment..."
    
    # Stop failed deployment
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Find previous image
    PREVIOUS_IMAGE=$(docker images habitstory --format "{{.Tag}}" | grep -v latest | head -n 1)
    
    if [ -n "$PREVIOUS_IMAGE" ]; then
        log_info "Rolling back to image: habitstory:$PREVIOUS_IMAGE"
        docker tag "habitstory:$PREVIOUS_IMAGE" habitstory:latest
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
    else
        log_error "No previous image found for rollback"
    fi
}

cleanup() {
    log_info "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Keep only last 3 tagged images
    docker images habitstory --format "{{.Tag}}" | grep -v latest | tail -n +4 | xargs -I {} docker rmi "habitstory:{}" || true
    
    # Clean up old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        ls -t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
    fi
    
    log_info "Cleanup completed"
}

# Main execution
main() {
    log_info "Starting HabitStory production deployment"
    
    check_prerequisites
    backup_current
    pull_latest
    build_images
    deploy
    cleanup
    
    log_info "Deployment completed successfully!"
    log_info "Access the application at: https://habitstory.app"
}

# Run main function
main "$@"