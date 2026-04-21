import { SignInScreen } from '../../presentation/screens/SignInScreen';
import { HomeScreen } from '../../presentation/screens/HomeScreen';
import { useAppSession } from '../session/useAppSession';

export const AppRouter = () => {
  const { currentUser } = useAppSession();

  if (!currentUser) {
    return <SignInScreen />;
  }

  return <HomeScreen currentUser={currentUser} />;
};
