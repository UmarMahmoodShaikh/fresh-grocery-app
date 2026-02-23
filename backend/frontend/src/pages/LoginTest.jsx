import axios from 'axios';
import { useState } from 'react';

export default function LoginTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testLogin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('API URL:', import.meta.env.VITE_API_URL);
      console.log('Making login request...');

      const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await api.post('/auth/login', {
        email: 'admin@trinity.com',
        password: 'Admin@123'
      });

      console.log('Response received:', response);
      console.log('Response data:', response.data);
      
      setResult({
        status: response.status,
        data: response.data,
      });

      // Try to store
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('Stored in localStorage');
      }
    } catch (err) {
      console.error('Error:', err);
      console.error('Error response:', err.response);
      setError({
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Login Test</h1>
      <button onClick={testLogin} disabled={loading}>
        {loading ? 'Testing...' : 'Test Login'}
      </button>

      {result && (
        <div style={{ marginTop: '20px', backgroundColor: '#f0f0f0', padding: '10px' }}>
          <h3>Success:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '20px', backgroundColor: '#ffcccc', padding: '10px' }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
