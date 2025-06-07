/**
 * Centralized API client with improved error handling
 */

import { API_CONFIG } from '@/config/api';

export interface ApiError {
  message: string;
  type: 'validation_error' | 'value_error' | 'server_error' | 'network_error';
  userMessage: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, create a generic error
        errorData = {
          error: 'Network Error',
          message: 'Unable to connect to the server',
          type: 'network_error'
        };
      }

      const apiError: ApiError = {
        message: errorData.message || errorData.error || 'Unknown error',
        type: errorData.type || 'server_error',
        userMessage: this.getUserFriendlyMessage(errorData.type, errorData.message)
      };

      throw apiError;
    }

    return response.json();
  }

  private getUserFriendlyMessage(errorType: string, originalMessage: string): string {
    switch (errorType) {
      case 'validation_error':
        if (originalMessage.includes('date')) {
          return '📅 Please check your birth date format (YYYY-MM-DD or MM/DD/YYYY)';
        }
        if (originalMessage.includes('time')) {
          return '⏰ Please check your birth time format (HH:MM)';
        }
        if (originalMessage.includes('timezone')) {
          return '🌍 Please check your timezone format (+HH:MM or -HH:MM)';
        }
        if (originalMessage.includes('latitude') || originalMessage.includes('longitude')) {
          return '📍 Unable to find your birth location. Please try a more specific place name.';
        }
        return `⚠️ ${originalMessage}`;

      case 'value_error':
        return `📋 Data format issue: ${originalMessage}`;

      case 'network_error':
        return '🌐 Connection problem. Please check your internet and try again.';

      case 'server_error':
        if (originalMessage.includes('ephemeris') || originalMessage.includes('chart')) {
          return '🪐 Astrological calculation error. Please verify your birth details and try again.';
        }
        if (originalMessage.includes('OpenAI') || originalMessage.includes('reflection')) {
          return '🔮 Unable to generate insights right now. Please try again in a moment.';
        }
        return '⚡ Something went wrong on our end. Please try again.';

      default:
        return `❓ ${originalMessage}`;
    }
  }

  async calculateNatalChart(birthData: {
    date: string;
    time: string;
    lat: number;
    lon: number;
    timezone?: string;
  }) {
    const payload = {
      date: birthData.date,
      time: birthData.time,
      timezone: birthData.timezone || '+00:00',
      lat: birthData.lat,
      lon: birthData.lon,
    };

    const response = await fetch(`${this.baseUrl}/score-natal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return this.handleResponse(response);
  }

  async generateReflections(scores: any[]) {
    const response = await fetch(`${this.baseUrl}/generate-reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scores),
    });

    return this.handleResponse(response);
  }

  async calculateTransit(natalData: any[], transitData: any[]) {
    const payload = {
      natal: natalData,
      transit: transitData
    };

    const response = await fetch(`${this.baseUrl}/score-transit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return this.handleResponse(response);
  }

  async compareUsers(userA: any[], userB: any[]) {
    const payload = {
      userA: userA,
      userB: userB
    };

    const response = await fetch(`${this.baseUrl}/compare-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return this.handleResponse(response);
  }
}

// Export a singleton instance
export const apiClient = new ApiClient(); 