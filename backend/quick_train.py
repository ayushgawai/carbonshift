#!/usr/bin/env python3
"""
Quick 10-Minute GPU Training Script
Standalone script for rapid model training on Brev GPU instance
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import time
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SimpleResNet(nn.Module):
    """Lightweight ResNet-18 style model for CIFAR-10"""

    def __init__(self, num_classes=10):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=2)

        self.layer1 = self._make_layer(64, 128)
        self.layer2 = self._make_layer(128, 256)
        self.layer3 = self._make_layer(256, 512)

        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512, num_classes)

    def _make_layer(self, in_channels, out_channels):
        return nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2)
        )

    def forward(self, x):
        x = self.relu(self.bn1(self.conv1(x)))
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x


def create_synthetic_dataset(num_samples=10000, batch_size=64):
    """Create synthetic CIFAR-10 style dataset"""
    logger.info(f"Creating synthetic dataset: {num_samples} samples")
    X = torch.randn(num_samples, 3, 32, 32)
    y = torch.randint(0, 10, (num_samples,))

    dataset = TensorDataset(X, y)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=2)

    return dataloader


def train_model(duration_minutes=10):
    """
    Train model for specified duration

    Args:
        duration_minutes: Training duration in minutes
    """
    # Check GPU availability
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("=" * 70)
    logger.info(f"🚀 Quick Training Session Starting")
    logger.info(f"Device: {device}")

    if torch.cuda.is_available():
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        logger.warning("⚠️  No GPU detected! Training will be slow on CPU")

    logger.info(f"Duration: {duration_minutes} minutes")
    logger.info("=" * 70)

    # Initialize model
    logger.info("Initializing ResNet-18 model...")
    model = SimpleResNet(num_classes=10).to(device)
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    # Create dataset
    batch_size = 64
    num_samples = 10000
    dataloader = create_synthetic_dataset(num_samples=num_samples, batch_size=batch_size)

    # Training loop with time limit
    start_time = time.time()
    end_time = start_time + (duration_minutes * 60)

    epoch = 0
    total_steps = 0
    running_loss = 0.0

    logger.info("🔥 Training started!")
    logger.info("-" * 70)

    try:
        while time.time() < end_time:
            epoch += 1
            model.train()

            for batch_idx, (data, target) in enumerate(dataloader):
                # Check time limit
                if time.time() >= end_time:
                    break

                # Move to device
                data, target = data.to(device), target.to(device)

                # Forward pass
                optimizer.zero_grad()
                output = model(data)
                loss = criterion(output, target)

                # Backward pass
                loss.backward()
                optimizer.step()

                # Update metrics
                total_steps += 1
                running_loss = loss.item()

                # Log progress every 20 steps
                if total_steps % 20 == 0:
                    elapsed = time.time() - start_time
                    remaining = end_time - time.time()

                    logger.info(
                        f"Epoch {epoch:3d} | Step {total_steps:5d} | "
                        f"Loss: {loss.item():.4f} | "
                        f"Elapsed: {elapsed:.0f}s | Remaining: {remaining:.0f}s"
                    )

            logger.info(f"✓ Epoch {epoch} completed")

    except KeyboardInterrupt:
        logger.info("\n⚠️  Training interrupted by user")

    # Training complete
    elapsed_time = time.time() - start_time

    logger.info("-" * 70)
    logger.info("✅ Training Complete!")
    logger.info(f"Total Epochs: {epoch}")
    logger.info(f"Total Steps: {total_steps}")
    logger.info(f"Training Time: {elapsed_time:.1f}s ({elapsed_time/60:.1f} minutes)")
    logger.info(f"Final Loss: {running_loss:.4f}")
    logger.info(f"Steps/Second: {total_steps/elapsed_time:.2f}")

    if torch.cuda.is_available():
        logger.info(f"GPU Memory Used: {torch.cuda.max_memory_allocated()/1e9:.2f} GB")

    # Save checkpoint
    checkpoint_path = f"model_checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pth"
    torch.save({
        'epoch': epoch,
        'steps': total_steps,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'loss': running_loss,
    }, checkpoint_path)

    logger.info(f"💾 Checkpoint saved: {checkpoint_path}")
    logger.info("=" * 70)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Quick GPU Training Session')
    parser.add_argument(
        '--duration',
        type=int,
        default=10,
        help='Training duration in minutes (default: 10)'
    )

    args = parser.parse_args()

    train_model(duration_minutes=args.duration)
