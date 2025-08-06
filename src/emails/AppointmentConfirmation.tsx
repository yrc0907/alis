import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AppointmentConfirmationEmailProps {
  customerName?: string;
  appointmentDate?: Date;
  websiteName?: string;
  websiteUrl?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const AppointmentConfirmationEmail = ({
  customerName = "尊贵的客户",
  appointmentDate = new Date(),
  websiteName = "我们的团队",
  websiteUrl = baseUrl,
}: AppointmentConfirmationEmailProps) => {
  const previewText = `您的预约已确认 - ${websiteName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${baseUrl}/logo.svg`}
            width="48"
            height="48"
            alt="Logo"
            style={logo}
          />
          <Heading style={heading}>您的预约已确认！</Heading>
          <Section style={body}>
            <Text style={paragraph}>尊敬的 {customerName},</Text>
            <Text style={paragraph}>
              我们很高兴地通知您，您在 **{websiteName}** 的预约已经成功确认。
            </Text>
            <Text style={callout}>
              <strong>预约时间：</strong>
              {new Date(appointmentDate).toLocaleString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text style={paragraph}>
              我们期待届时与您见面。如果您需要重新安排或取消预约，请直接回复此邮件或访问我们的网站。
            </Text>
            <Button style={button} href={websiteUrl}>
              访问我们的网站
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} {websiteName}. 保留所有权利。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AppointmentConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const logo = {
  margin: "0 auto",
  width: 48,
  height: 48,
};

const heading = {
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  textAlign: "center" as const,
  color: "#2c3e50",
  padding: "0 20px",
};

const body = {
  padding: "0 40px",
};

const paragraph = {
  color: "#334155",
  fontSize: "16px",
  lineHeight: "1.6",
};

const callout = {
  ...paragraph,
  backgroundColor: "#f1f5f9",
  borderLeft: "4px solid #64748b",
  padding: "10px 15px",
  margin: "20px 0",
  borderRadius: "4px",
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "12px 20px",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center" as const,
}; 