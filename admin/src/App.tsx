import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/LoginPage";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard";
import Allergens from "./pages/Allergens";
import Conditions from "./pages/Conditions";
import Preferences from "./pages/Preferences";
import Prompts from "./pages/Prompts";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/allergens" element={<Allergens />} />
        <Route path="/conditions" element={<Conditions />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/prompts" element={<Prompts />} />
      </Routes>
    </BrowserRouter>
  );
}
