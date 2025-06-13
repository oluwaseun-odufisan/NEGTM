import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
    });
}

const sendPushNotification = async ({ to, title, body }) => {
    try {
        const message = {
            token: to,
            notification: {
                title,
                body,
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
        };
        const response = await admin.messaging().send(message);
        console.log(`Push notification sent to ${to}: ${response}`);
    } catch (error) {
        console.error(`Error sending push to ${to}:`, error.message);
        throw new Error('Failed to send push notification');
    }
};

export { sendPushNotification };