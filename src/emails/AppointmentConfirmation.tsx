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
  Button,
} from '@react-email/components';
import * as React from 'react';

interface AppointmentConfirmationEmailProps {
  customerName?: string;
  appointmentDate?: Date;
  websiteName?: string;
  websiteUrl?: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const AppointmentConfirmationEmail = ({
  customerName = "尊贵的客户",
  appointmentDate = new Date(),
  websiteName = "我们的团队",
  websiteUrl = baseUrl,
}: AppointmentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>您的预约已确认！</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`}
          width="40"
          height="40"
          alt="Logo"
          style={logo}
        />
        <Heading style={heading}>您的预约已确认！</Heading>
        <Section style={section}>
          <Text style={text}>尊敬的 {customerName},</Text>
          <Text style={text}>
            我们很高兴地通知您，您在 **{websiteName}** 的预约已经成功确认。
          </Text>
          <Text style={text}>
            预约时间为：**{new Date(appointmentDate).toLocaleString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}**
          </Text>
          <Text style={text}>
            我们期待届时与您见面。如果您需要重新安排或取消预约，请直接回复此邮件或访问我们的网站。
          </Text>
          <Button style={button} href={websiteUrl}>
            访问我们的网站
          </Button>
        </Section>
        <Text style={footer}>
          © {new Date().getFullYear()} {websiteName}. 保留所有权利。
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AppointmentConfirmationEmail;

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
  color: '#2c3e50',
};

const section = {
  padding: '0 48px',
};

const text = {
  color: '#334155',
  fontSize: '16px',
  lineHeight: '1.6',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '15px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px 20px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '1.5',
  textAlign: 'center' as const,
}; 