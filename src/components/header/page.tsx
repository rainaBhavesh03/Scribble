'use client'
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";


export default function Header() {
    const router = useRouter();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    async function checkLogin() {
        const res = await axios.get('/api/users/checklogin');
        setIsLoggedIn(res.data.success);
    }
        
    useEffect(() => {
        checkLogin();
    }, []);

    const handleLogout = async () => {
        try{
            const response = await axios.get("/api/users/logout", );
            console.log('logout done', response);

            setIsLoggedIn(false);
            router.push('/');
        } catch (error: any){
            console.log('Logout failed');
            toast.error(error.message);
        }
    }

    return (
        <header>
            <nav>
                {isLoggedIn ? (
                    <>
                        <Link href="/">Home</Link>
                        <Link href="/profile">Profile</Link>
                        <button onClick={handleLogout}>Log Out</button>
                    </>
                ) : (
                    <>
                        <Link href="/login">Log In</Link>
                        <Link href="/signup">Sign Up</Link>
                    </>
                )}
            </nav>
        </header>
    );
};
