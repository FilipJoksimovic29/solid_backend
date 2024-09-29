require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { factoryAddress, factoryAbi } = require('./constants'); // Adjust the path if necessary
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 4000;

// Configure CORS to allow requests from your frontend
const corsOptions = {
  origin: '*', // Update with your frontend domain in production
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(helmet());
app.use(morgan('combined'));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/vote/:id', apiLimiter);

app.post('/vote/:id', async (req, res) => {
  const { id } = req.params;
  const ETHEREUM_NODE_URL = 'https://eth-sepolia.g.alchemy.com/v2/U8jY3lsiyHNIuMWbyiipdmiiKuz730Ud';
  try {
    const provider = new ethers.JsonRpcProvider(ETHEREUM_NODE_URL);
    console.log("Povezan na Ethereum mrežu");
    const contract = new ethers.Contract(factoryAddress, factoryAbi, provider);
    console.log(factoryAddress, factoryAbi, provider, id);
    const voterInstanceAddress = await contract.getVotingInstanceForVoter(id);

    if (voterInstanceAddress === ethers.ZeroAddress) {
      console.log('Invalid voting session ID');
      return res.status(404).json({ error: 'Invalid voting session ID' });
    }

    res.json({ voterInstanceAddress });
  } catch (error) {
    console.error('Error fetching voter instance:', error);
    res.status(500).json({ error: 'Failed to fetch voter instance' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
