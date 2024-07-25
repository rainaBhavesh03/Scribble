'use client'
import "../../styles/global.css";

const LoadingScreen: React.FC = () => {
  return (
    <div className={"loadingscreen"}>
      <div className={"loadingscreen_main"}></div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingScreen;

