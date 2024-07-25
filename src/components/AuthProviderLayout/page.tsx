import { Inter } from "next/font/google";
import LoadingScreen from "../LoadingScreen/page";
import Header from "../header/page";
import { useAuth } from "@/context/authContext";

const inter = Inter({ subsets: ["latin"] });

export default function AuthProviderLayout({
        children,
    }: Readonly<{
        children: React.ReactNode;
    }>) {

  const { loading } = useAuth();

    return (
        <html lang="en">
            <body className={inter.className}>
               {loading ? (
                    <LoadingScreen /> // Display loading screen while checking authentication
                    ) : (
                    <>
                      <Header />
                      {children}
                    </>
                    )
                }
            </body>
        </html>
    );
}
