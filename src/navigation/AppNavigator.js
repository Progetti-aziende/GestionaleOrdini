import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import ClientsScreen from "../screens/ClientsScreen";
import ProductsScreen from "../screens/ProductsScreen";
import OrdersScreen from "../screens/OrdersScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Clients" component={ClientsScreen} options={{ title: "👥 Clienti" }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "📦 Prodotti" }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "📝 Ordini" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
