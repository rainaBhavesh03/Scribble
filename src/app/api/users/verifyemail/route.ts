import { connect } from "@/dbConfig/dbConfig";
import UserModel from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

connect();

export async function POST(request: NextRequest){
    try{
        const reqBody = await request.json();
        const {token} = reqBody;
        // this token from the url is decoded hence in the database while saving the token we shoudn't save the encoded token.
        console.log('inside verify api: ', token);

        const user = await UserModel.findOne({verifyToken: token, verifyTokenExpiry: {$gt: Date.now()}});

        if(!user){
            return NextResponse.json({error: "Invalid token"}, {status: 400});
        }

        console.log(user);

        user.isVerified = true;
        user.verifyToken = null;
        user.verifyTokenExpiry = null;

        await user.save();

        return NextResponse.json({message: "Email verified successfully", success: true}, {status: 200});
    } catch (error: any){
        return NextResponse.json({error: error.message}, {status: 500});
    }
}


