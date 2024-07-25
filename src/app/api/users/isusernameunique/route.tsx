import { z } from "zod";
import { usernameValidation } from "@/schemas/signUpSchema";
import { connect } from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import UserModel from "@/models/User";

const usernameQuerySchema = z.object({
    username: usernameValidation
});

export async function GET (request: NextRequest){

    await connect();

    try{
        const { searchParams } = new URL(request.url);

        // validation with zod - requires the parameter to be an object
        const queryParam = {
            username: searchParams.get('username')
        }
        const result = usernameQuerySchema.safeParse(queryParam);
        console.log(result);
        if(!result.success){
            const usernameErrors = result.error.format().username?._errors || [];
            return NextResponse.json({
                success: false,
                message: usernameErrors?.length > 0 ? usernameErrors.join(',') : 'Invalid query parameters'
            },
            {status: 400});
        }

        const { username } = result.data;
        const existingVerifiedUser = await UserModel.findOne({username: username, isVerified: true});

        if(existingVerifiedUser){
            return NextResponse.json({
                success: false,
                message: "Username is already taken"
            },
            {status: 400});
        }

        return NextResponse.json({
            success: true,
            message: "Username is available"
        },
        {status: 201});
    } catch (error: any){
        console.log("Error checking username", error);
        return NextResponse.json({message: "Error checking username", success: false}, {status: 500});
    }
}
