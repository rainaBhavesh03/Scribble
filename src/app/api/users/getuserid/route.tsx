import { verifyToken } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest){
    try{
        const jwtToken = request.cookies.get('token');
        console.log(jwtToken);

        const token = jwtToken?.value;

        const payload = await verifyToken(token!);
        if(payload){
            console.log(payload!.id);
        return NextResponse.json({
            userId: payload!.id,
            success: true,
        }, { status: 200 });
        } else {
            throw new Error("No payload");
        }
    } catch (error: any){
        console.error('Unexpected error', error);

        console.log(error.message);
        return NextResponse.json({
            userId: "",
            success: false,
        }, { status: 500 });
    }
}

