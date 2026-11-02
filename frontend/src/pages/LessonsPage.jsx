import { getLessons } from "../api/practice.js";
import PracticePage from "./PracticePage.jsx";

export default function LessonsPage() {
  return <PracticePage title="Lessons" singular="Lesson" loadExercises={getLessons} />;
}
