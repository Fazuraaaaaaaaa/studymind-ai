export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface GenerationResult {
  summary: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}