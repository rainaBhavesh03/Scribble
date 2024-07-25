'use client'

import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react"

export default function VerifyEmailPage (){
    const searchParams = useSearchParams();
    const [token, setToken] = useState(""); // This is the verifyToken and not the jwt token
    const [verified, setVerified] = useState(false);
    const [error,setError] = useState(false);

    const verify = async () => {
        try{
        await axios.post("/api/users/verifyemail", {token});
        setVerified(true);
        } catch (error: any){
            setError(true);
            console.log(error.response.data);
        }
    }

    useEffect(() => {
        setToken(searchParams.get('token') || "");
    }, []);

    useEffect(() => {
        if(token.length > 0){
            verify();
        }
    }, [token]);
    
    return (
        <div>
            <h1>Verify Email Page</h1>
            <p>This component makes use of the useEffect hook and to get the token using useSearchParams hook to get the token from the url and then directly calling the verify function from another useEffect hook.<br/>
            <strong>It would obviously be better to use a button and have the user click it to trigger the verify function after getting the token from the url.</strong>
            This can be an issue because spam detection tools/programs click and open the links in the verification emails sent to users, leading to false verification.<br/>
            But for simplicity sake, I haven't implemented the button logic.</p>
            <br/>
            {verified && (
                <h2><strong>User has been Verified !!</strong></h2>
            )}
            {error && (
                <h2><strong>Error !!</strong></h2>
            )}
        </div>
    )
}

