const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'cardcraft-studio-485208',
});

const db = admin.firestore();

async function checkUser(email) {
    try {
        // Query for user by email
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();

        if (snapshot.empty) {
            console.log(`❌ No user found with email: ${email}`);
            return;
        }

        snapshot.forEach(doc => {
            const userData = doc.data();
            console.log('\n📋 User Data:');
            console.log('UID:', doc.id);
            console.log('Email:', userData.email);
            console.log('Plan:', userData.plan);
            console.log('Is Admin:', userData.isAdmin);
            console.log('Created At:', userData.createdAt?.toDate());
            console.log('Last Login:', userData.lastLogin?.toDate());
            console.log('\n✅ Full user object:', JSON.stringify(userData, null, 2));
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking user:', error);
        process.exit(1);
    }
}

const email = process.argv[2] || process.env.ADMIN_BOOTSTRAP_EMAIL;

if (!email) {
    console.error('Usage: node check-user.js <email>');
    process.exit(1);
}

console.log(`\n🔍 Checking user: ${email}`);
checkUser(email);
