import { LocalNotifications } from '@capacitor/local-notifications';

// إعداد الإشعارات
export async function schedulePrayerNotifications() {
  await LocalNotifications.requestPermissions();

  await LocalNotifications.schedule({
    notifications: [
      {
        title: "وقت الصلاة",
        body: "حان الآن موعد الفجر",
        id: 1,
        schedule: { at: new Date(new Date().getTime() + 5000) }, // تجربة 5 ثواني
        sound: null,
        attachments: null,
        actionTypeId: "",
        extra: null
      },
      // تقدر تضيف باقي الصلوات بنفس الطريقة
    ]
  });
}

