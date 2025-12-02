"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Copy, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TwoFactorSetupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function TwoFactorSetupDialog({ open, onOpenChange, onComplete }: TwoFactorSetupDialogProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes] = useState([
    "ABCD-1234-EFGH",
    "IJKL-5678-MNOP",
    "QRST-9012-UVWX",
    "YZAB-3456-CDEF",
    "GHIJ-7890-KLMN",
    "OPQR-1234-STUV",
    "WXYZ-5678-ABCD",
    "EFGH-9012-IJKL",
    "MNOP-3456-QRST",
    "UVWX-7890-YZAB",
  ])

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      setStep(3)
    } else {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      })
    }
  }

  const handleComplete = () => {
    onComplete()
    onOpenChange(false)
    toast({
      title: "Two-factor authentication enabled",
      description: "Your account is now more secure",
    })
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    toast({
      title: "Backup codes copied",
      description: "Store them in a safe place",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>Add an extra layer of security to your account</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">QR Code</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-foreground/70">Scan this QR code with your authenticator app</p>
                <p className="text-xs text-foreground/50">
                  Or enter this code manually:{" "}
                  <code className="bg-secondary px-2 py-1 rounded">ABCD EFGH IJKL MNOP</code>
                </p>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter 6-digit code from your app</Label>
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>
            <Button onClick={handleVerify} className="w-full">
              Verify
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Alert className="bg-emerald-500/10 border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-400">
                2FA setup successful! Save your backup codes below.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button size="sm" variant="ghost" onClick={copyBackupCodes}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg space-y-1 max-h-48 overflow-y-auto">
                {backupCodes.map((code, i) => (
                  <p key={i} className="text-sm font-mono">
                    {code}
                  </p>
                ))}
              </div>
            </div>
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-400">
                Store these codes in a safe place. You'll need them if you lose access to your authenticator app.
              </AlertDescription>
            </Alert>
            <Button onClick={handleComplete} className="w-full">
              Complete Setup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
