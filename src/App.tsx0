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

