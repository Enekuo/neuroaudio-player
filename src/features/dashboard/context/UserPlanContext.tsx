import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type UserPlan = 'free' | 'premium'

type UserPlanContextValue = {
  userPlan: UserPlan
  setUserPlan: (plan: UserPlan) => void
}

const UserPlanContext = createContext<UserPlanContextValue | undefined>(undefined)

export function UserPlanProvider({ children }: { children: ReactNode }) {
  const [userPlan, setUserPlan] = useState<UserPlan>('premium')

  const value = useMemo(
    () => ({
      userPlan,
      setUserPlan,
    }),
    [userPlan],
  )

  return <UserPlanContext.Provider value={value}>{children}</UserPlanContext.Provider>
}

export function useUserPlan() {
  const context = useContext(UserPlanContext)

  if (!context) {
    throw new Error('useUserPlan must be used within a UserPlanProvider')
  }

  return context
}
