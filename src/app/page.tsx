"use client";

import { useState } from "react";
import Play from "../components/play/page";

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
        
        <p>need to implement check for user begin signed in or not before letting them play</p>
        
        {isPlaying ? (
            <Play setIsPlaying={setIsPlaying}></Play>
            ) : (
            <button onClick={() => setIsPlaying(true)}>Play</button>
            )
        }
            
    </div>
  );
}
