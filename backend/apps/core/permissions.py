"""
Custom permissions for EduCore.
"""
from rest_framework import permissions


class IsTenantAdmin(permissions.BasePermission):
    """Permission check for tenant administrators."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsTeacher(permissions.BasePermission):
    """Permission check for teachers."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'teacher']
        )


class IsParent(permissions.BasePermission):
    """Permission check for parents."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'parent'
        )


class IsStudent(permissions.BasePermission):
    """Permission check for students."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )


class IsSuperAdmin(permissions.BasePermission):
    """Permission check for superadmin (platform owner)."""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'superadmin'
        )

