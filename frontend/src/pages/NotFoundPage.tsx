import React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CreatorBridgeLogo } from "@/components/common/CreatorBridgeLogo"

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 min-h-[60vh]">
      <div className="mb-6">
        <CreatorBridgeLogo size="md" />
      </div>
      <h1 className="text-7xl font-black text-[#9A6ADF] mb-2 tracking-tight">404</h1>
      <h2 className="text-2xl font-extrabold text-[#111111] mb-2">Page Not Found</h2>
      <p className="text-[#4B4652] max-w-sm mb-6 text-sm">
        The requested screen does not exist or may have been relocated.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Marketplace</Button>
      </Link>
    </div>
  )
}
