import mongoose from 'mongoose';

let isConnected: boolean = false;

export async function connect() {
    if (isConnected) {
        console.log('Database connection already established');
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI || '', {});


        console.log("Connection established successfully");
    } catch (error: any) {
        console.log("Something went wrong in connecting to DB", error);
        process.exit(1);
    }
}

