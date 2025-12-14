"""
Serializers for Tenant app.
"""
from rest_framework import serializers
from .models import Tenant, TenantSettings


class TenantSettingsSerializer(serializers.ModelSerializer):
    """Serializer for tenant settings."""
    
    class Meta:
        model = TenantSettings
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model."""
    
    settings = TenantSettingsSerializer(read_only=True)
    is_subscription_active = serializers.ReadOnlyField()
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'code', 'email', 'phone', 'address',
            'city', 'province', 'school_type', 'established_year', 'logo',
            'subscription_plan', 'subscription_start', 'subscription_end',
            'max_students', 'max_teachers', 'is_active', 'timezone',
            'language', 'current_academic_year', 'settings',
            'is_subscription_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'slug')


class TenantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new tenant."""
    
    class Meta:
        model = Tenant
        fields = [
            'name', 'code', 'email', 'phone', 'address', 'city',
            'province', 'school_type', 'established_year'
        ]
    
    def create(self, validated_data):
        """Create tenant and generate slug."""
        name = validated_data['name']
        slug = name.lower().replace(' ', '-').replace("'", '')
        # Ensure uniqueness
        base_slug = slug
        counter = 1
        while Tenant.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        validated_data['slug'] = slug
        tenant = Tenant.objects.create(**validated_data)
        
        # Create default settings
        TenantSettings.objects.create(tenant=tenant)
        
        return tenant




