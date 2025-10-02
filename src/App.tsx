import React, { useEffect, useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode';
import { registerPlugin } from '@capacitor/core';
import { Permissions } from '@capacitor/permissions';

const BackgroundTask = registerPlugin('BackgroundTask');

const App: React.FC = () => {
  const [micPermission, setMicPermission] = useState<boolean>(false);

  useEffect(() => {
    // تفعيل العمل في الخلفية
    BackgroundMode.enable();

    // طلب إذن الميكروفون
    Permissions.query({ name: 'microphone' }).then(result => {
      if (result.state === 'granted') setMicPermission(true);
    });

    // طلب إذن الإشعارات
    LocalNotifications.requestPermissions().then(permission => {
      if (permission.granted) {
        LocalNotifications.schedule({
          notifications: [
            {
              title: "وقت الأذكار",
              body: "حان وقت الأذكار اليومية!",
              id: 1,
              schedule: { at: new Date(new Date().getTime() + 5000) },
              sound: undefined,
              attachments: undefined,
              actionTypeId: undefined,
              extra: undefined
            }
          ]
        });
      }
    });

    // تفعيل مهمة الخلفية
    const taskId = BackgroundTask.beforeExit(async () => {
      console.log("Running background task...");
      BackgroundTask.finish({ taskId });
    });
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
