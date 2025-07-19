import { type FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { useEffect, useState, memo } from 'react';
import cn from "classnames";
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { ToolCall } from '../../multimodal-live-types';
import './quiz-tool.scss';

// Define the function declaration for the quiz tool
export const declaration: FunctionDeclaration = {
  name: 'create_quiz',
  description: 'Creates a quiz with a list of questions and their answers, then displays it to the user.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      quiz_data: {
        type: SchemaType.ARRAY,
        description: 'An array of quiz questions.',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: 'The quiz question text.',
            },
            answers: {
              type: SchemaType.ARRAY,
              description: 'An array of possible answers for the question.',
              items: {
                type: SchemaType.STRING,
                description: 'A single answer text.',
              },
            },
            correct_answer_index: {
              type: SchemaType.NUMBER,
              description: 'The zero-based index of the correct answer in the answers array.',
            },
          },
          required: ['question', 'answers', 'correct_answer_index'],
        },
      },
    },
    required: ['quiz_data'],
  },
};

type QuizItem = {
  question: string;
  answers: string[];
  correct_answer_index: number;
};

function QuizToolComponent({ className }: { className?: string }) {
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const { client } = useLiveAPIContext();

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      const fc = toolCall.functionCalls.find(
        (fc: { name: string }) => fc.name === declaration.name
      );
      if (fc) {
        const data = (fc.args as { quiz_data: QuizItem[] }).quiz_data;
        if (Array.isArray(data)) {
          setQuizData(data);
          setSelectedAnswers(new Array(data.length).fill(-1)); // Initialize selected answers
          setQuizSubmitted(false); // Reset submission status
        }
      }
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc: { id: any }) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200
        );
      }
    };
    client.on('toolcall', onToolCall);
    return () => {
      client.off('toolcall', onToolCall);
    };
  }, [client]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    if (!quizSubmitted) {
      const newSelectedAnswers = [...selectedAnswers];
      newSelectedAnswers[questionIndex] = answerIndex;
      setSelectedAnswers(newSelectedAnswers);
    }
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);

    const quizResults = quizData.map((quizItem, index) => ({
      question: quizItem.question,
      selectedAnswer: selectedAnswers[index] !== -1 ? quizItem.answers[selectedAnswers[index]] : 'No answer selected',
      isCorrect: selectedAnswers[index] === quizItem.correct_answer_index,
    }));

    client.send([{ text: `User submitted quiz results: ${JSON.stringify(quizResults)}` }]);
  };

  return (
    <div className={cn('quiz-tool', className)}>
      {quizData.length > 0 && <h3>Quiz Questions:</h3>}
      {quizData.map((quizItem, questionIndex) => (
        <div key={questionIndex} className='quiz-question'>
          <p>
            <strong>{`Q${questionIndex + 1}:`}</strong> {quizItem.question}
          </p>
          <ul>
            {quizItem.answers.map((answer, answerIndex) => (
              <li
                key={answerIndex}
                onClick={() => handleAnswerSelect(questionIndex, answerIndex)}
                className={
                  quizSubmitted && answerIndex === quizItem.correct_answer_index
                    ? 'correct-answer'
                    : quizSubmitted && selectedAnswers[questionIndex] === answerIndex && selectedAnswers[questionIndex] !== quizItem.correct_answer_index
                    ? 'incorrect-answer'
                    : selectedAnswers[questionIndex] === answerIndex
                    ? 'selected-answer'
                    : ''
                }
              >
                {answer}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {quizData.length > 0 && !quizSubmitted && (
        <button onClick={handleSubmitQuiz}>Submit Quiz</button>
      )}
    </div>
  );
}

export const QuizTool = memo(QuizToolComponent);
