import { createContext, useContext, useState } from "react";

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const [callType, setCallType] = useState(null);
  const [callData, setCallData] = useState(null);

  const startCall = ({ type, userId, targetUserId, role, targetName, offer }) => {
    setCallType(type);
    setCallData({ userId, targetUserId, role, targetName, offer });
  };

  const resetCall = () => {
    setCallType(null);
    setCallData(null);
  };

  return (
    <CallContext.Provider value={{ callType, setCallType, callData, setCallData, startCall, resetCall }}>
      {children}
    </CallContext.Provider>
  );
};
