
import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode

useEffect(() => {
  // تفعيل العمل في الخلفية
  BackgroundMode.enable();

  // إعداد إشعار تجريبي
  LocalNotifications.schedule({
    notifications: [
      {
        title: "وقت الأذكار",
        body: "حان وقت الأذكار اليومية!",
        id: 1,
        schedule: { at: new Date(new Date().getTime() + 5000) }, // بعد 5 ثواني للتجربة
      },
    ],
  });
}, []);

useEffect(() => {
  LocalNotifications.requestPermissions().then(permission => {
    if (permission.granted) {
      LocalNotifications.schedule({
        notifications: [
          {
            title: "اذكارك اليومية",
            body: "وقت اذكار اليوم!",
            id: 1,
            schedule: { at: new Date(new Date().getTime() + 1000 * 5) },
            sound: null,
            attachments: null,
            actionTypeId: "",
            extra: null
          }
        ]
      });
    }
  });
}, []);

const taskId = BackgroundTask.beforeExit(async () => {
  console.log("Running background task...");
  BackgroundTask.finish({ taskId });
});

