import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, FileText, Users, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-xs">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Rivers State Cadastral Survey</h1>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">Digitizing Cadastral Survey Documentation</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A comprehensive platform for surveyors, NIS officers, and the Surveyor General's office to streamline
            cadastral survey processes in Rivers State, Nigeria.
          </p>
          <div className="space-x-4">
            <Link href="/search">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Search Pillar Numbers
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                Register as Surveyor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Platform Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Survey Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Submit, track, and manage cadastral survey jobs with digital documentation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Multi-Role Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Separate portals for surveyors, NIS officers, and administrative staff.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Pillar Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Search and verify pillar numbers with coordinate information.</CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Secure Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Multi-step approval process ensuring quality and compliance.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-6 w-6" />
                <span className="text-lg font-semibold">Rivers State Cadastral Survey</span>
              </div>
              <p className="text-gray-400">Modernizing cadastral survey processes for Rivers State, Nigeria.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/search" className="hover:text-white">
                    Search Pillars
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <p className="text-gray-400">
                Surveyor General's Office
                <br />
                Rivers State, Nigeria
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Rivers State Government. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
