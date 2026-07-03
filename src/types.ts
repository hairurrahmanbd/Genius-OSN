export type SubjectType = "IPA" | "IPS" | "Matematika";

export interface Question {
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  trick: string;
}

export interface QuizConfig {
  subject: SubjectType;
  topics: string[];
  count: number;
  difficulty: string;
  approach: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
}

export type QuizStage = "landing" | "setup" | "loading" | "quiz" | "result" | "bermain";

export interface UserAnswer {
  questionIndex: number;
  selectedOption: number | null; // 0, 1, 2, 3 or null if skipped
  isCorrect: boolean | null; // null if not checked yet
  checked: boolean;
}
