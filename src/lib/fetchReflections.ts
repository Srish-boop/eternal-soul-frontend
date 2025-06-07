import fetch from 'node-fetch';
import { API_CONFIG } from '@/config/api';

export async function fetchReflections(birthData: {
  date: string;
  time: string;
  place: string;
}) {
  try {
    const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.reflections}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(birthData),
    });

    if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
    
    const data = await res.json();
    console.log('API returned:', data); // 👈 For debugging in browser
    return data;
  } catch (err) {
    console.error('API error:', err);
    return null;
  }
}
