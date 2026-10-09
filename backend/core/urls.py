from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


from django.conf import settings
from django.conf.urls.static import static

def health_check(request):
    return JsonResponse({"status": "ok", "message": "Minivers API"})


urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('authentication.urls')),
    path('api/personal/', include('modules.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

