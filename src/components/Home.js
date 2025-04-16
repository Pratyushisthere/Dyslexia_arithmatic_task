import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
`;

const Title = styled(motion.h1)`
  font-size: 3rem;
  color: #2c3e50;
  margin-bottom: 2rem;
`;

const Description = styled(motion.p)`
  font-size: 1.5rem;
  color: #34495e;
  max-width: 600px;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const StartButton = styled(motion.button)`
  font-size: 1.5rem;
  padding: 1rem 2rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #2980b9;
  }
`;

const FeaturesList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 2rem 0;
  text-align: left;
`;

const Feature = styled(motion.li)`
  font-size: 1.2rem;
  color: #34495e;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:before {
    content: "✨";
  }
`;

const Home = () => {
  const navigate = useNavigate();

  return (
    <HomeContainer>
      <Title
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Math Adventure
      </Title>

      <Description
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Welcome to a fun and interactive math game designed specifically for learners with dyslexia.
        Practice basic math operations with visual aids and adaptive learning.
      </Description>

      <FeaturesList
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Feature>Visual representation of numbers</Feature>
        <Feature>Simple and clear interface</Feature>
        <Feature>Adaptive difficulty levels</Feature>
        <Feature>Instant feedback and encouragement</Feature>
      </FeaturesList>

      <StartButton
        onClick={() => navigate('/game')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Start Learning
      </StartButton>
    </HomeContainer>
  );
};

export default Home; 