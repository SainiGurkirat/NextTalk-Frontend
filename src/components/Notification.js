import React, { useState, useEffect } from 'react';

const Notification = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getNotificationClasses = () => {
    let baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white transition-all transform duration-300 ease-out z-50 min-w-[250px] max-w-sm";
    let typeClasses = "";

    switch (type) {
      case 'success':
        typeClasses = "bg-green-600";
        break;
      case 'error':
        typeClasses = "bg-red-600";
        break;
      case 'warning':
        typeClasses = "bg-yellow-600";
        break;
      case 'info':
      default:
        typeClasses = "bg-blue-600";
        break;
    }

    return `${baseClasses} ${typeClasses} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`;
  };

  return (
    <div className={getNotificationClasses()}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-lg">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            if (onClose) onClose();
          }}
          className="ml-4 text-white text-xl leading-none hover:text-gray-200"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;