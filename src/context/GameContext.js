import React, { createContext, useState, useContext, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [operation, setOperation] = useState('addition');
  const [model, setModel] = useState(null);
  const [userPerformance, setUserPerformance] = useState([]);
  const [difficulty, setDifficulty] = useState(1);
  const [learningProgress, setLearningProgress] = useState({
    addition: { correct: 0, total: 0 },
    subtraction: { correct: 0, total: 0 },
    multiplication: { correct: 0, total: 0 }
  });

  useEffect(() => {
    // Initialize TensorFlow.js model with more sophisticated architecture
    const initModel = async () => {
      const newModel = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [5], units: 20, activation: 'relu' }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 5, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });
      
      newModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      setModel(newModel);
    };

    initModel();
  }, []);

  const generateProblem = () => {
    // Adjust difficulty based on user performance
    const operationProgress = learningProgress[operation];
    const successRate = operationProgress.total > 0 
      ? operationProgress.correct / operationProgress.total 
      : 0.5;

    // Dynamically adjust max number based on success rate
    const maxNum = Math.min(
      5 + Math.floor(successRate * 15) + level * 2,
      20
    );

    const num1 = Math.floor(Math.random() * maxNum) + 1;
    const num2 = Math.floor(Math.random() * maxNum) + 1;
    
    let answer;
    switch(operation) {
      case 'addition':
        answer = num1 + num2;
        break;
      case 'subtraction':
        // Ensure positive result for subtraction
        answer = Math.max(num1, num2) - Math.min(num1, num2);
        break;
      case 'multiplication':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }

    return { num1, num2, answer };
  };

  const updateUserPerformance = async (problem, userAnswer, isCorrect) => {
    // Update learning progress
    setLearningProgress(prev => ({
      ...prev,
      [operation]: {
        correct: prev[operation].correct + (isCorrect ? 1 : 0),
        total: prev[operation].total + 1
      }
    }));

    // Prepare features for ML model
    const features = [
      problem.num1,
      problem.num2,
      userAnswer,
      level,
      difficulty
    ];

    const performance = {
      input: features,
      output: isCorrect ? 1 : 0
    };

    setUserPerformance(prev => [...prev, performance]);

    // Train model with new data
    if (model && userPerformance.length > 0) {
      const xs = tf.tensor2d(userPerformance.map(p => p.input));
      const ys = tf.tensor2d(userPerformance.map(p => p.output), [userPerformance.length, 1]);
      
      await model.fit(xs, ys, {
        epochs: 5,
        batchSize: 4,
        shuffle: true,
        validationSplit: 0.2
      });

      // Predict next difficulty level
      const prediction = model.predict(tf.tensor2d([features]));
      const predictedDifficulty = prediction.dataSync()[0];
      
      // Adjust difficulty based on prediction
      setDifficulty(prev => Math.max(1, Math.min(5, Math.round(predictedDifficulty * 5))));
    }

    // Update level based on performance
    if (isCorrect && score > 0 && score % 50 === 0) {
      setLevel(prev => prev + 1);
    }
  };

  const value = {
    score,
    setScore,
    level,
    setLevel,
    operation,
    setOperation,
    generateProblem,
    updateUserPerformance,
    learningProgress,
    difficulty
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}; 