import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./Context/AppContext";
import { ProfileProvider } from "./Context/ProfileContext";
import { PatientProfileProvider } from "./Context/PatientProfileContext";
import { AppointmentProvider} from "./Context/AppointmentContext";
import App from "./App";
import "./index.css";
import 'react-quill/dist/quill.snow.css';
import ChatProvider from "./Context/ChatContext";
import { BlogProvider } from "./Context/BlogContext"; 
import { CallProvider } from "./Context/CallContext";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProvider>
      <ProfileProvider>
      <PatientProfileProvider>
      <AppointmentProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
          duration: 2500, // ⏱ 2.5 seconds
          }}
        />
        <ChatProvider>
        <BlogProvider>
          <CallProvider>
           <App />
        </CallProvider>
        </BlogProvider>
        </ChatProvider>
          
        </BrowserRouter>
      </AppointmentProvider>
      </PatientProfileProvider>
      </ProfileProvider>
    </AppProvider>
  </React.StrictMode>
);
