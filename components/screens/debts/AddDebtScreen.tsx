"use client"

import { Box } from "@/components/ui/box"
import { HStack } from "@/components/ui/hstack"
import { Input, InputField } from "@/components/ui/input"
import { Pressable } from "@/components/ui/pressable"
import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { authService } from "@/lib/services/authService"
import { useDebtActions } from "@/lib/store/debtStore"
import type { CreateDebtRequest } from "@/lib/types/database"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useCallback, useState } from "react"
import { Alert, ScrollView } from "react-native"

interface AddDebtScreenProps {
  navigation: any
}

interface DebtFormData {
  debtorName: string
  debtorPhoneNumber: string
  principal: string
  interestRate: string
  dueDate: Date
  notes: string
  isExternal: boolean
  externalLenderName: string
}

export default function AddDebtScreen({ navigation }: AddDebtScreenProps) {
  const { createDebt } = useDebtActions()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<DebtFormData>({
    debtorName: "",
    debtorPhoneNumber: "",
    principal: "",
    interestRate: "0",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
    notes: "",
    isExternal: false,
    externalLenderName: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Validate debtor name
    if (!formData.debtorName.trim()) {
      newErrors.debtorName = "Debtor name is required"
    } else if (formData.debtorName.trim().length < 2) {
      newErrors.debtorName = "Name must be at least 2 characters"
    }

    // Validate phone number
    if (!formData.debtorPhoneNumber.trim()) {
      newErrors.debtorPhoneNumber = "Debtor phone number is required"
    } else if (!authService.validatePhoneNumber(formData.debtorPhoneNumber)) {
      newErrors.debtorPhoneNumber = "Please enter a valid Nigerian phone number"
    }

    // Validate principal amount
    if (!formData.principal.trim()) {
      newErrors.principal = "Principal amount is required"
    } else {
      const amount = Number.parseFloat(formData.principal)
      if (isNaN(amount) || amount <= 0) {
        newErrors.principal = "Principal amount must be a positive number"
      } else if (amount > 10000000) {
        // 10 million limit
        newErrors.principal = "Principal amount cannot exceed ₦10,000,000"
      }
    }

    // Validate interest rate
    if (formData.interestRate.trim()) {
      const rate = Number.parseFloat(formData.interestRate)
      if (isNaN(rate) || rate < 0) {
        newErrors.interestRate = "Interest rate must be 0 or positive"
      } else if (rate > 100) {
        newErrors.interestRate = "Interest rate cannot exceed 100%"
      }
    }

    // Validate due date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (formData.dueDate < today) {
      newErrors.dueDate = "Due date cannot be in the past"
    }

    // Validate external lender name if external debt
    if (formData.isExternal && !formData.externalLenderName.trim()) {
      newErrors.externalLenderName = "External lender name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      const principal = Number.parseFloat(formData.principal)
      const interestRate = Number.parseFloat(formData.interestRate) || 0

      const formattedPhone = authService.formatPhoneNumber(formData.debtorPhoneNumber)

      const createRequest: CreateDebtRequest = {
        debtorPhoneNumber: formattedPhone,
        principal,
        interestRate,
        dueDate: formData.dueDate.toISOString(),
        notes: formData.notes.trim() || undefined,
        isExternal: formData.isExternal,
        externalLenderName: formData.isExternal ? formData.externalLenderName.trim() : undefined,
        debtorName: formData.debtorName.trim(),
      }

      const newDebt = await createDebt(createRequest)

      Alert.alert("Debt Created", "The debt has been successfully created and added to your records.", [
        {
          text: "View Details",
          onPress: () => {
            navigation.replace("DebtDetail", { debtId: newDebt.id })
          },
        },
        {
          text: "Add Another",
          onPress: () => {
            // Reset form
            setFormData({
              debtorName: "",
              debtorPhoneNumber: "",
              principal: "",
              interestRate: "0",
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              notes: "",
              isExternal: false,
              externalLenderName: "",
            })
            setErrors({})
          },
        },
        {
          text: "Go Back",
          style: "cancel",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create debt. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [formData, createDebt, navigation])

  const updateField = useCallback(
    (field: keyof DebtFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }))
      }
    },
    [errors],
  )

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const handleDatePress = () => {
    // For simplicity, we'll use a basic date picker
    // In a real app, you might want to use a proper date picker library
    Alert.alert("Select Due Date", "Choose when this debt is due", [
      {
        text: "1 Week",
        onPress: () => updateField("dueDate", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      },
      {
        text: "2 Weeks",
        onPress: () => updateField("dueDate", new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      },
      {
        text: "1 Month",
        onPress: () => updateField("dueDate", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      },
      {
        text: "3 Months",
        onPress: () => updateField("dueDate", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ])
  }

  const calculateTotal = (): number => {
    const principal = Number.parseFloat(formData.principal) || 0
    const rate = Number.parseFloat(formData.interestRate) || 0
    const interest = (principal * rate) / 100
    return principal + interest
  }

  return (
    <Box className="flex-1 bg-background-0">
      <LinearGradient
        colors={["#1A2A4D", "#2D3E6F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 20 }}
      >
        <HStack className="items-center">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <VStack className="ml-4 flex-1">
            <Text size="2xl" className="font-bold text-white">
              Add New Debt
            </Text>
            <Text size="sm" className="text-white/80 mt-1">
              Record money you've lent
            </Text>
          </VStack>
        </HStack>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Box className="px-6 py-6">
          <VStack space="xl">
            <VStack space="md">
              <Text size="md" className="font-semibold text-typography-900">
                Debt Type
              </Text>

              <HStack space="sm">
                <Pressable style={{ flex: 1 }} onPress={() => updateField("isExternal", false)}>
                  <Box
                    className={`p-5 rounded-2xl border-2 ${
                      !formData.isExternal
                        ? "bg-primary-50 border-primary-500"
                        : "bg-background-50 border-background-300"
                    }`}
                    style={{
                      shadowColor: !formData.isExternal ? "#1A2A4D" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: !formData.isExternal ? 4 : 0,
                    }}
                  >
                    <VStack className="items-center">
                      <Box
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          !formData.isExternal ? "bg-primary-100" : "bg-background-100"
                        }`}
                      >
                        <Ionicons name="people" size={24} color={!formData.isExternal ? "#1A2A4D" : "#9CA3AF"} />
                      </Box>
                      <Text
                        size="sm"
                        className={`font-semibold mt-3 ${
                          !formData.isExternal ? "text-primary-900" : "text-typography-600"
                        }`}
                      >
                        Internal Debt
                      </Text>
                      <Text
                        size="xs"
                        className={`text-center mt-1 ${
                          !formData.isExternal ? "text-primary-700" : "text-typography-500"
                        }`}
                      >
                        Between Qred users
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>

                <Pressable style={{ flex: 1 }} onPress={() => updateField("isExternal", true)}>
                  <Box
                    className={`p-5 rounded-2xl border-2 ${
                      formData.isExternal
                        ? "bg-primary-50 border-primary-500"
                        : "bg-background-50 border-background-300"
                    }`}
                    style={{
                      shadowColor: formData.isExternal ? "#1A2A4D" : "transparent",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: formData.isExternal ? 4 : 0,
                    }}
                  >
                    <VStack className="items-center">
                      <Box
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          formData.isExternal ? "bg-primary-100" : "bg-background-100"
                        }`}
                      >
                        <Ionicons name="business" size={24} color={formData.isExternal ? "#1A2A4D" : "#9CA3AF"} />
                      </Box>
                      <Text
                        size="sm"
                        className={`font-semibold mt-3 ${
                          formData.isExternal ? "text-primary-900" : "text-typography-600"
                        }`}
                      >
                        External Debt
                      </Text>
                      <Text
                        size="xs"
                        className={`text-center mt-1 ${
                          formData.isExternal ? "text-primary-700" : "text-typography-500"
                        }`}
                      >
                        With external party
                      </Text>
                    </VStack>
                  </Box>
                </Pressable>
              </HStack>
            </VStack>

            {formData.isExternal && (
              <VStack space="sm">
                <Text size="md" className="font-semibold text-typography-900">
                  Lender Name *
                </Text>
                <Box
                  className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="business-outline" size={20} color="#6B7280" />
                    <Input
                      variant="outline"
                      size="lg"
                      isInvalid={!!errors.externalLenderName}
                      className="flex-1 border-0"
                    >
                      <InputField
                        placeholder="Enter lender/company name"
                        value={formData.externalLenderName}
                        onChangeText={(text) => updateField("externalLenderName", text)}
                        className="text-typography-900"
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.externalLenderName && (
                  <HStack className="items-center">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text size="sm" className="text-error-600 ml-1">
                      {errors.externalLenderName}
                    </Text>
                  </HStack>
                )}
              </VStack>
            )}

            <VStack space="lg">
              <Text size="lg" className="font-bold text-typography-900">
                Debtor Information
              </Text>

              {/* Debtor Name */}
              <VStack space="sm">
                <Text size="md" className="font-semibold text-typography-900">
                  Debtor Name *
                </Text>
                <Box
                  className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <Input variant="outline" size="lg" isInvalid={!!errors.debtorName} className="flex-1 border-0">
                      <InputField
                        placeholder="Enter debtor's full name"
                        value={formData.debtorName}
                        onChangeText={(text) => updateField("debtorName", text)}
                        className="text-typography-900"
                        autoCapitalize="words"
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.debtorName && (
                  <HStack className="items-center">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text size="sm" className="text-error-600 ml-1">
                      {errors.debtorName}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Debtor Phone Number */}
              <VStack space="sm">
                <Text size="md" className="font-semibold text-typography-900">
                  Phone Number *
                </Text>
                <Box
                  className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="call-outline" size={20} color="#6B7280" />
                    <Input
                      variant="outline"
                      size="lg"
                      isInvalid={!!errors.debtorPhoneNumber}
                      className="flex-1 border-0"
                    >
                      <InputField
                        placeholder="+234 801 234 5678"
                        value={formData.debtorPhoneNumber}
                        onChangeText={(text) => updateField("debtorPhoneNumber", text)}
                        keyboardType="phone-pad"
                        className="text-typography-900"
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.debtorPhoneNumber && (
                  <HStack className="items-center">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text size="sm" className="text-error-600 ml-1">
                      {errors.debtorPhoneNumber}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>

            <VStack space="lg">
              <Text size="lg" className="font-bold text-typography-900">
                Amount Details
              </Text>

              {/* Principal Amount */}
              <VStack space="sm">
                <Text size="md" className="font-semibold text-typography-900">
                  Principal Amount *
                </Text>
                <Box
                  className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Text size="lg" className="font-bold text-typography-500">
                      ₦
                    </Text>
                    <Input variant="outline" size="lg" isInvalid={!!errors.principal} className="flex-1 border-0">
                      <InputField
                        placeholder="0.00"
                        value={formData.principal}
                        onChangeText={(text) => updateField("principal", text)}
                        keyboardType="numeric"
                        className="text-typography-900 text-lg font-semibold"
                      />
                    </Input>
                  </HStack>
                </Box>
                {errors.principal && (
                  <HStack className="items-center">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text size="sm" className="text-error-600 ml-1">
                      {errors.principal}
                    </Text>
                  </HStack>
                )}
              </VStack>

              {/* Interest Rate */}
              <VStack space="sm">
                <Text size="md" className="font-semibold text-typography-900">
                  Interest Rate (% per year)
                </Text>
                <Box
                  className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center px-4">
                    <Ionicons name="trending-up-outline" size={20} color="#6B7280" />
                    <Input variant="outline" size="lg" isInvalid={!!errors.interestRate} className="flex-1 border-0">
                      <InputField
                        placeholder="0"
                        value={formData.interestRate}
                        onChangeText={(text) => updateField("interestRate", text)}
                        keyboardType="numeric"
                        className="text-typography-900"
                      />
                    </Input>
                    <Text size="md" className="text-typography-500 font-medium">
                      %
                    </Text>
                  </HStack>
                </Box>
                {errors.interestRate && (
                  <HStack className="items-center">
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text size="sm" className="text-error-600 ml-1">
                      {errors.interestRate}
                    </Text>
                  </HStack>
                )}
                <Text size="sm" className="text-typography-500">
                  Leave as 0 for no interest
                </Text>
              </VStack>

              {Number.parseFloat(formData.principal) > 0 && (
                <LinearGradient
                  colors={["#E8F5E9", "#F1F8F4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#00E676",
                  }}
                >
                  <VStack space="sm">
                    <HStack className="justify-between">
                      <Text size="sm" className="text-success-700 font-medium">
                        Principal Amount:
                      </Text>
                      <Text size="sm" className="font-semibold text-success-900">
                        ₦{Number.parseFloat(formData.principal).toLocaleString()}
                      </Text>
                    </HStack>

                    {Number.parseFloat(formData.interestRate) > 0 && (
                      <HStack className="justify-between">
                        <Text size="sm" className="text-success-700 font-medium">
                          Interest ({formData.interestRate}%):
                        </Text>
                        <Text size="sm" className="font-semibold text-success-900">
                          ₦
                          {(
                            (Number.parseFloat(formData.principal) * Number.parseFloat(formData.interestRate)) /
                            100
                          ).toLocaleString()}
                        </Text>
                      </HStack>
                    )}

                    <Box className="border-t-2 border-success-300 pt-3 mt-2">
                      <HStack className="justify-between items-center">
                        <Text size="md" className="font-bold text-success-800">
                          Total Amount:
                        </Text>
                        <Text size="xl" className="font-bold text-success-900">
                          ₦{calculateTotal().toLocaleString()}
                        </Text>
                      </HStack>
                    </Box>
                  </VStack>
                </LinearGradient>
              )}
            </VStack>

            <VStack space="sm">
              <Text size="md" className="font-semibold text-typography-900">
                Due Date *
              </Text>
              <Pressable onPress={handleDatePress}>
                <Box
                  className="p-4 rounded-xl border-2 border-background-300 bg-white"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <HStack className="items-center justify-between">
                    <HStack className="items-center">
                      <Ionicons name="calendar-outline" size={20} color="#1A2A4D" />
                      <Text size="md" className="text-typography-900 font-medium ml-3">
                        {formatDateForDisplay(formData.dueDate)}
                      </Text>
                    </HStack>
                    <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                  </HStack>
                </Box>
              </Pressable>
              {errors.dueDate && (
                <HStack className="items-center">
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text size="sm" className="text-error-600 ml-1">
                    {errors.dueDate}
                  </Text>
                </HStack>
              )}
            </VStack>

            <VStack space="sm">
              <Text size="md" className="font-semibold text-typography-900">
                Notes (Optional)
              </Text>
              <Box
                className="rounded-xl border-2 border-background-300 bg-white overflow-hidden"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Input variant="outline" size="lg" className="border-0">
                  <InputField
                    placeholder="Add any additional notes or context..."
                    value={formData.notes}
                    onChangeText={(text) => updateField("notes", text)}
                    multiline
                    numberOfLines={3}
                    className="text-typography-900 p-4"
                    style={{ minHeight: 100 }}
                  />
                </Input>
              </Box>
              <Text size="sm" className="text-typography-500">
                Optional details about the debt arrangement
              </Text>
            </VStack>

            <Box className="pt-4 pb-8">
              <Pressable onPress={handleSubmit} disabled={isLoading}>
                <LinearGradient
                  colors={["#1A2A4D", "#2D3E6F"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 18,
                    borderRadius: 16,
                    shadowColor: "#1A2A4D",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <HStack className="items-center justify-center">
                    <Ionicons name="add-circle" size={22} color="white" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {isLoading ? "Creating Debt..." : "Create Debt"}
                    </Text>
                  </HStack>
                </LinearGradient>
              </Pressable>
            </Box>
          </VStack>
        </Box>
      </ScrollView>
    </Box>
  )
}
