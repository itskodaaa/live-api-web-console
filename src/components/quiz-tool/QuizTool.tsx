import { type FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { useEffect, useState, memo } from 'react';
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

function QuizToolComponent() {
  const [quizData, setQuizData] = useState<QuizItem[]>([]);
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

  return (
    <div className='quiz-tool'>
      {quizData.length > 0 && <h3>Quiz Questions:</h3>}
      {quizData.map((quizItem, index) => (
        <div key={index} className='quiz-question'>
          <p>
            <strong>{`Q${index + 1}:`}</strong> {quizItem.question}
          </p>
          <ul>
            {quizItem.answers.map((answer, ansIndex) => (
              <li
                key={ansIndex}
                style={{
                  fontWeight: ansIndex === quizItem.correct_answer_index ? 'bold' : 'normal',
                }}>
                {answer}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export const QuizTool = memo(QuizToolComponent);
