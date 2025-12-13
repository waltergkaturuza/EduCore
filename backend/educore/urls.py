"""
URL configuration for EduCore project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="EduCore API",
      default_version='v1',
      description="Multi-tenant School Management System API",
      terms_of_service="https://www.educore.com/terms/",
      contact=openapi.Contact(email="contact@educore.com"),
      license=openapi.License(name="Proprietary"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # API Routes
    path('api/auth/', include('apps.users.urls')),
    path('api/tenants/', include('apps.tenants.urls')),
    path('api/academics/', include('apps.academics.urls')),
    path('api/students/', include('apps.students.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/assessments/', include('apps.assessments.urls')),
    path('api/fees/', include('apps.fees.urls')),
    path('api/communications/', include('apps.communications.urls')),
    path('api/lms/', include('apps.lms.urls')),
    path('api/superadmin/', include('apps.superadmin.urls')),
    path('api/schooladmin/', include('apps.schooladmin.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

