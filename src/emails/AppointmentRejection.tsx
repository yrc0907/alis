import {
  Body,
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

interface AppointmentRejectionEmailProps {
  customerName?: string;
  appointmentDate?: Date;
  rejectionReason?: string;
  websiteName?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const AppointmentRejectionEmail = ({
  customerName = "尊贵的客户",
  appointmentDate = new Date(),
  rejectionReason = "由于日程冲突，我们无法接受您的预约。",
  websiteName = "我们的团队",
}: AppointmentRejectionEmailProps) => {
  const previewText = `关于您在 ${websiteName} 的预约请求`;

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
          <Heading style={heading}>关于您的预约请求</Heading>
          <Section style={body}>
            <Text style={paragraph}>尊敬的 {customerName},</Text>
            <Text style={paragraph}>
              我们非常抱歉地通知您，我们无法确认您于{" "}
              <strong>
                {new Date(appointmentDate).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>{" "}
              的预约请求。
            </Text>

            {rejectionReason && (
              <>
                <Text style={paragraph}>
                  <strong>拒绝原因：</strong>
                </Text>
                <Text style={callout}>{rejectionReason}</Text>
              </>
            )}
            <Text style={paragraph}>
              给您带来的不便，我们深表歉意。如果您希望重新安排，或有任何其他问题，请随时与我们联系。
            </Text>
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

export default AppointmentRejectionEmail;

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
  backgroundColor: "#fffbe6",
  borderLeft: "4px solid #facc15",
  padding: "10px 15px",
  margin: "20px 0",
  borderRadius: "4px",
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