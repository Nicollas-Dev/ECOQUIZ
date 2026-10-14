import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { HomePage } from "./pages/HomePage";
import { HostRoomPage } from "./pages/HostRoomPage";
import { JoinRoomPage } from "./pages/JoinRoomPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { StudentRoomPage } from "./pages/StudentRoomPage";
import { TracksPage } from "./pages/TracksPage";
import { OdsPage } from "./pages/OdsPage";
import { QuestionBankPage } from "./pages/QuestionBankPage";
import { QuizEditorPage } from "./pages/QuizEditorPage";
import { MyQuizzesPage } from "./pages/MyQuizzesPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/trilhas" element={<TracksPage />} />
        <Route path="/ods" element={<OdsPage />} />
        <Route path="/banco" element={<QuestionBankPage />} />
        <Route path="/quizzes/novo" element={<QuizEditorPage />} />
        <Route path="/quizzes/:id/editar" element={<QuizEditorPage />} />
        <Route path="/meus-quizzes" element={<MyQuizzesPage />} />
        <Route path="/professor/criar" element={<CreateRoomPage />} />
        <Route path="/professor/sala/:pin" element={<HostRoomPage />} />
        <Route path="/entrar" element={<JoinRoomPage />} />
        <Route path="/aluno/sala/:pin" element={<StudentRoomPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
