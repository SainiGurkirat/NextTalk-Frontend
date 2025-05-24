import '../../styles/globals.css'; // Corrected path for globals.css
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <Component {...pageProps} />
      </SocketProvider>
    </AuthProvider>
  );
};

export default MyApp;