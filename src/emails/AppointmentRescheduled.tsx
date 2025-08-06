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

interface AppointmentRescheduledEmailProps {
  customerName?: string;
  originalDate?: Date;
  newDate?: Date;
  rescheduleReason?: string;
  websiteName?: string;
  confirmationUrl?: string; // 用户确认修改的链接
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const AppointmentRescheduledEmail = ({
  customerName = "尊贵的客户",
  originalDate = new Date(),
  newDate = new Date(),
  rescheduleReason,
  websiteName = "我们的团队",
  confirmationUrl = `${baseUrl}/appointment/confirm`,
}: AppointmentRescheduledEmailProps) => {
  const previewText = `您的预约时间已更新 - ${websiteName}`;

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
          <Heading style={heading}>您的预约时间已更新</Heading>
          <Section style={body}>
            <Text style={paragraph}>尊敬的 {customerName},</Text>
            <Text style={paragraph}>
              我们希望通知您，您在 **{websiteName}** 的预约时间已由我方提出修改建议。
            </Text>

            {rescheduleReason && (
              <>
                <Text style={paragraph}>
                  <strong>修改原因：</strong>
                </Text>
                <Text style={callout}>{rescheduleReason}</Text>
              </>
            )}

            <Hr style={hr} />

            <div style={timeSection}>
              <div style={timeItem}>
                <Text style={timeLabel}>原定时间：</Text>
                <Text style={timeValueOld}>
                  {new Date(originalDate).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>
              <div style={timeItem}>
                <Text style={timeLabel}>建议新时间：</Text>
                <Text style={timeValueNew}>
                  {new Date(newDate).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </div>
            </div>

            <Hr style={hr} />

            <Text style={paragraph}>
              请点击下方按钮以确认您接受新的预约时间。如果您不同意此修改，请直接回复此邮件与我们联系。
            </Text>

            <Button style={button} href={confirmationUrl}>
              确认新时间
            </Button>
          </Section>

          <Text style={footer}>
            © {new Date().getFullYear()} {websiteName}. 保留所有权利。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AppointmentRescheduledEmail;

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
  backgroundColor: "#fefce8",
  borderLeft: "4px solid #facc15",
  padding: "10px 15px",
  margin: "20px 0",
  borderRadius: "4px",
};

const timeSection = {
  padding: "16px 0",
};

const timeItem = {
  marginBottom: "12px",
};

const timeLabel = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0 0 4px 0",
};

const timeValue = {
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const timeValueOld = {
  ...timeValue,
  color: "#ef4444",
  textDecoration: "line-through",
};

const timeValueNew = {
  ...timeValue,
  color: "#22c55e",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "20px 0",
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

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "1.5",
  textAlign: "center" as const,
}; 