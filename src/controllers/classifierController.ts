import { Request, Response } from 'express';
import { injectable } from 'inversify';
import axios from 'axios';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';

interface MLResponse {
    predicted_label: string;
    confidence: number;
}

/**
 * Handles transaction classification by sending descriptions to the ML API.
 */
@injectable()
export class ClassifierController {
    private readonly pythonApiUrl: string;

    /**
     * Initializes the ClassifierController with the Python ML API URL.
     */
    constructor() {
        this.pythonApiUrl = loadEnvironmentVariable('PYTHON_ML_API_URL') || 'http://localhost:8000';
    }

    /**
     * Classifies a transaction description using the ML API.
     *
     * @param req - Express request object containing `description` in the body.
     * @param res - Express response object to return the classification result.
     *
     * @returns {Promise<void>} - A promise that resolves when the response is sent.
     */
    async classifyTransaction(req: Request, res: Response): Promise<Response> {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Transaction description is required.' });
            }

            const response = await axios.post(`${this.pythonApiUrl}/predict`, { text });
            const mlResponse: MLResponse = response.data as MLResponse;

            if (mlResponse?.predicted_label && mlResponse?.confidence !== undefined) {
                return res.json({
                    category: mlResponse.predicted_label,
                    confidence: mlResponse.confidence,
                });
            } else {
                throw new Error('Invalid response format from ML API');
            }
        } catch (error) {
            console.error('Error predicting category: ', error);
            return res.status(500).json({ error: 'Failed to predict transaction category: ' + error });
        }
    }
}
