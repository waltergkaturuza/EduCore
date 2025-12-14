"""
Core models and base classes.
"""
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Abstract base model with created and updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Abstract base model with soft delete functionality."""
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    def soft_delete(self):
        """Soft delete the instance."""
        self.deleted_at = timezone.now()
        self.is_deleted = True
        self.save(update_fields=['deleted_at', 'is_deleted'])
    
    def restore(self):
        """Restore a soft-deleted instance."""
        self.deleted_at = None
        self.is_deleted = False
        self.save(update_fields=['deleted_at', 'is_deleted'])
    
    class Meta:
        abstract = True


class BaseModel(TimeStampedModel, SoftDeleteModel):
    """Base model combining timestamps and soft delete."""
    
    class Meta:
        abstract = True




