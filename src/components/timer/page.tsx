import React from 'react';
import { useTimer } from 'react-timer-hook';

interface TimerProps {
  initialTime?: number; // Optional initial time in seconds (default: 0)
  onExpire?: () => void; // Optional callback function for timer expiration
}

export default function Timer({ initialTime = 30, onExpire }) {
  const {
    seconds,
    minutes,
  } = useTimer({ expiryTimestamp: new Date(Date.now() + initialTime * 1000), onExpire });

  const formattedTime = `${minutes.toString().padStart(2, '0')} : ${seconds.toString().padStart(2, '0')}`;

  return (
    <div>
      <span>{formattedTime}</span>
    </div>
  );
};
