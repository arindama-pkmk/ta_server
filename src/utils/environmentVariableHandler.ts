/**
 * Loads the value of an environment variable.
 *
 * @param {string} varName - The name of the environment variable to load.
 *
 * @returns {string} The value of the environment variable.
 *
 * @throws {Error} If the environment variable is not set.
 */
export const loadEnvironmentVariable = (varName: string): string => {
  const value = process.env[varName];
  if (!value) {
    throw new Error(`Environment variable ${varName} is not set`);
  }
  return value;
};