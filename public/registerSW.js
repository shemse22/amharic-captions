// Cleanup old Vite registerSW
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (var i = 0; i < registrations.length; i++) {
      registrations[i].unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (var name of names) caches.delete(name);
    });
  }
}

