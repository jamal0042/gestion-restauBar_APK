import axios from 'axios';

const API_BASE_URL = 'https://api.pos-restaurant.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function checkConnection(): Promise<boolean> {
  try {
    await axios.head(API_BASE_URL, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
