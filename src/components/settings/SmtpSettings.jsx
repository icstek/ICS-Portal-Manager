import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

export default function SmtpSettings() {
  const [smtpConfig, setSmtpConfig] = useState({
    apiKey: '',
    fromEmail: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleInputChange = (field, value) => {
    setSmtpConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConfig = async () => {
    if (!smtpConfig.apiKey || !smtpConfig.fromEmail) {
      toast.error('Please fill in all fields');
      return;
    }

    setTesting(true);
    try {
      const response = await base44.functions.invoke('testSmtpConfig', {
        apiKey: smtpConfig.apiKey,
        fromEmail: smtpConfig.fromEmail
      });

      if (response.data.success) {
        setTestResult({ 
          success: true, 
          message: response.data.message,
          details: response.data.details 
        });
        toast.success('SMTP configuration is valid');
      } else {
        setTestResult({ 
          success: false, 
          message: response.data.error,
          details: response.data.details 
        });
        toast.error('SMTP test failed: ' + response.data.error);
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      setTestResult({ 
        success: false, 
        message: errorData.error || error.message || 'Failed to test SMTP configuration',
        details: errorData.details 
      });
      toast.error('SMTP test failed');
    } finally {
      setTesting(false);
      setShowDetails(false);
    }
  };

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <CardTitle>Email Configuration (Resend)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Resend API Key</label>
            <input
              type="password"
              placeholder="re_xxxxxxxxxxxx"
              value={smtpConfig.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Get your API key from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a></p>
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
          <div className="space-y-3">
            <div className={`flex items-start gap-3 p-3 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="text-sm flex-1">
                <p className={testResult.success ? 'text-green-800' : 'text-red-800'}>{testResult.message}</p>
              </div>
            </div>

            {testResult.details && !testResult.success && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between"
              >
                <span>Details</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
              </Button>
            )}

            {showDetails && testResult.details && (
              <div className="bg-slate-900 text-slate-100 rounded-md p-3 font-mono text-xs space-y-2 max-h-64 overflow-auto">
                {testResult.details.timestamp && (
                  <div><span className="text-slate-400">Timestamp:</span> {testResult.details.timestamp}</div>
                )}
                {testResult.details.code && (
                  <div><span className="text-slate-400">Error Code:</span> {testResult.details.code}</div>
                )}
                {testResult.details.errorName && (
                  <div><span className="text-slate-400">Error Name:</span> {testResult.details.errorName}</div>
                )}
                {testResult.details.errorMessage && (
                  <div><span className="text-slate-400">Error Message:</span> {testResult.details.errorMessage}</div>
                )}
                {testResult.details.fullError && (
                  <div><span className="text-slate-400">Full Error:</span> {testResult.details.fullError}</div>
                )}
                {testResult.details.errorStack && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="text-slate-400 mb-1">Stack Trace:</div>
                    <pre className="whitespace-pre-wrap break-words">{testResult.details.errorStack}</pre>
                  </div>
                )}
                {testResult.details.fields && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="text-slate-400 mb-1">Field Status:</div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(testResult.details.fields, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-900">
          <p className="font-medium mb-2">After testing:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Go to Dashboard Settings → Environment Variables</li>
            <li>Update: RESEND_API_KEY, RESEND_FROM_EMAIL</li>
            <li>Save the changes</li>
          </ol>
        </div>

        <Button 
          onClick={handleTestConfig} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            'Test Configuration'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}