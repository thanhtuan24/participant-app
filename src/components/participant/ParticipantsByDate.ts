// src/components/ParticipantsByDate.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { CosmosClient } from '@azure/cosmos';


const databaseId: string = "<Your-Database-Id>";
const containerId: string = "<Your-Container-Id>";

interface Participant {
  userID: string;
  username: string;
  status: string;
}

const ParticipantsByDate: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [date, setDate] = useState<string>('');
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (date) {
      fetchParticipants(date);
    }
  }, [date]);

  const fetchParticipants = async (date: string) => {
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDate(event.target.value);
  };

  const handleAddUser = async () => {
    const newUser = {
      userID: 'user123',
      username: 'John Doe',
      participantDate: date,
      status: 'active'
    };

    fetchParticipants(date);
  };

  return (
    <div>
    </div>
);
};

export default ParticipantsByDate;
