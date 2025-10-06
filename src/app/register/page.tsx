"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nisMembershipNumber: "",
    surconRegistrationNumber: "",
    password: "",
    firmName: "",
    phoneNumber: "",
    address: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Uppercase and trim specific fields
    const nextValue =
      name === "nisMembershipNumber" || name === "surconRegistrationNumber"
        ? value.toUpperCase().trim()
        : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const NIS_REGEX = /^NIS\/[A-Z]{2}\/\d{4}$/;
  const SURCON_REGEX = /^R-\d{4}$/;

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 2) {
      nextErrors.name = "Enter your full name";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!NIS_REGEX.test(formData.nisMembershipNumber)) {
      nextErrors.nisMembershipNumber = "Format: NIS/FM/2876";
    }
    if (!SURCON_REGEX.test(formData.surconRegistrationNumber)) {
      nextErrors.surconRegistrationNumber = "Format: R-2846";
    }
    if (!formData.password || formData.password.length < 8) {
      nextErrors.password = "At least 8 characters";
    }
    if (confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phoneNumber || formData.phoneNumber.trim().length < 10) {
      nextErrors.phoneNumber = "Enter a valid phone number";
    }
    if (!formData.address || formData.address.trim().length < 10) {
      nextErrors.address = "Enter a detailed address";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validate()) {
        toast.error("Please fix the highlighted fields");
        setIsLoading(false);
        return;
      }
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          "Registration Successful. Your account has been created. Please wait for verification."
        );
        router.push("/login");
      } else {
        const error = await response.json();
        toast.error(error.message || "An error occurred");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Register as Surveyor</CardTitle>
          <CardDescription>
            Create your account for Rivers State Cadastral Survey Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nisMembershipNumber">
                  NIS Membership Number *
                </Label>
                <Input
                  id="nisMembershipNumber"
                  name="nisMembershipNumber"
                  placeholder="e.g. NIS/FM/2876"
                  value={formData.nisMembershipNumber}
                  onChange={handleChange}
                  required
                />
                {errors.nisMembershipNumber && (
                  <p className="text-xs text-red-600">
                    {errors.nisMembershipNumber}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="surconRegistrationNumber">
                  SURCON Registration Number *
                </Label>
                <Input
                  id="surconRegistrationNumber"
                  name="surconRegistrationNumber"
                  placeholder="e.g. R-2846"
                  value={formData.surconRegistrationNumber}
                  onChange={handleChange}
                  required
                />
                {errors.surconRegistrationNumber && (
                  <p className="text-xs text-red-600">
                    {errors.surconRegistrationNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firmName">Firm Name (Optional)</Label>
              <Input
                id="firmName"
                name="firmName"
                placeholder="Enter your firm name (optional)"
                value={formData.firmName}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter your complete address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              {errors.address && (
                <p className="text-xs text-red-600">{errors.address}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
