"use client";

import { Button } from "@/components/ui/button";
import { Mail, Phone, Copy } from "lucide-react";
import { toast } from "sonner";

interface ContactSurveyorButtonProps {
  surveyorName: string;
  surveyorEmail: string;
  surveyorPhone?: string;
}

export function ContactSurveyorButton({
  surveyorName,
  surveyorEmail,
  surveyorPhone,
}: ContactSurveyorButtonProps) {
  const handleEmailContact = () => {
    const subject = encodeURIComponent(`Survey Inquiry - ${surveyorName}`);
    const body = encodeURIComponent(
      `Hello ${surveyorName},\n\nI am interested in your surveying services for a project in Rivers State.\n\nPlease let me know your availability and rates.\n\nThank you.`
    );
    window.open(
      `mailto:${surveyorEmail}?subject=${subject}&body=${body}`,
      "_blank"
    );
  };

  const handlePhoneCall = () => {
    if (surveyorPhone) {
      window.open(`tel:${surveyorPhone}`, "_blank");
    }
  };

  const handleCopyContact = async () => {
    const contactInfo = `${surveyorName}\nEmail: ${surveyorEmail}${surveyorPhone ? `\nPhone: ${surveyorPhone}` : ""}`;
    try {
      await navigator.clipboard.writeText(contactInfo);
      toast.success("Contact information copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy contact information");
    }
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={handleEmailContact}>
        <Mail className="h-4 w-4 mr-2" />
        Send Email
      </Button>

      <div className="grid grid-cols-2 gap-2">
        {surveyorPhone && (
          <Button variant="outline" size="sm" onClick={handlePhoneCall}>
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleCopyContact}>
          <Copy className="h-4 w-4 mr-1" />
          Copy Info
        </Button>
      </div>
    </div>
  );
}
