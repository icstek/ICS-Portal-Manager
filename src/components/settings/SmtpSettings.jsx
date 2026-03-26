import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function SmtpSettings() {
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '587',
    user: '',
    password: '',
    fromEmail: ''
  });
  const [testResult, setTestResult] = useState(null);

  const handleInputChange = (field, value) => {
    setSmtpConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConfig = () => {
    if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password || !smtpConfig.fromEmail) {
      setTestResult({ success: false, message: 'Please fill in all SMTP fields' });
      toast.error('Please fill in all SMTP fields');
      return;
    }

    if (isNaN(smtpConfig.port) || smtpConfig.port < 1 || smtpConfig.port > 65535) {
      setTestResult({ success: false, message: 'Port must be a valid number between 1 and 65535' });
      toast.error('Invalid port number');
      return;
    }

    if (!smtpConfig.fromEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid email address' });
      toast.error('Invalid email address');
      return;
    }

    // Validation passed
    setTestResult({ success: true, message: 'SMTP configuration validated. Now save these settings in Dashboard Settings → Environment Variables.' });
    toast.success('Configuration is valid. Save to environment variables.');
  };

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <CardTitle>SMTP Configuration</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">SMTP Host</label>
            <input
              type="text"
              placeholder="smtp.gmail.com"
              value={smtpConfig.host}
              onChange={(e) => handleInputChange('host', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Port</label>
              <input
                type="number"
                value={smtpConfig.port}
                onChange={(e) => handleInputChange('port', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                placeholder="your-email@gmail.com"
                value={smtpConfig.user}
                onChange={(e) => handleInputChange('user', e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={smtpConfig.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">From Email</label>
            <input
              type="email"
              placeholder="noreply@company.com"
              value={smtpConfig.fromEmail}
              onChange={(e) => handleInputChange('fromEmail', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        {testResult && (
          <div className={`flex items-start gap-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="text-sm">
              <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>{testResult.message}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
          <p className="font-medium mb-2">After testing:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Go to Dashboard Settings → Environment Variables</li>
            <li>Update: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL</li>
            <li>Save the changes</li>
          </ol>
        </div>

        <Button 
          onClick={handleTestConfig} 
          className="w-full"
        >
          Validate Configuration
        </Button>
      </CardContent>
    </Card>
  );
}