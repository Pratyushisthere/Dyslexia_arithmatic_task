// Game state
let gameState = {
    score: 0,
    level: 1,
    operation: 'addition',
    difficulty: 1,
    learningProgress: {
        addition: { correct: 0, total: 0 },
        subtraction: { correct: 0, total: 0 },
        multiplication: { correct: 0, total: 0 }
    },
    userPerformance: [],
    model: null,
    imageCache: {}, // Cache for AI-generated images
    currentFruit: 'banana', // Track the current fruit being used
    performanceHistory: [], // Track performance over time
    graphInstance: null, // Store the Chart.js instance
    mixedOperations: false, // Flag to indicate if we're using mixed operations
    // RL parameters
    rlState: {
        states: [], // State history for RL
        actions: [], // Action history for RL
        rewards: [], // Reward history for RL
        qTable: {}, // Q-table for RL
        learningRate: 0.1,
        discountFactor: 0.9,
        explorationRate: 0.2
    },
    // Neural Network parameters
    neuralNetwork: {
        model: null,
        inputFeatures: 5, // Number of input features
        hiddenLayers: [10, 5], // Hidden layer sizes
        outputSize: 1, // Output size (probability of correct answer)
        trainingData: [],
        batchSize: 4,
        epochs: 5
    }
};

// DOM Elements
const homeScreen = document.getElementById('home-screen');
const gameScreen = document.getElementById('game-screen');
const startGameBtn = document.getElementById('start-game');
const backHomeBtn = document.getElementById('back-home');
const operationSelect = document.getElementById('operation');
const problemDisplay = document.getElementById('problem-display');
const answerOptions = document.getElementById('answer-options');
const feedbackContainer = document.getElementById('feedback');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const difficultyElement = document.getElementById('difficulty');
const additionProgress = document.getElementById('addition-progress');
const subtractionProgress = document.getElementById('subtraction-progress');
const multiplicationProgress = document.getElementById('multiplication-progress');
const additionBar = document.getElementById('addition-bar');
const subtractionBar = document.getElementById('subtraction-bar');
const multiplicationBar = document.getElementById('multiplication-bar');
const graphTypeSelect = document.getElementById('graph-type');
const refreshGraphBtn = document.getElementById('refresh-graph');
const mlInsightsContent = document.getElementById('ml-insights-content');

// Fruit images for visualizations
const fruitImages = {
    banana: 'https://cdn.pixabay.com/photo/2016/01/03/17/59/bananas-1119790_1280.jpg',
    apple: 'https://cdn.pixabay.com/photo/2016/11/30/15/00/apples-1868496_1280.jpg',
    orange: 'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1961552_1280.jpg',
    strawberry: 'https://cdn.pixabay.com/photo/2016/04/01/09/29/cartoon-1299393_1280.png',
    grape: 'https://cdn.pixabay.com/photo/2016/08/11/08/04/vegetables-1585060_1280.jpg',
    watermelon: 'https://cdn.pixabay.com/photo/2016/07/07/15/09/watermelon-1498625_1280.jpg',
    pineapple: 'https://cdn.pixabay.com/photo/2016/04/01/09/29/cartoon-1299393_1280.png',
    cherry: 'https://cdn.pixabay.com/photo/2016/04/01/09/29/cartoon-1299393_1280.png'
};

// Fallback images in case the main images fail to load
const fallbackImages = {
    fruits: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyNSIgZmlsbD0iI2YxYzQwZiIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjUiIHI9IjUiIGZpbGw9IiM4YjQ1MzEiLz48L3N2Zz4=',
    animals: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyNSIgZmlsbD0iI2E0YTRhNCIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjUiIHI9IjUiIGZpbGw9IiM0YTJhMmEiLz48L3N2Zz4=',
    birds: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyNSIgZmlsbD0iIzM0OThkYiIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjUiIHI9IjUiIGZpbGw9IiMyOTgwYjkiLz48L3N2Zz4='
};

// Initialize TensorFlow.js model
async function initModel() {
    try {
        // Create a sequential model for neural network
        const model = tf.sequential({
            layers: [
                tf.layers.dense({ inputShape: [gameState.neuralNetwork.inputFeatures], units: gameState.neuralNetwork.hiddenLayers[0], activation: 'relu' }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: gameState.neuralNetwork.hiddenLayers[1], activation: 'relu' }),
                tf.layers.dense({ units: gameState.neuralNetwork.outputSize, activation: 'sigmoid' })
            ]
        });
        
        // Compile the model
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        gameState.model = model;
        gameState.neuralNetwork.model = model;
        
        // Initialize RL Q-table
        initQTable();
        
        console.log('ML models initialized successfully');
    } catch (error) {
        console.error('Error initializing ML models:', error);
    }
}

// Initialize Q-table for Reinforcement Learning
function initQTable() {
    // Create state-action pairs for RL
    // States: difficulty levels (1-5) and operation types
    // Actions: increase/decrease difficulty or keep same
    const operations = ['addition', 'subtraction', 'multiplication'];
    const difficulties = [1, 2, 3, 4, 5];
    const actions = ['increase', 'decrease', 'keep'];
    
    // Initialize Q-table with zeros
    operations.forEach(operation => {
        gameState.rlState.qTable[operation] = {};
        difficulties.forEach(difficulty => {
            gameState.rlState.qTable[operation][difficulty] = {};
            actions.forEach(action => {
                gameState.rlState.qTable[operation][difficulty][action] = 0;
            });
        });
    });
}

// Get state representation for RL
function getRLState(operation, difficulty) {
    return `${operation}_${difficulty}`;
}

// Choose action using epsilon-greedy policy
function chooseRLAction(operation, difficulty) {
    const state = getRLState(operation, difficulty);
    const qTable = gameState.rlState.qTable[operation][difficulty];
    
    // Exploration: choose random action
    if (Math.random() < gameState.rlState.explorationRate) {
        const actions = Object.keys(qTable);
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    // Exploitation: choose best action
    let bestAction = 'keep';
    let bestValue = qTable[bestAction];
    
    for (const action in qTable) {
        if (qTable[action] > bestValue) {
            bestValue = qTable[action];
            bestAction = action;
        }
    }
    
    return bestAction;
}

// Update Q-table using Q-learning algorithm
function updateQTable(operation, difficulty, action, reward, nextDifficulty) {
    const currentState = getRLState(operation, difficulty);
    const nextState = getRLState(operation, nextDifficulty);
    
    // Get current Q-value
    const currentQ = gameState.rlState.qTable[operation][difficulty][action];
    
    // Get max Q-value for next state
    const nextStateQValues = gameState.rlState.qTable[operation][nextDifficulty];
    let maxNextQ = Math.max(...Object.values(nextStateQValues));
    
    // Q-learning update formula
    const newQ = currentQ + gameState.rlState.learningRate * 
                (reward + gameState.rlState.discountFactor * maxNextQ - currentQ);
    
    // Update Q-table
    gameState.rlState.qTable[operation][difficulty][action] = newQ;
    
    // Record state, action, and reward for history
    gameState.rlState.states.push(currentState);
    gameState.rlState.actions.push(action);
    gameState.rlState.rewards.push(reward);
}

// Calculate reward based on user performance
function calculateReward(isCorrect, difficulty, operation) {
    // Base reward for correct answer
    let reward = isCorrect ? 1 : -1;
    
    // Adjust reward based on difficulty level
    // Higher difficulty with correct answer gives higher reward
    // Lower difficulty with incorrect answer gives lower penalty
    if (isCorrect) {
        reward *= (1 + (difficulty - 1) * 0.2);
    } else {
        reward *= (1 - (difficulty - 1) * 0.1);
    }
    
    // Adjust reward based on operation type
    // This can be customized based on which operations are more challenging
    const operationWeights = {
        'addition': 1.0,
        'subtraction': 1.2,
        'multiplication': 1.5
    };
    
    reward *= operationWeights[operation];
    
    return reward;
}

// Predict probability of correct answer using neural network
async function predictCorrectProbability(features) {
    if (!gameState.neuralNetwork.model) return 0.5;
    
    try {
        // Convert features to tensor
        const inputTensor = tf.tensor2d([features]);
        
        // Make prediction
        const prediction = gameState.neuralNetwork.model.predict(inputTensor);
        const probability = prediction.dataSync()[0];
        
        // Clean up tensors
        inputTensor.dispose();
        prediction.dispose();
        
        return probability;
    } catch (error) {
        console.error('Error making prediction:', error);
        return 0.5;
    }
}

// Train neural network with new data
async function trainNeuralNetwork(features, isCorrect) {
    if (!gameState.neuralNetwork.model) return;
    
    try {
        // Add new data point
        gameState.neuralNetwork.trainingData.push({
            features: features,
            label: isCorrect ? 1 : 0
        });
        
        // Train if we have enough data
        if (gameState.neuralNetwork.trainingData.length >= gameState.neuralNetwork.batchSize) {
            // Prepare training data
            const xs = tf.tensor2d(
                gameState.neuralNetwork.trainingData.map(d => d.features)
            );
            const ys = tf.tensor2d(
                gameState.neuralNetwork.trainingData.map(d => d.label),
                [gameState.neuralNetwork.trainingData.length, 1]
            );
            
            // Train the model
            await gameState.neuralNetwork.model.fit(xs, ys, {
                epochs: gameState.neuralNetwork.epochs,
                batchSize: gameState.neuralNetwork.batchSize,
                shuffle: true,
                validationSplit: 0.2
            });
            
            // Clean up tensors
            xs.dispose();
            ys.dispose();
            
            // Clear training data after training
            gameState.neuralNetwork.trainingData = [];
        }
    } catch (error) {
        console.error('Error training neural network:', error);
    }
}

// Generate a math problem based on current operation and difficulty
function generateProblem() {
    // If mixed operations mode is on, randomly select an operation
    if (gameState.mixedOperations) {
        const operations = ['addition', 'subtraction', 'multiplication'];
        const randomIndex = Math.floor(Math.random() * operations.length);
        gameState.operation = operations[randomIndex];
        
        // Update the operation select dropdown to reflect the current operation
        operationSelect.value = gameState.operation;
    }
    
    // Get the current operation's performance
    const operationProgress = gameState.learningProgress[gameState.operation];
    const successRate = operationProgress.total > 0 
        ? operationProgress.correct / operationProgress.total 
        : 0.5;
    
    // Use Reinforcement Learning to choose action
    const rlAction = chooseRLAction(gameState.operation, Math.floor(gameState.difficulty));
    
    // Apply the chosen action
    switch (rlAction) {
        case 'increase':
            gameState.difficulty = Math.min(5, gameState.difficulty + 0.5);
            break;
        case 'decrease':
            gameState.difficulty = Math.max(1, gameState.difficulty - 0.5);
            break;
        case 'keep':
            // Keep current difficulty
            break;
    }
    
    // Update difficulty display
    difficultyElement.textContent = '⭐'.repeat(Math.floor(gameState.difficulty));
    
    // Generate numbers based on difficulty
    let maxNum;
    if (gameState.difficulty <= 2) {
        // Easy: single digit numbers
        maxNum = 9;
    } else if (gameState.difficulty <= 3) {
        // Medium: numbers up to 20
        maxNum = 20;
    } else if (gameState.difficulty <= 4) {
        // Hard: numbers up to 50
        maxNum = 50;
    } else {
        // Very hard: numbers up to 100
        maxNum = 100;
    }
    
    // Calculate answer based on operation
    let num1, num2, answer;
    
    switch(gameState.operation) {
        case 'addition':
            // For addition, ensure sum is less than 90
            maxNum = Math.min(maxNum, 45); // Limit first number to 45
            num1 = Math.floor(Math.random() * maxNum) + 1;
            // Limit second number to ensure sum is less than 90
            const maxNum2 = Math.min(89 - num1, maxNum);
            num2 = Math.floor(Math.random() * maxNum2) + 1;
            answer = num1 + num2;
            break;
            
        case 'subtraction':
            // For subtraction, ensure result is positive and less than 90
            maxNum = Math.min(maxNum, 89); // Limit to 89
            num1 = Math.floor(Math.random() * maxNum) + 1;
            // Ensure second number is less than first to get positive result
            num2 = Math.floor(Math.random() * num1) + 1;
            answer = num1 - num2;
            break;
            
        case 'multiplication':
            // For multiplication, use smaller numbers to keep result less than 90
            maxNum = Math.min(maxNum, 9); // Limit to 9 for multiplication
            num1 = Math.floor(Math.random() * maxNum) + 1;
            // Limit second number to ensure product is less than 90
            const maxMultiplier = Math.min(Math.floor(89 / num1), maxNum);
            num2 = Math.floor(Math.random() * maxMultiplier) + 1;
            answer = num1 * num2;
            break;
            
        default:
            // Default to addition with limits
            maxNum = Math.min(maxNum, 45);
            num1 = Math.floor(Math.random() * maxNum) + 1;
            const maxDefaultNum2 = Math.min(89 - num1, maxNum);
            num2 = Math.floor(Math.random() * maxDefaultNum2) + 1;
            answer = num1 + num2;
    }
    
    // Verify that the answer is less than 90
    if (answer >= 90) {
        console.warn(`Generated answer ${answer} is >= 90, regenerating problem`);
        return generateProblem(); // Recursively generate a new problem
    }
    
    // Change the fruit for each new problem
    const fruits = Object.keys(fruitImages);
    const randomIndex = Math.floor(Math.random() * fruits.length);
    gameState.currentFruit = fruits[randomIndex];
    
    return { num1, num2, answer };
}

// Get the current fruit image
function getCurrentFruitImage() {
    return fruitImages[gameState.currentFruit] || fallbackImages.fruits;
}

// Render visual representation of numbers using fruit images
async function renderVisualItems(container, count) {
    container.innerHTML = '';
    
    // Create a loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Loading...';
    container.appendChild(loadingIndicator);
    
    // Get the current fruit image
    const fruitImage = getCurrentFruitImage();
    
    // Generate images for each item
    for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'visual-item';
        
        const img = document.createElement('img');
        img.src = fruitImage;
        img.alt = `${gameState.currentFruit} ${i + 1}`;
        
        // Add error handling for images
        img.onerror = function() {
            this.src = fallbackImages.fruits;
        };
        
        item.appendChild(img);
        item.style.animationDelay = `${i * 0.1}s`;
        container.appendChild(item);
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
}

// Generate multiple-choice options
function generateAnswerOptions(correctAnswer) {
    const options = [correctAnswer];
    const maxNum = Math.max(correctAnswer + 5, 20);
    
    // Generate 3 incorrect options
    while (options.length < 4) {
        const option = Math.floor(Math.random() * maxNum) + 1;
        if (!options.includes(option)) {
            options.push(option);
        }
    }
    
    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
}

// Update the problem display
async function updateProblemDisplay() {
    const { num1, num2, answer } = gameState.currentProblem;
    const operationSymbol = gameState.operation === 'addition' ? '+' : 
                           gameState.operation === 'subtraction' ? '-' : '×';
    
    // Display the problem
    problemDisplay.innerHTML = `
        <div class="problem-text">
            ${num1} ${operationSymbol} ${num2} = ?
        </div>
    `;
    
    // Add operation indicator if in mixed operations mode
    if (gameState.mixedOperations) {
        const operationIndicator = document.createElement('div');
        operationIndicator.className = 'operation-indicator';
        operationIndicator.textContent = gameState.operation.charAt(0).toUpperCase() + 
                                       gameState.operation.slice(1);
        problemDisplay.appendChild(operationIndicator);
    }
    
    // Generate and display multiple-choice options
    const options = generateAnswerOptions(answer);
    answerOptions.innerHTML = '';
    
    // Create a loading indicator for the options
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.textContent = 'Loading options...';
    answerOptions.appendChild(loadingIndicator);
    
    // Get the current fruit image
    const fruitImage = getCurrentFruitImage();
    
    // Generate options with fruit images
    for (const option of options) {
        const optionElement = document.createElement('div');
        optionElement.className = 'answer-option';
        optionElement.setAttribute('role', 'button');
        optionElement.setAttribute('tabindex', '0');
        optionElement.setAttribute('data-value', option);
        
        // Create container for images
        const imageContainer = document.createElement('div');
        imageContainer.className = 'option-image-container';
        
        // Add images based on the option value
        for (let i = 0; i < option; i++) {
            const img = document.createElement('img');
            img.src = fruitImage;
            img.alt = `${gameState.currentFruit} ${i + 1}`;
            
            // Add error handling for option images
            img.onerror = function() {
                this.src = fallbackImages.fruits;
            };
            
            imageContainer.appendChild(img);
        }
        
        // Create numeric representation (initially hidden)
        const numericValue = document.createElement('div');
        numericValue.className = 'numeric-value';
        numericValue.textContent = option;
        numericValue.style.display = 'none';
        
        optionElement.appendChild(imageContainer);
        optionElement.appendChild(numericValue);
        
        // Add click and keyboard event listeners
        optionElement.addEventListener('click', () => handleAnswerClick(option, optionElement));
        optionElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAnswerClick(option, optionElement);
            }
        });
        
        answerOptions.appendChild(optionElement);
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
}

// Update progress bars
function updateProgressBars() {
    const { addition, subtraction, multiplication } = gameState.learningProgress;
    
    // Update progress text
    additionProgress.textContent = `${addition.correct}/${addition.total}`;
    subtractionProgress.textContent = `${subtraction.correct}/${subtraction.total}`;
    multiplicationProgress.textContent = `${multiplication.correct}/${multiplication.total}`;
    
    // Update progress bars
    const additionPercentage = addition.total > 0 ? (addition.correct / addition.total) * 100 : 0;
    const subtractionPercentage = subtraction.total > 0 ? (subtraction.correct / subtraction.total) * 100 : 0;
    const multiplicationPercentage = multiplication.total > 0 ? (multiplication.correct / multiplication.total) * 100 : 0;
    
    additionBar.style.width = `${additionPercentage}%`;
    subtractionBar.style.width = `${subtractionPercentage}%`;
    multiplicationBar.style.width = `${multiplicationPercentage}%`;
}

// Show feedback message
function showFeedback(message, isCorrect) {
    feedbackContainer.innerHTML = '';
    
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackElement.textContent = message;
    
    feedbackContainer.appendChild(feedbackElement);
    
    // Add ML-based feedback
    setTimeout(() => {
        const mlFeedbackElement = document.createElement('div');
        mlFeedbackElement.className = 'feedback';
        mlFeedbackElement.textContent = isCorrect ? 
            'Great job! Keep going! 🌟' : 
            'Take your time, you can do it! 🎯';
        
        feedbackContainer.appendChild(mlFeedbackElement);
    }, 500);
}

// Update user performance and train ML model
async function updateUserPerformance(userAnswer, isCorrect) {
    // Update learning progress
    gameState.learningProgress[gameState.operation].total++;
    if (isCorrect) {
        gameState.learningProgress[gameState.operation].correct++;
    }
    
    // Prepare features for ML model
    const features = [
        gameState.currentProblem.num1,
        gameState.currentProblem.num2,
        userAnswer,
        gameState.level,
        gameState.difficulty
    ];
    
    const performance = {
        input: features,
        output: isCorrect ? 1 : 0,
        timestamp: Date.now(),
        operation: gameState.operation
    };
    
    gameState.userPerformance.push(performance);
    
    // Record performance history for graphing
    gameState.performanceHistory.push({
        timestamp: Date.now(),
        operation: gameState.operation,
        isCorrect: isCorrect,
        difficulty: gameState.difficulty,
        level: gameState.level
    });
    
    // Calculate reward for RL
    const reward = calculateReward(isCorrect, Math.floor(gameState.difficulty), gameState.operation);
    
    // Update Q-table with RL
    const rlAction = chooseRLAction(gameState.operation, Math.floor(gameState.difficulty));
    updateQTable(gameState.operation, Math.floor(gameState.difficulty), rlAction, reward, Math.floor(gameState.difficulty));
    
    // Train neural network
    await trainNeuralNetwork(features, isCorrect);
    
    // Predict probability of correct answer for next problem
    const predictedProbability = await predictCorrectProbability(features);
    
    // Adjust difficulty based on prediction if needed
    if (predictedProbability < 0.3 && gameState.difficulty > 1) {
        // If predicted probability is low, decrease difficulty
        gameState.difficulty = Math.max(1, gameState.difficulty - 0.5);
    } else if (predictedProbability > 0.7 && gameState.difficulty < 5) {
        // If predicted probability is high, increase difficulty
        gameState.difficulty = Math.min(5, gameState.difficulty + 0.5);
    }
    
    // Update difficulty display
    difficultyElement.textContent = '⭐'.repeat(Math.floor(gameState.difficulty));
    
    // Update level based on performance
    if (isCorrect && gameState.score > 0 && gameState.score % 50 === 0) {
        gameState.level++;
        levelElement.textContent = gameState.level;
    }
    
    // Update UI
    updateProgressBars();
    
    // Update the progress graph
    updateProgressGraph();
    
    // Generate ML insights
    generateMLInsights();
}

// Handle answer click
function handleAnswerClick(userAnswer, optionElement) {
    const isCorrect = userAnswer === gameState.currentProblem.answer;
    
    // Disable all answer options after selection
    const answerOptions = document.querySelectorAll('.answer-option');
    answerOptions.forEach(option => {
        option.style.pointerEvents = 'none';
        
        // Add visual feedback for correct/incorrect answers
        if (parseInt(option.getAttribute('data-value')) === userAnswer) {
            option.classList.add(isCorrect ? 'correct' : 'incorrect');
        }
    });
    
    if (isCorrect) {
        gameState.score += 10;
        scoreElement.textContent = gameState.score;
        showFeedback('Correct! 🎉', true);
        
        // Show numeric representation for the correct answer
        const numericValue = optionElement.querySelector('.numeric-value');
        const imageContainer = optionElement.querySelector('.option-image-container');
        
        if (numericValue && imageContainer) {
            // Hide the image container
            imageContainer.style.display = 'none';
            
            // Show and highlight the numeric value
            numericValue.style.display = 'block';
            numericValue.classList.add('correct-answer');
            numericValue.style.fontSize = '2rem';
            numericValue.style.fontWeight = 'bold';
            numericValue.style.color = 'var(--color-success)';
            numericValue.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
            
            // Add a verification message
            const verificationMessage = document.createElement('div');
            verificationMessage.className = 'verification-message';
            verificationMessage.textContent = `Verification: ${userAnswer} is the correct answer!`;
            verificationMessage.style.marginTop = '10px';
            verificationMessage.style.fontSize = '1rem';
            verificationMessage.style.color = 'var(--color-success)';
            optionElement.appendChild(verificationMessage);
        }
        
        // Update the question mark with the correct answer
        const questionMark = document.querySelector('.problem-text');
        if (questionMark) {
            questionMark.textContent = questionMark.textContent.replace('?', userAnswer);
            questionMark.style.fontWeight = 'bold';
            questionMark.style.color = 'var(--color-success)';
        }
    } else {
        showFeedback('Try again! 💪', false);
    }
    
    updateUserPerformance(userAnswer, isCorrect);
    
    setTimeout(() => {
        gameState.currentProblem = generateProblem();
        updateProblemDisplay();
    }, 2000); // Increased delay to give more time to see the verification
}

// Start a new game
async function startGame() {
    homeScreen.classList.remove('active');
    gameScreen.classList.add('active');
    
    // Check if mixed operations mode is selected
    gameState.mixedOperations = document.getElementById('mixed-operations').checked;
    
    // If mixed operations mode is on, we'll randomly select operations for each question
    if (gameState.mixedOperations) {
        // Disable the operation select dropdown
        operationSelect.disabled = true;
        operationSelect.classList.add('disabled');
    } else {
        // Enable the operation select dropdown
        operationSelect.disabled = false;
        operationSelect.classList.remove('disabled');
    }
    
    gameState.currentProblem = generateProblem();
    await updateProblemDisplay();
    updateProgressBars();
    
    // Initialize the progress graph
    updateProgressGraph();
}

// Go back to home screen
function goToHome() {
    gameScreen.classList.remove('active');
    homeScreen.classList.add('active');
    
    // Reset mixed operations mode
    gameState.mixedOperations = false;
    
    // Enable the operation select dropdown
    operationSelect.disabled = false;
    operationSelect.classList.remove('disabled');
}

// Update the progress graph based on the selected type
function updateProgressGraph() {
    const graphType = graphTypeSelect.value;
    const ctx = document.getElementById('progress-graph').getContext('2d');
    
    // Destroy existing chart if it exists
    if (gameState.graphInstance) {
        gameState.graphInstance.destroy();
    }
    
    let chartData;
    let chartOptions;
    
    switch (graphType) {
        case 'accuracy':
            chartData = generateAccuracyChartData();
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Make the chart horizontal
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Accuracy'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Questions Attempted'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Accuracy Over Questions'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            };
            break;
            
        case 'difficulty':
            chartData = generateDifficultyChartData();
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Make the chart horizontal
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 5,
                        title: {
                            display: true,
                            text: 'Difficulty Level'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Questions Attempted'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Difficulty Progression'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            };
            break;
            
        case 'operation':
            chartData = generateOperationChartData();
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Make the chart horizontal
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: 'Accuracy'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Operation Comparison'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            };
            break;
    }
    
    // Create the chart
    gameState.graphInstance = new Chart(ctx, {
        type: 'bar', // Change to bar chart for better horizontal display
        data: chartData,
        options: chartOptions
    });
}

// Generate data for accuracy chart
function generateAccuracyChartData() {
    // Group performance by operation
    const operations = ['addition', 'subtraction', 'multiplication'];
    const datasets = [];
    
    operations.forEach(operation => {
        // Filter performance history by operation
        const operationData = gameState.performanceHistory.filter(p => p.operation === operation);
        
        if (operationData.length > 0) {
            // Calculate cumulative accuracy
            let correct = 0;
            const data = operationData.map((p, index) => {
                if (p.isCorrect) correct++;
                return {
                    y: index + 1, // Question number instead of timestamp
                    x: correct / (index + 1)
                };
            });
            
            // Add dataset
            datasets.push({
                label: operation.charAt(0).toUpperCase() + operation.slice(1),
                data: data,
                borderColor: getOperationColor(operation),
                backgroundColor: getOperationColor(operation, 0.2),
                tension: 0.3
            });
        }
    });
    
    return { datasets };
}

// Generate data for difficulty chart
function generateDifficultyChartData() {
    // Group performance by operation
    const operations = ['addition', 'subtraction', 'multiplication'];
    const datasets = [];
    
    operations.forEach(operation => {
        // Filter performance history by operation
        const operationData = gameState.performanceHistory.filter(p => p.operation === operation);
        
        if (operationData.length > 0) {
            // Extract difficulty progression
            const data = operationData.map((p, index) => ({
                y: index + 1, // Question number instead of timestamp
                x: p.difficulty
            }));
            
            // Add dataset
            datasets.push({
                label: operation.charAt(0).toUpperCase() + operation.slice(1),
                data: data,
                borderColor: getOperationColor(operation),
                backgroundColor: getOperationColor(operation, 0.2),
                tension: 0.3
            });
        }
    });
    
    return { datasets };
}

// Generate data for operation comparison chart
function generateOperationChartData() {
    const operations = ['addition', 'subtraction', 'multiplication'];
    const labels = [];
    const data = [];
    const backgroundColor = [];
    
    operations.forEach(operation => {
        const operationData = gameState.performanceHistory.filter(p => p.operation === operation);
        
        if (operationData.length > 0) {
            const correct = operationData.filter(p => p.isCorrect).length;
            const accuracy = correct / operationData.length;
            
            labels.push(operation.charAt(0).toUpperCase() + operation.slice(1));
            data.push(accuracy);
            backgroundColor.push(getOperationColor(operation, 0.7));
        }
    });
    
    return {
        labels: labels,
        datasets: [{
            label: 'Accuracy',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map(color => color.replace('0.7', '1')),
            borderWidth: 1
        }]
    };
}

// Get color for operation
function getOperationColor(operation, alpha = 1) {
    switch (operation) {
        case 'addition':
            return `rgba(46, 204, 113, ${alpha})`;
        case 'subtraction':
            return `rgba(52, 152, 219, ${alpha})`;
        case 'multiplication':
            return `rgba(155, 89, 182, ${alpha})`;
        default:
            return `rgba(52, 152, 219, ${alpha})`;
    }
}

// Generate ML insights based on user performance
function generateMLInsights() {
    if (gameState.performanceHistory.length < 5) {
        mlInsightsContent.innerHTML = '<p>Keep playing to generate insights!</p>';
        return;
    }
    
    const insights = [];
    
    // Calculate overall accuracy
    const totalCorrect = gameState.performanceHistory.filter(p => p.isCorrect).length;
    const totalQuestions = gameState.performanceHistory.length;
    const overallAccuracy = totalCorrect / totalQuestions;
    
    // Add overall accuracy insight
    insights.push(`Your overall accuracy is ${(overallAccuracy * 100).toFixed(1)}%.`);
    
    // Calculate operation-specific insights
    const operations = ['addition', 'subtraction', 'multiplication'];
    operations.forEach(operation => {
        const operationData = gameState.performanceHistory.filter(p => p.operation === operation);
        
        if (operationData.length > 0) {
            const correct = operationData.filter(p => p.isCorrect).length;
            const accuracy = correct / operationData.length;
            
            // Determine strength/weakness
            if (accuracy > 0.8) {
                insights.push(`You're strong in ${operation}!`);
            } else if (accuracy < 0.5) {
                insights.push(`You might need more practice with ${operation}.`);
            }
            
            // Check for improvement
            if (operationData.length >= 10) {
                const recentData = operationData.slice(-10);
                const olderData = operationData.slice(-20, -10);
                
                if (olderData.length >= 10) {
                    const recentAccuracy = recentData.filter(p => p.isCorrect).length / recentData.length;
                    const olderAccuracy = olderData.filter(p => p.isCorrect).length / olderData.length;
                    
                    if (recentAccuracy > olderAccuracy + 0.1) {
                        insights.push(`You've improved significantly in ${operation}!`);
                    }
                }
            }
        }
    });
    
    // Check for difficulty progression
    if (gameState.performanceHistory.length >= 20) {
        const recentData = gameState.performanceHistory.slice(-10);
        const olderData = gameState.performanceHistory.slice(-20, -10);
        
        const recentDifficulty = recentData.reduce((sum, p) => sum + p.difficulty, 0) / recentData.length;
        const olderDifficulty = olderData.reduce((sum, p) => sum + p.difficulty, 0) / olderData.length;
        
        if (recentDifficulty > olderDifficulty) {
            insights.push(`You're now tackling more challenging problems!`);
        }
    }
    
    // Add RL insights
    if (gameState.rlState.states.length > 0) {
        const recentRewards = gameState.rlState.rewards.slice(-10);
        const avgReward = recentRewards.reduce((sum, reward) => sum + reward, 0) / recentRewards.length;
        
        if (avgReward > 0.5) {
            insights.push(`The AI is learning that you're performing well!`);
        } else if (avgReward < -0.5) {
            insights.push(`The AI is adjusting to find the right difficulty for you.`);
        }
    }
    
    // Add neural network insights
    if (gameState.neuralNetwork.trainingData.length > 0) {
        const recentPredictions = gameState.neuralNetwork.trainingData.slice(-5);
        const avgPrediction = recentPredictions.reduce((sum, data) => sum + data.label, 0) / recentPredictions.length;
        
        if (avgPrediction > 0.7) {
            insights.push(`The AI predicts you'll do well with these problems!`);
        } else if (avgPrediction < 0.3) {
            insights.push(`The AI suggests these problems might be challenging for you.`);
        }
    }
    
    // Display insights
    mlInsightsContent.innerHTML = '';
    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = 'insight-item';
        insightElement.textContent = insight;
        mlInsightsContent.appendChild(insightElement);
    });
}

// Event listeners
startGameBtn.addEventListener('click', startGame);
backHomeBtn.addEventListener('click', goToHome);
operationSelect.addEventListener('change', async (e) => {
    gameState.operation = e.target.value;
    gameState.currentProblem = generateProblem();
    await updateProblemDisplay();
});

// Graph type change event
graphTypeSelect.addEventListener('change', updateProgressGraph);

// Refresh graph button
refreshGraphBtn.addEventListener('click', updateProgressGraph);

// Initialize the game
async function initGame() {
    await initModel();
    console.log('Game initialized');
}

// Start the game when the page loads
window.addEventListener('load', initGame); 