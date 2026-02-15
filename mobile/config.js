import Constants from 'expo-constants';

// Option 1 (recommended): set explicitly at runtime
// EXPO_PUBLIC_API_URL=http://<your-ip>:3001

const DEFAULT_API_PORT = 3001;

function getExpoHost() {
	const hostUri =
		Constants?.expoConfig?.hostUri ||
		Constants?.manifest2?.extra?.expoClient?.hostUri ||
		Constants?.manifest?.debuggerHost ||
		Constants?.expoConfig?.debuggerHost;

	if (typeof hostUri !== 'string' || hostUri.trim() === '') return null;

	// hostUri is usually like "192.168.x.x:8081".
	const host = hostUri.replace(/^https?:\/\//, '').split(':')[0];
	return host || null;
}

function getDefaultBaseUrl() {
	const host = getExpoHost();
	if (!host) return `http://localhost:${DEFAULT_API_PORT}`;
	return `http://${host}:${DEFAULT_API_PORT}`;
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultBaseUrl();

export { BASE_URL };