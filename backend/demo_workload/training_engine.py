"""
Training Engine - Workload Implementation
PyTorch training loop with dynamic pause/resume capabilities
Responds to grid conditions via Eco-Pulse Arbitration orchestrator
"""

import logging
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import os
import threading
import time
from typing import Optional, Dict
from config import config


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


class TrainingEngine:
    """
    Grid-aware training workload engine

    Features:
    - Checkpoint saving/loading for pause/resume
    - Progress tracking
    - Thread-safe operation
    - Configurable batch size and epochs
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Training state
        self.is_training = False
        self.is_paused = False
        self.should_stop = False
        self.training_thread = None

        # Model and optimizer
        self.model = None
        self.optimizer = None
        self.criterion = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Progress tracking
        self.current_epoch = 0
        self.current_step = 0
        self.total_steps = 0
        self.training_loss = 0.0

        # Checkpointing
        self.checkpoint_dir = config.CHECKPOINT_DIR
        os.makedirs(self.checkpoint_dir, exist_ok=True)

        self.logger.info(f"Training device: {self.device}")

    def _create_synthetic_dataset(self):
        """
        Create synthetic CIFAR-10 style dataset

        Production implementation would use:
        from torchvision import datasets, transforms
        dataset = datasets.CIFAR10(...)
        """
        # Generate random data (3x32x32 images, 10 classes)
        num_samples = config.DATASET_SIZE
        X = torch.randn(num_samples, 3, 32, 32)
        y = torch.randint(0, 10, (num_samples,))

        dataset = TensorDataset(X, y)
        dataloader = DataLoader(
            dataset,
            batch_size=config.BATCH_SIZE,
            shuffle=True,
            num_workers=0  # Avoid multiprocessing issues
        )

        self.total_steps = (num_samples // config.BATCH_SIZE) * config.NUM_EPOCHS
        return dataloader

    def _initialize_model(self):
        """Initialize model, optimizer, and loss"""
        self.model = SimpleResNet(num_classes=10).to(self.device)
        self.optimizer = optim.Adam(self.model.parameters(), lr=config.LEARNING_RATE)
        self.criterion = nn.CrossEntropyLoss()

        self.logger.info("Model initialized")

    def start_training(self):
        """Start training in background thread"""
        if self.is_training:
            self.logger.warning("Training already in progress")
            return False

        # Reset flags
        self.should_stop = False
        self.is_paused = False
        self.is_training = True

        # Start training thread
        self.training_thread = threading.Thread(target=self._training_loop, daemon=True)
        self.training_thread.start()

        self.logger.info("✅ Training started")
        return True

    def pause_training(self):
        """Pause training and save checkpoint"""
        if not self.is_training or self.is_paused:
            return False

        self.is_paused = True
        self._save_checkpoint()
        self.logger.info("⏸️  Training paused - checkpoint saved")
        return True

    def resume_training(self):
        """Resume training from checkpoint"""
        if not self.is_paused:
            return False

        self.is_paused = False
        self.logger.info("▶️  Training resumed")
        return True

    def stop_training(self):
        """Stop training completely"""
        self.should_stop = True
        self.is_training = False
        self.is_paused = False
        self.logger.info("🛑 Training stopped")

        if self.training_thread:
            self.training_thread.join(timeout=5)

        return True

    def _training_loop(self):
        """Main training loop (runs in background thread)"""
        try:
            # Initialize if needed
            if self.model is None:
                self._initialize_model()

            # Load checkpoint if exists
            self._load_checkpoint()

            # Create dataset
            dataloader = self._create_synthetic_dataset()

            # Training loop
            for epoch in range(self.current_epoch, config.NUM_EPOCHS):
                if self.should_stop:
                    break

                self.current_epoch = epoch
                self.model.train()

                for batch_idx, (data, target) in enumerate(dataloader):
                    # Check for pause/stop
                    while self.is_paused and not self.should_stop:
                        time.sleep(1)  # Wait while paused

                    if self.should_stop:
                        break

                    # Move to device
                    data, target = data.to(self.device), target.to(self.device)

                    # Forward pass
                    self.optimizer.zero_grad()
                    output = self.model(data)
                    loss = self.criterion(output, target)

                    # Backward pass
                    loss.backward()
                    self.optimizer.step()

                    # Update progress
                    self.current_step += 1
                    self.training_loss = loss.item()

                    # Save checkpoint periodically
                    if self.current_step % config.CHECKPOINT_INTERVAL_STEPS == 0:
                        self._save_checkpoint()

                    # Log progress
                    if self.current_step % 10 == 0:
                        progress = (self.current_step / self.total_steps) * 100
                        self.logger.debug(
                            f"Epoch {epoch+1}/{config.NUM_EPOCHS} | "
                            f"Step {self.current_step}/{self.total_steps} | "
                            f"Loss: {loss.item():.4f} | "
                            f"Progress: {progress:.1f}%"
                        )

            # Training complete
            self.is_training = False
            self.logger.info("✅ Training completed successfully!")

        except Exception as e:
            self.logger.error(f"Training error: {e}")
            self.is_training = False
            raise

    def _save_checkpoint(self):
        """Save training checkpoint"""
        if self.model is None:
            return

        checkpoint_path = os.path.join(self.checkpoint_dir, "model_checkpoint.pth")

        checkpoint = {
            "epoch": self.current_epoch,
            "step": self.current_step,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "loss": self.training_loss,
        }

        torch.save(checkpoint, checkpoint_path)
        self.logger.debug(f"Checkpoint saved: {checkpoint_path}")

    def _load_checkpoint(self):
        """Load training checkpoint if exists"""
        checkpoint_path = os.path.join(self.checkpoint_dir, "model_checkpoint.pth")

        if not os.path.exists(checkpoint_path):
            self.logger.info("No checkpoint found, starting fresh")
            return

        try:
            checkpoint = torch.load(checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])
            self.optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
            self.current_epoch = checkpoint["epoch"]
            self.current_step = checkpoint["step"]
            self.training_loss = checkpoint["loss"]

            self.logger.info(
                f"Checkpoint loaded: Epoch {self.current_epoch}, "
                f"Step {self.current_step}"
            )
        except Exception as e:
            self.logger.error(f"Failed to load checkpoint: {e}")

    def get_progress(self) -> Dict:
        """Get current training progress"""
        if self.total_steps == 0:
            progress_percent = 0.0
        else:
            progress_percent = (self.current_step / self.total_steps) * 100

        return {
            "is_training": self.is_training,
            "is_paused": self.is_paused,
            "current_epoch": self.current_epoch,
            "total_epochs": config.NUM_EPOCHS,
            "current_step": self.current_step,
            "total_steps": self.total_steps,
            "progress_percent": round(progress_percent, 2),
            "training_loss": round(self.training_loss, 4),
            "device": str(self.device),
        }


# Global training engine instance
training_engine = TrainingEngine()


if __name__ == "__main__":
    # Test training engine
    logging.basicConfig(level=logging.INFO)

    print("Training Engine Test")
    print("=" * 50)

    training_engine.start_training()

    # Let it train for 10 seconds
    time.sleep(10)
    print(f"\nProgress: {training_engine.get_progress()}")

    # Pause
    training_engine.pause_training()
    time.sleep(2)

    # Resume
    training_engine.resume_training()
    time.sleep(10)

    # Stop
    training_engine.stop_training()
    print(f"\nFinal Progress: {training_engine.get_progress()}")
