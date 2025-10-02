import React, { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode';
import { registerPlugin } from '@capacitor/core';
import type { PermissionStatus } from 'capacitor-permissions';

// تسجيل البلجنز
const BackgroundTask = registerPlugin('BackgroundTask');
const Permissions = registerPlugin('Permissions');

const App: React.FC = () => {
  const [micPermission, setMicPermission] = useState<boolean>(false);

  useEffect(() => {
    // تفعيل العمل في الخلفية
    BackgroundMode.enable();

    // طلب إذن الميكروفون
    Permissions.query({ name: 'microphone' }).then((result: PermissionStatus) => {
      if (result.state === 'granted') setMicPermission(true);
    });

    // طلب إذن الإشعارات
    LocalNotifications.requestPermissions().then((permission) => {
      if (permission.granted) {
        LocalNotifications.schedule({
          notifications: [
            {
              title: "وقت الأذكار",
              body: "حان وقت الأذكار اليومية!",
              id: 1,
              schedule: { at: new Date(new Date().getTime() + 5000) },
            }
          ]
        });
      }
    });

    // مهمة الخلفية
    (async () => {
      const taskId = await BackgroundTask.beforeExit(async () => {
        console.log("Running background task...");
      });
      await BackgroundTask.finish({ taskId });
    })();
  }, []);

  return (
    <div>
      <h1>تطبيق القرآن</h1>
      <p>الإشعارات والخلفية مفعلة.</p>
      <p>إذن الميكروفون: {micPermission ? 'مفعل' : 'غير مفعل'}</p>
    </div>
  );
};

export default App;
