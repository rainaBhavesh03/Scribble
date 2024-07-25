import { connect } from "@/dbConfig/dbConfig";
import UserModel from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { sendEmail } from "@/helpers/mailer";
import ScoreModel from "@/models/Score";

connect();

export async function POST(request: NextRequest){
    try{
        const reqBody = await request.json();
        const {username, email, password} = reqBody;

        console.log(reqBody);

        // validation
        const existingUserVerifiedByUsername = await UserModel.findOne({username, isVerified: true});
        if(existingUserVerifiedByUsername){
            return NextResponse.json({success: false, message: "Username is already taken"}, {status: 500});
        }


        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const exisitingUserByEmail = await UserModel.findOne({email});
        if(exisitingUserByEmail){
            if(exisitingUserByEmail.isVerified){
                return NextResponse.json({error: "User already exists with this email"}, {status: 400});
            } else {

                // Need to decide which username to use - the one user used last time or the one used this time
                exisitingUserByEmail.password = hashedPassword;

                // send verification email
                const emailResponse = await sendEmail({email, emailType: "VERIFY", userId: exisitingUserByEmail._id});
                if(!emailResponse.response.startsWith('2')){
                    throw new Error("Error sending the new verification email");
                }
            }
        } else {

            const newUser = new UserModel({
                username,
                email,
                password: hashedPassword,
            });
            const savedUser = await newUser.save();

            // Create a new doc in the ScoreModel
            const newScore = new ScoreModel({
                userId: savedUser._id,
            });
            await newScore.save();

            // send verification email
            const emailResponse = await sendEmail({email, emailType: "VERIFY", userId: savedUser._id});
            if(!emailResponse.response.startsWith('2')){
                throw new Error("Error sending the verification email");
            }
        }


        return NextResponse.json({
            message: "User registered successfully. Please verify your email",
            success: true,
        }, {status: 201});
    } catch (error: any){
        console.log(error.message);
        return NextResponse.json({error: error.message}, {status: 500});
    }
}

