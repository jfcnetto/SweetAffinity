import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button, Img, Link as EmailLink } from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name = 'Membro' }) => (
  <Html>
    <Head />
    <Preview>Bem-vindo ao mundo Sweet Affinity!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>Bem-vindo(a) à Sweet Affinity!</Heading>
        </Section>
        <Section style={bodyContent}>
          <Text style={text}>Olá, {name},</Text>
          <Text style={text}>
            Ficamos muito felizes em ter você na plataforma que conecta pessoas bem-sucedidas 
            e ambiciosas para relacionamentos de alto nível.
          </Text>
          <Text style={text}>
            Nossa missão é garantir que suas expectativas sejam claras desde o primeiro "Olá".
            Aqui você encontrará segurança, verificação rígida e perfis reais.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href="https://sweetaffinity.com/feed">
              Ver Perfis Agora
            </Button>
          </Section>
          <Text style={text}>
            Se tiver alguma dúvida, nossa equipe de suporte está sempre pronta para ajudar.
          </Text>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Sweet Affinity. Todos os direitos reservados.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px',
  backgroundColor: '#fff',
  textAlign: 'center' as const,
  borderBottom: '1px solid #eaeaea',
};

const bodyContent = {
  padding: '32px',
};

const h1 = {
  color: '#db2777', // pink-600
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
};

const button = {
  backgroundColor: '#db2777', // pink-600
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footer = {
  padding: '0 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
};

export default WelcomeEmail;
