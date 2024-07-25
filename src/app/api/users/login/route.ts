import { connect } from "@/dbConfig/dbConfig";
import UserModel from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

connect();

export async function POST(request: NextRequest) {
    try {
        const { identifier, password } = await request.json();

        // Find user by email or username
        const user = await UserModel.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return NextResponse.json({ error: "User does not exist" }, { status: 400 });
        }
        console.log("User exists");

        // Check password
        const validPassword = await bcryptjs.compare(password, user.password);

        if (!validPassword) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
        }

        console.log("password is valid");

        // Verify user is activated (if applicable)
        if (!user.isVerified) {
            return NextResponse.json({ error: "Account not verified" }, { status: 403 });
        }

        console.log("User is verified");

        // I have only used one jwt token instead of two to keep things simple
        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email
        };
        const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: '1d' });
        console.log("token signed");
        const response = NextResponse.json({
            message: "Logged in successfully",
            success: true
        });
        response.cookies.set("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60, // 1 day
            path: '/', // Cookie available for the entire application
            sameSite: 'strict' // Mitigate CSRF attacks
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

