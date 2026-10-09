import React from "react"
import { IntegrationsReadiness } from "@/components/settings/IntegrationsReadiness"

export const IntegrationsSettingsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <IntegrationsReadiness />
    </div>
  )
}
