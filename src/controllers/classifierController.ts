import axios from 'axios';
import { Request, Response } from 'express';
import { injectable } from 'inversify';
import { loadEnvironmentVariable } from '../utils/environmentVariableHandler';

interface MLResponse {
    predicted_label: string;
    confidence: number;
}

@injectable()
export class ClassifierController {
    private readonly pythonApiUrl: string;

    constructor() {
        this.pythonApiUrl = loadEnvironmentVariable('PYTHON_ML_API_URL') || 'http://localhost:8000';
    }

    async classifyTransaction(req: Request, res: Response): Promise<Response> {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ error: 'Transaction description is required.' });
            }

            const response = await axios.post(`${this.pythonApiUrl}/predict`, { text });
            const mlResponse: MLResponse = response.data as MLResponse;

            if (mlResponse?.predicted_label && mlResponse?.confidence !== undefined) {
                if (mlResponse.confidence >= 0.5) { // TODO move to env
                    return res.json({
                        category: mlResponse.predicted_label,
                        confidence: mlResponse.confidence,
                    });
                } else {
                    return res.status(200).json({
                        category: null,
                        confidence: mlResponse.confidence,
                        message: 'Confidence too low to determine a reliable category.',
                    });
                }
            } else {
                throw new Error('Invalid response format from ML API');
            }
        } catch (error) {
            console.error('Error predicting category: ', error);
            return res.status(500).json({ error: 'Failed to predict transaction category: ' + error });
        }
    }
}
