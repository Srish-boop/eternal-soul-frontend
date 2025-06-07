import { BirthData } from '@/data/types/index';
import { ApiError } from '@/data/types/errors';
import { API_CONFIG } from '@/config/api';

export class ApiService {
  async scoreNatal(birthData: BirthData) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.natalChart}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: birthData.birthdate,
          time: birthData.birthtime,
          timezone: birthData.timezone,
          lat: birthData.location.lat,
          lon: birthData.location.lng,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(`Failed to score natal chart: ${error.message}`);
      }
      throw new ApiError('Failed to score natal chart');
    }
  }

  async scoreTransit(natal: BirthData, transit: BirthData) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.transit}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          natal: {
            date: natal.birthdate,
            time: natal.birthtime,
            timezone: natal.timezone,
            lat: natal.location.lat,
            lon: natal.location.lng,
          },
          transit: {
            date: transit.birthdate,
            time: transit.birthtime,
            timezone: transit.timezone,
            lat: transit.location.lat,
            lon: transit.location.lng,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(`Failed to score transit: ${error.message}`);
      }
      throw new ApiError('Failed to score transit');
    }
  }

  async compareUsers(userA: BirthData, userB: BirthData) {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.compatibility}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userA: {
            date: userA.birthdate,
            time: userA.birthtime,
            timezone: userA.timezone,
            lat: userA.location.lat,
            lon: userA.location.lng,
          },
          userB: {
            date: userB.birthdate,
            time: userB.birthtime,
            timezone: userB.timezone,
            lat: userB.location.lat,
            lon: userB.location.lng,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(`Failed to compare users: ${error.message}`);
      }
      throw new ApiError('Failed to compare users');
    }
  }
}

// Create a singleton instance
export const apiService = new ApiService(); 