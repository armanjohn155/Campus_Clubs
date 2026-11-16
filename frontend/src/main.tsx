import "./styles/global.css";


import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import HomePage from "./pages/guest/home";
import ClubDetailsPage from "./pages/guest/club-details";


createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/clubs/:id" element={<ClubDetailsPage />} />
    </Routes>
  </BrowserRouter>,
)
