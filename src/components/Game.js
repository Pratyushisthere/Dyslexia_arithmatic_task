import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;

const ProblemDisplay = styled.div`
  font-size: 2.5rem;
  margin: 2rem 0;
  color: #2c3e50;
  text-align: center;
`;

const VisualContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
`;

const ItemGroup = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-width: 300px;
`;

const Item = styled(motion.div)`
  width: 50px;
  height: 50px;
  background-color: #3498db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const AnswerInput = styled.input`
  font-size: 2rem;
  padding: 0.5rem;
  width: 100px;
  text-align: center;
  border: 2px solid #3498db;
  border-radius: 8px;
  margin: 1rem 0;
`;

const OperationSelector = styled.select`
  font-size: 1.5rem;
  padding: 0.5rem;
  margin: 1rem 0;
  border-radius: 8px;
  border: 2px solid #3498db;
`;

const ScoreDisplay = styled.div`
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 1rem 0;
`;

const ProgressContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 2rem 0;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: #eee;
  border-radius: 10px;
  overflow: hidden;
  margin: 0.5rem 0;
`;

const Progress = styled(motion.div)`
  height: 100%;
  background: #3498db;
  border-radius: 10px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #2c3e50;
`;

const FeedbackMessage = styled(motion.div)`
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 1rem 0;
  text-align: center;
`;

const DifficultyIndicator = styled.div`
  font-size: 1.2rem;
  color: #2c3e50;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Game = () => {
  const { 
    score, 
    setScore, 
    level, 
    operation, 
    setOperation, 
    generateProblem,
    updateUserPerformance,
    learningProgress,
    difficulty
  } = useGame();

  const [currentProblem, setCurrentProblem] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [mlFeedback, setMlFeedback] = useState('');

  useEffect(() => {
    setCurrentProblem(generateProblem());
  }, [operation, level]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const answer = parseInt(userAnswer);
    const isCorrect = answer === currentProblem.answer;

    if (isCorrect) {
      setScore(prev => prev + 10);
      setFeedback('Correct! 🎉');
      setMlFeedback('Great job! Keep going! 🌟');
    } else {
      setFeedback('Try again! 💪');
      setMlFeedback('Take your time, you can do it! 🎯');
    }

    await updateUserPerformance(currentProblem, answer, isCorrect);
    setUserAnswer('');
    setTimeout(() => {
      setCurrentProblem(generateProblem());
      setFeedback('');
      setMlFeedback('');
    }, 1500);
  };

  const renderItems = (count) => {
    return Array(count).fill(null).map((_, index) => (
      <Item
        key={index}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.1 }}
      >
        {index + 1}
      </Item>
    ));
  };

  const getProgressPercentage = (operation) => {
    const progress = learningProgress[operation];
    return progress.total > 0 ? (progress.correct / progress.total) * 100 : 0;
  };

  if (!currentProblem) return <div>Loading...</div>;

  return (
    <GameContainer>
      <ScoreDisplay>Score: {score} | Level: {level}</ScoreDisplay>
      
      <DifficultyIndicator>
        Difficulty: {'⭐'.repeat(difficulty)}
      </DifficultyIndicator>

      <OperationSelector 
        value={operation} 
        onChange={(e) => setOperation(e.target.value)}
      >
        <option value="addition">Addition (+)</option>
        <option value="subtraction">Subtraction (-)</option>
        <option value="multiplication">Multiplication (×)</option>
      </OperationSelector>

      <ProblemDisplay>
        {currentProblem.num1} {operation === 'addition' ? '+' : 
          operation === 'subtraction' ? '-' : '×'} {currentProblem.num2} = ?
      </ProblemDisplay>

      <VisualContainer>
        <ItemGroup>
          {renderItems(currentProblem.num1)}
        </ItemGroup>
        <ItemGroup>
          {renderItems(currentProblem.num2)}
        </ItemGroup>
      </VisualContainer>

      <form onSubmit={handleSubmit}>
        <AnswerInput
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="?"
        />
      </form>

      {feedback && (
        <FeedbackMessage
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {feedback}
        </FeedbackMessage>
      )}

      {mlFeedback && (
        <FeedbackMessage
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {mlFeedback}
        </FeedbackMessage>
      )}

      <ProgressContainer>
        <h3>Your Progress</h3>
        {Object.entries(learningProgress).map(([op, progress]) => (
          <div key={op}>
            <ProgressLabel>
              <span>{op.charAt(0).toUpperCase() + op.slice(1)}</span>
              <span>{progress.correct}/{progress.total}</span>
            </ProgressLabel>
            <ProgressBar>
              <Progress
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage(op)}%` }}
                transition={{ duration: 0.5 }}
              />
            </ProgressBar>
          </div>
        ))}
      </ProgressContainer>
    </GameContainer>
  );
};

export default Game; 