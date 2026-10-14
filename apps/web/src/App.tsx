import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { HomePage } from "./pages/HomePage";
import { HostRoomPage } from "./pages/HostRoomPage";
import { JoinRoomPage } from "./pages/JoinRoomPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudentRoomPage } from "./pages/StudentRoomPage";
import { TracksPage } from "./pages/TracksPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trilhas" element={<TracksPage />} />
        <Route path="/professor/criar" element={<CreateRoomPage />} />
        <Route path="/professor/sala/:pin" element={<HostRoomPage />} />
        <Route path="/entrar" element={<JoinRoomPage />} />
        <Route path="/aluno/sala/:pin" element={<StudentRoomPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
