import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";

// Importiamo le schermate
import HomeScreen from "../screens/HomeScreen";
import ClientsScreen from "../screens/ClientsScreen";
import ProductsScreen from "../screens/ProductsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import NewClientScreen from "../screens/NewClientScreen";
import NewProductScreen from "../screens/NewProductScreen";
import NewOrderScreen from "../screens/NewOrderScreen";
import EditOrderScreen from "../screens/EditOrderScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* ✅ Home principale */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "🏠 Home" }} />

        {/* ✅ Sezione Clienti */}
        <Stack.Screen name="Clients" component={ClientsScreen} options={{ title: "👥 Clienti" }} />
        <Stack.Screen name="NewClient" component={NewClientScreen} options={{ title: "➕ Aggiungi Cliente" }} />

        {/* ✅ Sezione Prodotti */}
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "📦 Prodotti" }} />
        <Stack.Screen name="NewProduct" component={NewProductScreen} options={{ title: "➕ Aggiungi Prodotto" }} />

        {/* ✅ Sezione Ordini */}
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "🛒 Ordini" }} />
        <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: "➕ Nuovo Ordine" }} />
        <Stack.Screen name="EditOrder" component={EditOrderScreen} options={{ title: "📝 Modifica Ordine" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
