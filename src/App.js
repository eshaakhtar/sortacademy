// src/App.js
import { Routes, Route } from "react-router-dom";
import LandingHome from "./LandingHome";
import ModuleApp from "./ModuleApp";
import WhatIsSorting from "./WhatIsSorting";
import BubbleSortLesson from "./BubbleSortLesson";   
import SelectionSortLesson from "./SelectionSortLesson";
import InsertionSortLesson from "./InsertionSortLesson";
import MergeSortLesson from "./MergeSortLesson";
import QuickSortLesson from "./QuickSortLesson";
import VisualiserPracticePage from "./VisualiserPracticePage";
import QuizAssessmentPage from "./QuizAssessmentPage";
import GlossaryFeedbackPage from "./GlossaryFeedbackPage";
import { GuestProfileProvider } from "./guestProfile";
import "./LessonPage.contrast.css";


function App() {
  return (
    <GuestProfileProvider>
    <Routes>
      <Route path="/" element={<LandingHome />} />
      <Route path="/module" element={<ModuleApp />} />
      <Route path="/what-is-sorting" element={<WhatIsSorting />} />
      <Route path="/bubble-sort" element={<BubbleSortLesson />} /> 
      <Route path="/selection-sort" element={<SelectionSortLesson />} />
      <Route path="/insertion-sort" element={<InsertionSortLesson />} />
      <Route path="/merge-sort" element={<MergeSortLesson />} />
      <Route path="/quick-sort" element={<QuickSortLesson />} />
      <Route path="/visualiser" element={<VisualiserPracticePage />} />
      <Route path="/quiz-assessment" element={<QuizAssessmentPage />} />
      <Route path="/glossary-feedback" element={<GlossaryFeedbackPage />} />
    </Routes>
    </GuestProfileProvider>
  );
}

export default App;
