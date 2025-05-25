// frontend/pages/_app.js
import '../../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext'; // Import SocketProvider

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SocketProvider> {/* Wrap with SocketProvider */}
        <Component {...pageProps} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default MyApp;
