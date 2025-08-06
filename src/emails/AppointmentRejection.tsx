import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface AppointmentRejectionEmailProps {
  customerName?: string;
  appointmentDate?: Date;
  rejectionReason?: string;
  websiteName?: string;
  websiteUrl?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const AppointmentRejectionEmail = ({
  customerName = "尊贵的客户",
  appointmentDate = new Date(),
  rejectionReason = "由于日程冲突，我们无法接受您的预约。",
  websiteName = "我们的团队",
  websiteUrl = baseUrl,
}: AppointmentRejectionEmailProps) => (
  <Html>
    <Head />
    <Preview>关于您的预约请求</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`}
          width="40"
          height="40"
          alt="Logo"
          style={logo}
        />
        <Heading style={heading}>关于您的预约请求</Heading>
        <Section style={section}>
          <Text style={text}>尊敬的 {customerName},</Text>
          <Text style={text}>
            我们非常抱歉地通知您，我们无法确认您于 **{new Date(appointmentDate).toLocaleString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}** 的预约请求。
          </Text>
          {rejectionReason && (
            <Text style={reasonText}>
              原因：{rejectionReason}
            </Text>
          )}
          <Text style={text}>
            给您带来的不便，我们深表歉意。如果您希望重新安排，或有任何其他问题，请随时与我们联系。
          </Text>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} {websiteName}. 保留所有权利。
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AppointmentRejectionEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  textAlign: 'center' as const,
  color: '#4a4a4a',
};

const section = {
  padding: '0 48px',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
};

const reasonText = {
  ...text,
  backgroundColor: '#fffbe6',
  borderLeft: '4px solid #facc15',
  padding: '10px 15px',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
}; 