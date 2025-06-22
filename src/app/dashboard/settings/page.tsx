import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Database,
  Mail,
  Shield,
  Bell,
  FileText,
  Users,
  MapPin,
  Save,
  RefreshCw,
} from "lucide-react";

export default async function SystemSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage platform configuration and system settings
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                Configure basic platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    defaultValue="Rivers State Cadastral Survey Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformUrl">Platform URL</Label>
                  <Input
                    id="platformUrl"
                    defaultValue="https://cadastral.rivers.gov.ng"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformDescription">
                  Platform Description
                </Label>
                <Textarea
                  id="platformDescription"
                  defaultValue="A comprehensive platform for surveyors, NIS officers, and the Surveyor General's office to streamline cadastral survey processes in Rivers State, Nigeria."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    defaultValue="support@cadastral.rivers.gov.ng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input id="supportPhone" defaultValue="+234 84 123 4567" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
              <CardDescription>
                Configure file upload limits and allowed types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                  <Input id="maxFileSize" type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxFiles">Maximum Files per Job</Label>
                  <Input id="maxFiles" type="number" defaultValue="10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedTypes">Allowed File Types</Label>
                <Input
                  id="allowedTypes"
                  defaultValue="pdf,doc,docx,xls,xlsx,csv,jpg,jpeg,png,zip"
                />
                <p className="text-sm text-gray-500">
                  Comma-separated list of allowed file extensions
                </p>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP Configuration
              </CardTitle>
              <CardDescription>
                Configure email server settings for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input id="smtpHost" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" type="number" placeholder="587" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    type="email"
                    placeholder="noreply@cadastral.rivers.gov.ng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="smtpTls" />
                <Label htmlFor="smtpTls">Use TLS/SSL</Label>
              </div>

              <div className="flex justify-between">
                <Button variant="outline">Test Connection</Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize email templates for different notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    Job Submission Confirmation
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent to surveyors when they submit a new job
                  </p>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Job Status Update</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when job status changes
                  </p>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Surveyor Verification</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when surveyor account is verified
                  </p>
                  <Button variant="outline" size="sm">
                    Edit Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and how notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Job Submission Alerts</h4>
                    <p className="text-sm text-gray-600">
                      Notify NIS officers when new jobs are submitted
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Status Change Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Notify users when job status changes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Overdue Job Reminders</h4>
                    <p className="text-sm text-gray-600">
                      Send reminders for jobs pending review
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">System Maintenance Alerts</h4>
                    <p className="text-sm text-gray-600">
                      Notify users about system updates
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="reminderInterval">
                    Reminder Interval (hours)
                  </Label>
                  <Input
                    id="reminderInterval"
                    type="number"
                    defaultValue="24"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxReminders">Maximum Reminders</Label>
                  <Input id="maxReminders" type="number" defaultValue="3" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Workflow Configuration
              </CardTitle>
              <CardDescription>
                Configure survey job workflow steps and timeouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Workflow Steps</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Submitted</h5>
                      <p className="text-sm text-gray-600">
                        Job submitted by surveyor
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Auto-complete</span>
                      <Switch defaultChecked disabled />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">NIS Review</h5>
                      <p className="text-sm text-gray-600">
                        Review by NIS officer
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Input className="w-20" placeholder="7" />
                      <span className="text-sm">days timeout</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Admin Review</h5>
                      <p className="text-sm text-gray-600">
                        Final approval by admin
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Input className="w-20" placeholder="5" />
                      <span className="text-sm">days timeout</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">Pillar Number Assignment</h5>
                      <p className="text-sm text-gray-600">
                        Assign pillar number
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Input className="w-20" placeholder="2" />
                      <span className="text-sm">days timeout</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Auto-Assignment Rules</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Load Balancing</h5>
                    <p className="text-sm text-gray-600">
                      Automatically distribute jobs among NIS officers
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security settings and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">
                      Require 2FA for admin accounts
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Session Timeout</h4>
                    <p className="text-sm text-gray-600">
                      Automatically log out inactive users
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input className="w-20" defaultValue="60" />
                    <span className="text-sm">minutes</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Login Attempts Limit</h4>
                    <p className="text-sm text-gray-600">
                      Maximum failed login attempts
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input className="w-20" defaultValue="5" />
                    <span className="text-sm">attempts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Password Policy</h4>
                    <p className="text-sm text-gray-600">
                      Enforce strong password requirements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedDomains">Allowed Email Domains</Label>
                <Input id="allowedDomains" placeholder="gov.ng,nis.gov.ng" />
                <p className="text-sm text-gray-500">
                  Comma-separated list of allowed email domains
                </p>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Management
              </CardTitle>
              <CardDescription>
                Monitor and manage database operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Database Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Users:</span>
                      <span className="text-sm font-medium">142</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Jobs:</span>
                      <span className="text-sm font-medium">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Documents:</span>
                      <span className="text-sm font-medium">267</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Database Size:</span>
                      <span className="text-sm font-medium">1.2 GB</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Backup Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto Backup</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Frequency:</span>
                      <Input className="w-20" defaultValue="24" />
                      <span className="text-sm">hours</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Retention:</span>
                      <Input className="w-20" defaultValue="30" />
                      <span className="text-sm">days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Database Operations</h4>
                <div className="flex space-x-4">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Backup Now
                  </Button>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button variant="outline">Export Data</Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Danger Zone
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  These operations are irreversible. Proceed with caution.
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Reset Database
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
