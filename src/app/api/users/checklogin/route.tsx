import { verifyToken } from "@/middleware";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest){
    try{
        const jwtToken = request.cookies.get('token');
        console.log(jwtToken);

        if(!jwtToken){
            return NextResponse.json({
                message: "User not logged in",
                success: false,
            }, { status: 200 });
        }

        const token = jwtToken?.value;

        const payload = await verifyToken(token);
        if(payload){
            return NextResponse.json({
                message: "User logged in",
                success: true
            }, { status: 200 });
        } else {
            throw new Error("Jwt token invalid");
        }
    } catch (error: any){
        console.error('Invalid JWT token:', error);

        const response = NextResponse.json({
            message: "Unexpected failure",
            success: false,
        }, { status: 200 });
        response.cookies.set("token", "", {
            httpOnly: true,
            expires: new Date(0), // Set the expiration to a past date
            path: '/',
            sameSite: 'strict'
        });

        return response;
    }
}
