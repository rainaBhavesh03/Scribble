"use client"
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/authContext';

export default function LoginPage() {
    const { setIsLoggedIn } = useAuth();
    const router = useRouter();
    const [user, setUser] = useState({
        identifier: "",
        password: ""
    });
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [loading, setLoading] = useState(false);

    const onLogin = async () => {
        try{
            if(btnDisabled === true){
                return;
            }
            setLoading(true);
            setBtnDisabled(true);
            const response = await axios.post("/api/users/login", user);
            console.log("Login success", response.data);

            setIsLoggedIn(true);
            router.push('/profile');
        } catch (error: any){
            console.log("Login failed");
            toast.error(error.message);
        }
    }

    useEffect(() => {
        if(user.identifier.length>0 && user.password.length>0){
            setBtnDisabled(false);
        } else {
            setBtnDisabled(true);
        }
    }, [user]);
    

    // need to add the check isusernameunique

    return (
        <div className="login_content">
            <h1 className="login_title">{loading ? "Processing !!" : "Login"}</h1>
            <hr className="login_hr" />
            <label className="login_label" htmlFor="identifier">Email / UserName :</label>
            <input id="identifier" className="login_input" placeholder="email / username" value={user.identifier} onChange={(e) => setUser({...user, identifier: e.target.value})} type="text" />
            <label className="login_label" htmlFor="password">Password :</label>
            <input id="password" className="login_input" placeholder="password" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})} type="password" />

            <button className={`${btnDisabled ? "login_disabled" : "login_btn"}`} onClick={onLogin}>Log In</button>
            <Link href="/signup">Haven't registered yet?</Link>
        </div>
    )
}


