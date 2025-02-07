import { registerRootComponent } from "expo";
import AppNavigator from "./src/navigation/AppNavigator";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <>
      <AppNavigator />
      <Toast />
    </>
  );
}


// Assicuriamoci che il componente principale venga registrato
registerRootComponent(App);
