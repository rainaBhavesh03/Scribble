"use client"
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const router = useRouter();
    const [user, setUser] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const onSignup = async () => {
        try{
            if(btnDisabled === true){
                return;
            }
            setLoading(true);
            setBtnDisabled(true);

            if(user.password !== user.confirmPassword){
                throw new Error("Passwords don't match!!");
            }
            const response = await axios.post("/api/users/signup", user);
            console.log("Signup success", response.data);

            router.push('/login');
        } catch (error: any){
            console.log("Signup failed");
            toast.error(error.message);
            setBtnDisabled(false);
            setLoading(false);
        }
    }

    useEffect(() => {
        if(user.username.length>0 && user.email.length>0 && user.password.length>0){
            setBtnDisabled(false);
        } else {
            setBtnDisabled(true);
        }
    }, [user]);

    return (
        <div className="signup_content">
            <h1 className="signup_title">{loading ? "Processing !!" : "SignUp"}</h1>
            <hr className="signup_hr" />
            <label className="signup_label" htmlFor="username">UserName :</label>
            <input id="username" className="signup_input" placeholder="username" value={user.username} onChange={(e) => setUser({...user, username: e.target.value})} type="text" />
            <label className="signup_label" htmlFor="email">Email :</label>
            <input id="email" className="signup_input" placeholder="email" value={user.email} onChange={(e) => setUser({...user, email: e.target.value})} type="text" />
            <label className="signup_label" htmlFor="password">Password :</label>
            <input id="password" className="signup_input" placeholder="password" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})} type="password" />
            <label className="signup_label" htmlFor="confirmPassword">Confirm Password :</label>
            <input id="confirmPassword" className="signup_input" placeholder="password" value={user.confirmPassword} onChange={(e) => setUser({...user, confirmPassword: e.target.value})} type="password" />

            <button className={`${btnDisabled ? "signup_disabled" : "signup_btn"}`} onClick={onSignup}>Sign Up</button>
            <Link href="/login">Already Signed Up?</Link>
        </div>
    )
}


