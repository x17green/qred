import React from "react";
import RoleBasedDashboard from "./RoleBasedDashboard";

interface DashboardScreenProps {
  navigation: any;
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  return <RoleBasedDashboard navigation={navigation} />;
}
