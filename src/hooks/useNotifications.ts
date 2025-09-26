import { useState } from 'react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: Notification['type'], message: string) => {
    const id = Date.now().toString();
    const notification = { id, type, message };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message: string) => addNotification('success', message);
  const showError = (message: string) => addNotification('error', message);
  const showInfo = (message: string) => addNotification('info', message);

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    removeNotification
  };
};