import { Route, Routes } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import SpecsListPage from "./pages/Spec";

function App() {
  return (
    <>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/spec" element={<SpecsListPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
