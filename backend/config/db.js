// import mongoose from 'mongoose';

// export const connectDB = async () => {
//     await mongoose.connect('mongodb+srv://taskmanagerV1:taskmanagerV1@cluster0.qt5p77s.mongodb.net/taskmanager')
//         .then(() => console.log('DB CONNECTED'));
// }


// import mongoose from 'mongoose';

// export async function connectDB() {
//     try {
//         if (!process.env.MONGO_URI) {
//             throw new Error('MONGO_URI is not defined in .env');
//         }
//         const conn = await mongoose.connect(process.env.MONGO_URI, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log(`MongoDB connected: ${conn.connection.host}`);
//         return conn;
//     } catch (err) {
//         console.error('MongoDB connection error:', err.message);
//         throw err; // Rethrow to be handled in server.js
//     }
// }


import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};