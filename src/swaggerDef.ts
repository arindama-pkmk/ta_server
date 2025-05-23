// src/swaggerDef.ts
import { loadEnvironmentVariable } from './utils/environmentVariableHandler';

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Transaction Analyzer API',
        version: '1.0.0',
        description: 'API documentation for the Transaction Analyzer application.',
        contact: {
            name: 'API Support',
            email: 'support@example.com',
        },
    },
    servers: [
        {
            url: `http://localhost:${loadEnvironmentVariable('PORT') || 4000}${loadEnvironmentVariable('API_BASE_PATH') || '/api/v1'}`,
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
        schemas: {
            // --- Generic Schemas ---
            ErrorResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Error message' },
                },
            },
            ErrorValidationResponse: {
                type: 'object',
                properties: {
                    errors: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'invalid_type' },
                                expected: { type: 'string', example: 'string' },
                                received: { type: 'string', example: 'number' },
                                path: { type: 'array', items: { type: 'string' }, example: ['fieldName'] },
                                message: { type: 'string', example: 'Invalid input' },
                            },
                        },
                    },
                },
            },
            SuccessMessageResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Operation successful' },
                },
            },

            // --- User Schemas ---
            UserBase: { // Common user fields, exclude sensitive ones like password
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    name: { type: 'string', example: 'John Doe' },
                    username: { type: 'string', example: 'johndoe' },
                    email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
                    address: { type: 'string', example: '123 Main St' },
                    birthdate: { type: 'string', format: 'date-time', example: '1990-01-01T00:00:00.000Z' },
                    occupationId: { type: 'string', format: 'uuid', nullable: true, example: 'o1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    // occupation: { $ref: '#/components/schemas/Occupation' } // If Occupation schema is defined
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            UserProfileResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/UserBase' },
                },
            },
            LoginPayload: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'user@example.com' },
                    password: { type: 'string', format: 'password', example: 'password123' },
                },
            },
            LoginResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    user: { $ref: '#/components/schemas/UserBase' },
                },
            },
            RegisterPayload: {
                type: 'object',
                required: ['name', 'username', 'email', 'password', 'address', 'occupationId', 'birthdate'],
                properties: {
                    name: { type: 'string', example: 'Jane Doe' },
                    username: { type: 'string', example: 'janedoe' },
                    email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
                    password: { type: 'string', format: 'password', minLength: 6, example: 'securePassword' },
                    address: { type: 'string', example: '456 Oak Ave' },
                    occupationId: { type: 'string', format: 'uuid', example: 'o1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    birthdate: { type: 'string', format: 'date', example: '1992-05-15' },
                },
            },
            RegisterResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    user: { $ref: '#/components/schemas/UserBase' },
                },
            },
            UpdateProfilePayload: {
                type: 'object',
                properties: {
                    name: { type: 'string', example: 'Johnathan Doe' },
                    username: { type: 'string', example: 'johnnyd' },
                    address: { type: 'string', example: '789 Pine St' },
                    occupationId: { type: 'string', format: 'uuid', nullable: true },
                    birthdate: { type: 'string', format: 'date', nullable: true },
                },
            },
            ResetPasswordPayload: {
                type: 'object',
                required: ['email', 'otp', 'newPassword'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    otp: { type: 'string', length: 6, example: "123456" },
                    newPassword: { type: 'string', format: 'password', minLength: 6 }
                }
            },

            // --- OTP Schemas ---
            RequestOtpPayload: {
                type: 'object',
                required: ['email'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    userId: { type: 'string', format: 'uuid', nullable: true },
                },
            },
            VerifyOtpPayload: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    otp: { type: 'string', length: 6, example: '123456' },
                },
            },

            // --- Transaction Schemas ---
            SubcategoryMinimal: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                }
            },
            CategoryMinimal: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    subcategories: { type: 'array', items: { $ref: '#/components/schemas/SubcategoryMinimal' } }
                }
            },
            AccountTypeMinimal: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                }
            },
            PopulatedSubcategory: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Groceries' },
                    categoryId: { type: 'string', format: 'uuid' },
                    category: {
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string', example: 'Food & Drinks' },
                            accountTypeId: { type: 'string', format: 'uuid' },
                            accountType: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    name: { type: 'string', example: 'Pengeluaran' },
                                },
                            },
                        },
                    },
                },
            },
            Transaction: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    description: { type: 'string', example: 'Weekly groceries' },
                    amount: { type: 'number', format: 'float', example: 55.75 },
                    date: { type: 'string', format: 'date-time' },
                    isBookmarked: { type: 'boolean', example: false },
                    userId: { type: 'string', format: 'uuid' },
                    subcategoryId: { type: 'string', format: 'uuid' },
                    subcategory: { $ref: '#/components/schemas/PopulatedSubcategory' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
            CreateTransactionPayload: {
                type: 'object',
                required: ['description', 'date', 'subcategoryId', 'amount'],
                properties: {
                    description: { type: 'string', example: 'Lunch with colleagues' },
                    date: { type: 'string', format: 'date', example: '2023-10-26' },
                    subcategoryId: { type: 'string', format: 'uuid', example: 's1b2c3d4-e5f6-7890-1234-567890abcdef' },
                    amount: { type: 'number', format: 'float', example: 25.00, minimum: 0.01 },
                    isBookmarked: { type: 'boolean', example: false, nullable: true },
                },
            },
            UpdateTransactionPayload: {
                type: 'object',
                properties: {
                    description: { type: 'string', nullable: true },
                    date: { type: 'string', format: 'date', nullable: true },
                    subcategoryId: { type: 'string', format: 'uuid', nullable: true },
                    amount: { type: 'number', format: 'float', minimum: 0.01, nullable: true },
                    isBookmarked: { type: 'boolean', nullable: true },
                },
            },
            TransactionListResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Transaction' },
                    },
                },
            },
            TransactionResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Transaction' },
                },
            },
            TransactionSummaryResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                        type: 'object',
                        properties: {
                            totalIncome: { type: 'number', example: 5000 },
                            totalExpense: { type: 'number', example: 2500 },
                            netSavings: { type: 'number', example: 2500 },
                            count: { type: 'integer', example: 50 },
                            breakdownByCategory: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        categoryId: { type: 'string', format: 'uuid' },
                                        categoryName: { type: 'string' },
                                        accountTypeName: { type: 'string' },
                                        totalAmount: { type: 'number' },
                                        transactionCount: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            },

            // --- Classifier Schemas ---
            ClassifyPayload: {
                type: 'object',
                required: ['text'],
                properties: {
                    text: { type: 'string', example: 'Starbucks coffee' },
                },
            },
            ClassifiedTransactionDetails: {
                type: 'object',
                properties: {
                    subcategoryId: { type: 'string', format: 'uuid', nullable: true },
                    subcategoryName: { type: 'string' },
                    categoryId: { type: 'string', format: 'uuid', nullable: true },
                    categoryName: { type: 'string', nullable: true },
                    accountTypeId: { type: 'string', format: 'uuid', nullable: true },
                    accountTypeName: { type: 'string', nullable: true },
                    confidence: { type: 'number', format: 'float' },
                    isKnownSubcategory: { type: 'boolean' },
                    predictedSubcategoryName: { type: 'string', nullable: true }, // For low confidence cases
                }
            },
            ClassifierResponse: { // Covers various scenarios
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    data: {
                        oneOf: [
                            { $ref: '#/components/schemas/ClassifiedTransactionDetails' },
                            {
                                type: 'object', properties: { // Low confidence or unknown structure
                                    predictedSubcategoryName: { type: 'string' },
                                    confidence: { type: 'number' }
                                }
                            }
                        ]
                    },
                    message: { type: 'string', nullable: true }
                }
            },

            // --- Category Hierarchy Schemas ---
            AccountType: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Pemasukan' },
                },
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Gaji' },
                    accountTypeId: { type: 'string', format: 'uuid' },
                },
            },
            Subcategory: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string', example: 'Gaji Bulanan' },
                    categoryId: { type: 'string', format: 'uuid' },
                },
            },
            AccountTypeListResponse: {
                type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/AccountType' } } }
            },
            CategoryListResponse: {
                type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Category' } } }
            },
            SubcategoryListResponse: {
                type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/Subcategory' } } }
            },

            // --- Budgeting Schemas (UPDATED/NEW) ---
            ExpenseAllocationDetailPayload: { // Used in SaveExpenseAllocationsPayload
                type: 'object',
                required: ['categoryId', 'percentage', 'selectedSubcategoryIds'],
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    percentage: { type: 'number', format: 'float', minimum: 0, maximum: 100 },
                    selectedSubcategoryIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }
                }
            },
            SaveExpenseAllocationsPayload: { // For POST /budgeting/expense-allocations
                type: 'object',
                required: [
                    'planStartDate',
                    'planEndDate',
                    'incomeCalculationStartDate',
                    'incomeCalculationEndDate',
                    'totalCalculatedIncome',
                    'allocations'
                ],
                properties: {
                    planDescription: { type: 'string', nullable: true, example: 'April 2024 Expenses' },
                    planStartDate: { type: 'string', format: 'date', example: '2024-04-01' },
                    planEndDate: { type: 'string', format: 'date', example: '2024-04-30' },
                    incomeCalculationStartDate: { type: 'string', format: 'date', example: '2024-04-01' },
                    incomeCalculationEndDate: { type: 'string', format: 'date', example: '2024-04-30' },
                    totalCalculatedIncome: { type: 'number', format: 'float', minimum: 0, example: 5000.00 },
                    allocations: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExpenseAllocationDetailPayload' }
                    }
                }
            },
            ExpenseAllocation: { // Represents a single allocation item (from DB)
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    budgetPlanId: { type: 'string', format: 'uuid' },
                    categoryId: { type: 'string', format: 'uuid' },
                    category: { $ref: '#/components/schemas/CategoryMinimal' }, // Nested
                    subcategoryId: { type: 'string', format: 'uuid' },
                    subcategory: { $ref: '#/components/schemas/SubcategoryMinimal' }, // Nested
                    percentage: { type: 'number', format: 'float', description: "Percentage of parent BudgetPlan's totalCalculatedIncome" },
                    amount: { type: 'number', format: 'float', description: "Calculated monetary amount for this category's allocation" },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                }
            },
            BudgetPlan: { // Represents a budget plan (from DB)
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    description: { type: 'string', nullable: true },
                    planStartDate: { type: 'string', format: 'date-time' },
                    planEndDate: { type: 'string', format: 'date-time' },
                    incomeCalculationStartDate: { type: 'string', format: 'date-time' },
                    incomeCalculationEndDate: { type: 'string', format: 'date-time' },
                    totalCalculatedIncome: { type: 'number', format: 'float' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    allocations: { // Nested ExpenseAllocations
                        type: 'array',
                        items: { $ref: '#/components/schemas/ExpenseAllocation' }
                    }
                }
            },
            BudgetPlanResponse: { // For single BudgetPlan GET
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/BudgetPlan' }
                }
            },
            BudgetPlanListResponse: { // For list of BudgetPlans
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/BudgetPlan' } }
                }
            },
            IncomeSummaryItem: {
                type: 'object',
                properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    categoryName: { type: 'string' },
                    categoryTotalAmount: { type: 'number', format: 'float' },
                    subcategories: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                subcategoryId: { type: 'string', format: 'uuid' },
                                subcategoryName: { type: 'string' },
                                totalAmount: { type: 'number', format: 'float' }
                            }
                        }
                    }
                }
            },
            IncomeSummaryResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/IncomeSummaryItem' } } } },
            ExpenseCategorySuggestion: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid', description: "Category ID" },
                    name: { type: 'string', description: "Category Name" },
                    lowerBound: { type: 'number', format: 'float', nullable: true },
                    upperBound: { type: 'number', format: 'float', nullable: true },
                    subcategories: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', format: 'uuid' },
                                name: { type: 'string' }
                            }
                        }
                    }
                }
            },
            ExpenseCategorySuggestionResponse: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'array', items: { $ref: '#/components/schemas/ExpenseCategorySuggestion' } } } },
            SaveExpenseAllocationsPayload: {
                type: 'object',
                required: ['budgetPeriodId', 'totalBudgetableIncome', 'allocations'],
                properties: {
                    budgetPeriodId: { type: 'string', format: 'uuid' },
                    totalBudgetableIncome: { type: 'number', format: 'float', minimum: 0 },
                    allocations: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['categoryId', 'percentage', 'selectedSubcategoryIds'],
                            properties: {
                                categoryId: { type: 'string', format: 'uuid' },
                                percentage: { type: 'number', format: 'float', minimum: 0, maximum: 100 },
                                selectedSubcategoryIds: { type: 'array', items: { type: 'string', format: 'uuid' }, minItems: 1 }
                            }
                        }
                    }
                }
            },
            SaveExpenseAllocationsResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/BudgetAllocation' } }
                }
            },

            // --- Evaluation Schemas (UPDATED/NEW) ---
            EvaluationResult: { // Populated from DB for history/detail (without user, period objects for brevity in list)
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    userId: { type: 'string', format: 'uuid' },
                    startDate: { type: 'string', format: 'date-time' },
                    endDate: { type: 'string', format: 'date-time' },
                    ratioId: { type: 'string', format: 'uuid' },
                    ratio: { // Nested Ratio information
                        type: 'object',
                        properties: {
                            id: { type: 'string', format: 'uuid' },
                            code: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'string', nullable: true },
                            idealText: {type: 'string', nullable: true },
                        }
                    },
                    value: { type: 'number', format: 'float' },
                    status: { type: 'string', enum: ['IDEAL', 'NOT_IDEAL', 'INCOMPLETE'] },
                    calculatedAt: { type: 'string', format: 'date-time' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                }
            },
            CalculateEvaluationsPayload: { // For POST /evaluations/calculate
                type: 'object',
                required: ['startDate', 'endDate'],
                properties: {
                    startDate: { type: 'string', format: 'date', example: '2024-01-01' },
                    endDate: { type: 'string', format: 'date', example: '2024-01-31' },
                }
            },
            SingleRatioCalculationResult: { /* ... (remains same as before) ... */ },
            CalculateEvaluationsResponse: { /* ... (remains same as before, 'data' is SingleRatioCalculationResult[]) ... */ },
            EvaluationHistoryListResponse: { // For GET /evaluations/history
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/EvaluationResult' } } // List of full EvaluationResult
                }
            },
            ConceptualComponentValue: { // For breakdown in detail
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    value: { type: 'number', format: 'float' }
                }
            },
            EvaluationResultDetail: { // For GET /evaluations/{id}/detail
                allOf: [{ $ref: '#/components/schemas/EvaluationResult' }],
                type: 'object',
                properties: {
                    breakdownComponents: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ConceptualComponentValue' },
                        nullable: true
                    },
                    calculatedNumerator: { type: 'number', format: 'float', nullable: true },
                    calculatedDenominator: { type: 'number', format: 'float', nullable: true }
                }
            },
            EvaluationDetailResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/EvaluationResultDetail' }
                }
            },

            // --- Health Schemas ---
            BasicStatusResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'OK' },
                    message: { type: 'string', example: 'Application is running.' }
                }
            },
            HealthStatusResponse: {
                type: 'object',
                properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: { type: 'number', description: 'Uptime in seconds' },
                    services: {
                        type: 'object',
                        properties: {
                            application: { type: 'string', example: 'healthy' },
                            database: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', example: 'connected' },
                                    message: { type: 'string' }
                                }
                            }
                        }
                    },
                    memoryUsage: {
                        type: 'object',
                        properties: {
                            rss: { type: 'integer' },
                            heapTotal: { type: 'integer' },
                            heapUsed: { type: 'integer' },
                            external: { type: 'integer' },
                            arrayBuffers: { type: 'integer' }
                        }
                    }
                }
            }
        }
    },
    // Paths to files containing OpenAPI definitions
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Adjust paths as needed
};

export default swaggerDefinition;