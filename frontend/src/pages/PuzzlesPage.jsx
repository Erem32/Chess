import { getPuzzles, revealPuzzleSolution } from "../api/practice.js";
import PracticePage from "./PracticePage.jsx";

export default function PuzzlesPage() {
  return <PracticePage title="Puzzles" singular="Puzzle" loadExercises={getPuzzles} revealSolution={revealPuzzleSolution} />;
}
