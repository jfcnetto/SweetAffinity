import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';

interface MatchEmailProps {
  name: string;
  matchedUserName: string;
}

export const MatchEmail: React.FC<MatchEmailProps> = ({ name = 'Membro', matchedUserName = 'Alguém Especial' }) => (
  <Html>
    <Head />
    <Preview>Você tem um novo Match na Sweet Affinity!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>💖 Novo Match!</Heading>
        </Section>
        <Section style={bodyContent}>
          <Text style={text}>Olá, {name},</Text>
          <Text style={text}>
            Temos ótimas notícias! Você e <strong>{matchedUserName}</strong> curtiram os perfis um do outro.
          </Text>
          <Text style={text}>
            Este é o momento perfeito para enviar a primeira mensagem. Lembra-se: gentileza e 
            clareza nas intenções são a chave para o sucesso na Sweet Affinity.
          </Text>
          <Section style={btnContainer}>
            <Button style={button} href="https://sweetaffinity.com/matches">
              Ver Match e Enviar Mensagem
            </Button>
          </Section>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} Sweet Affinity.
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
const bodyContent = { padding: '32px' };
const h1 = { color: '#db2777', fontSize: '24px', fontWeight: 'bold', margin: '0' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px' };
const btnContainer = { textAlign: 'center' as const, marginTop: '24px', marginBottom: '24px' };
const button = {
  backgroundColor: '#db2777',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '12px 24px',
};
const footer = { padding: '0 32px', textAlign: 'center' as const };
const footerText = { color: '#8898aa', fontSize: '12px' };

export default MatchEmail;
