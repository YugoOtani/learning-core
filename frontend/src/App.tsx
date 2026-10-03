import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000';

export function App() {
  const [message, setMessage] = useState('バックエンドに接続しています…');

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json() as Promise<HealthResponse>;
      })
      .then(({ status }) => setMessage(`バックエンド応答: ${status}`))
      .catch(() => setMessage('バックエンドに接続できません'));
  }, []);

  return (
    <main>
      <h1>Rust + React Template</h1>
      <p role="status">{message}</p>
    </main>
  );
}
